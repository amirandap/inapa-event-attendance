import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  handleCors,
  getRequestBody,
  paginatedResponse,
  createdResponse,
  getSearchParams,
  parseQueryParams
} from '@/lib/api/responses'
import { 
  createCheckinSchema, 
  paginationSchema,
  searchSchema
} from '@/lib/api/validations'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = getSearchParams(request)
    const queryParams = parseQueryParams(searchParams)
    
    // Validar parámetros de paginación
    const paginationResult = paginationSchema.safeParse({
      page: queryParams.page || 1,
      limit: queryParams.limit || 10,
      orderBy: queryParams.orderBy || 'createdAt',
      orderDirection: queryParams.orderDirection || 'desc'
    })

    if (!paginationResult.success) {
      return errorResponse('VALIDATION_ERROR', 'Parámetros de paginación inválidos', 400)
    }

    const { page, limit, orderBy, orderDirection } = paginationResult.data

    // Validar filtros de búsqueda
    const searchResult = searchSchema.safeParse({
      q: queryParams.q,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate
    })

    if (!searchResult.success) {
      return errorResponse('VALIDATION_ERROR', 'Parámetros de búsqueda inválidos', 400)
    }

    const { q, startDate, endDate } = searchResult.data

    // Construir filtros WHERE
    const where: Record<string, unknown> = {}

    if (q) {
      where.OR = [
        { cedula: { contains: q, mode: 'insensitive' } },
        { nombre: { contains: q, mode: 'insensitive' } },
        { correo: { contains: q, mode: 'insensitive' } },
        { institucion: { contains: q, mode: 'insensitive' } }
      ]
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt as Record<string, unknown>, gte: new Date(startDate) }
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt as Record<string, unknown>, lte: new Date(endDate) }
    }

    if (queryParams.eventId) {
      where.eventId = queryParams.eventId
    }

    if (queryParams.sexo) {
      where.sexo = queryParams.sexo
    }

    // Obtener checkins con paginación
    const skip = (page - 1) * limit
    
    // Definir ordenamiento por defecto
    let orderByClause: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' }
    
    // Si se especifica un orden válido, usarlo
    if (orderBy && orderDirection) {
      orderByClause = { [orderBy]: orderDirection }
    }
    
    const [checkins, total] = await Promise.all([
      prisma.checkin.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startAt: true,
              endAt: true,
              organizer: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: orderByClause,
        skip,
        take: limit
      }),
      prisma.checkin.count({ where })
    ])

    return paginatedResponse(checkins, page, limit, total, 'Check-ins obtenidos exitosamente')

  } catch (error) {
    console.error('Error en GET /api/checkins:', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await getRequestBody(request)
    
    // Validar datos del check-in
    const validationResult = createCheckinSchema.safeParse(body)

    if (!validationResult.success) {
      return errorResponse('VALIDATION_ERROR', 'Datos de check-in inválidos', 400)
    }

    const checkinData = validationResult.data

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: checkinData.eventId }
    })

    if (!event) {
      return errorResponse('NOT_FOUND', 'Evento no encontrado', 404)
    }

    // Verificar que no existe ya un check-in para esta cédula en este evento
    const existingCheckin = await prisma.checkin.findUnique({
      where: {
        eventId_cedula: {
          eventId: checkinData.eventId,
          cedula: checkinData.cedula
        }
      }
    })

    if (existingCheckin) {
      return errorResponse('CONFLICT', 'Ya existe un check-in para esta cédula en este evento', 409)
    }

    // Crear el check-in
    const checkin = await prisma.checkin.create({
      data: {
        ...checkinData,
        ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true
          }
        }
      }
    })

    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'checkin_created',
        entityType: 'checkin',
        entityId: checkin.id.toString(),
        details: {
          eventId: event.id,
          eventTitle: event.title,
          participantName: checkinData.nombre,
          participantCedula: checkinData.cedula
        },
        ipAddress: checkin.ipAddress,
        userAgent: checkin.userAgent
      }
    })

    return createdResponse(checkin, 'Check-in registrado exitosamente')

  } catch (error) {
    console.error('Error en POST /api/checkins:', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}
