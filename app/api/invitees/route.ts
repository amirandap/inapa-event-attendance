import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  errorResponse, 
  handleCors,
  getRequestBody,
  paginatedResponse,
  createdResponse,
  getSearchParams,
  parseQueryParams
} from '@/lib/api/responses'
import { 
  createInviteeSchema, 
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
        { email: { contains: q, mode: 'insensitive' } }
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

    if (queryParams.response) {
      where.response = queryParams.response
    }

    if (queryParams.isResource !== undefined) {
      where.isResource = queryParams.isResource === 'true'
    }

    // Obtener invitados con paginación
    const skip = (page - 1) * limit
    
    // Definir ordenamiento por defecto
    let orderByClause: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' }
    
    // Si se especifica un orden válido, usarlo
    if (orderBy && orderDirection) {
      orderByClause = { [orderBy]: orderDirection }
    }
    
    const [invitees, total] = await Promise.all([
      prisma.invitee.findMany({
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
      prisma.invitee.count({ where })
    ])

    return paginatedResponse(invitees, page, limit, total, 'Invitados obtenidos exitosamente')

  } catch (error) {
    console.error('Error en GET /api/invitees:', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await getRequestBody(request)
    
    // Validar datos del invitado
    const validationResult = createInviteeSchema.safeParse(body)

    if (!validationResult.success) {
      return errorResponse('VALIDATION_ERROR', 'Datos de invitado inválidos', 400)
    }

    const inviteeData = validationResult.data

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: inviteeData.eventId }
    })

    if (!event) {
      return errorResponse('NOT_FOUND', 'Evento no encontrado', 404)
    }

    // Verificar que no existe ya un invitado con esta cédula en este evento
    const existingInvitee = await prisma.invitee.findUnique({
      where: {
        eventId_cedula: {
          eventId: inviteeData.eventId,
          cedula: inviteeData.cedula
        }
      }
    })

    if (existingInvitee) {
      return errorResponse('CONFLICT', 'Ya existe un invitado con esta cédula en este evento', 409)
    }

    // Crear el invitado
    const invitee = await prisma.invitee.create({
      data: inviteeData,
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

    return createdResponse(invitee, 'Invitado creado exitosamente')

  } catch (error) {
    console.error('Error en POST /api/invitees:', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}
