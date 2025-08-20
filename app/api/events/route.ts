import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  errorResponse, 
  handleError, 
  paginatedResponse,
  createdResponse,
  handleCors,
  getRequestBody,
  getSearchParams,
  parseQueryParams
} from '@/lib/api/responses'
import { 
  createEventSchema, 
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
      orderBy: queryParams.orderBy || 'startAt',
      orderDirection: queryParams.orderDirection || 'desc'
    })

    if (!paginationResult.success) {
      return handleError(paginationResult.error)
    }

    const { page, limit, orderBy, orderDirection } = paginationResult.data

    // Validar filtros de búsqueda
    const searchResult = searchSchema.safeParse({
      q: queryParams.q,
      status: queryParams.status,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate
    })

    if (!searchResult.success) {
      return handleError(searchResult.error)
    }

    const { q, status, startDate, endDate } = searchResult.data

    // Construir filtros WHERE
    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } }
      ]
    }

    if (startDate) {
      where.startAt = { ...where.startAt as Record<string, unknown>, gte: new Date(startDate) }
    }

    if (endDate) {
      where.endAt = { ...where.endAt as Record<string, unknown>, lte: new Date(endDate) }
    }

    if (queryParams.organizerId) {
      where.organizerId = Number(queryParams.organizerId)
    }

    // Obtener eventos con paginación
    const skip = (page - 1) * limit
    
    // Definir ordenamiento por defecto
    let orderByClause: Record<string, 'asc' | 'desc'> = { startAt: 'desc' }
    
    // Si se especifica un orden válido, usarlo
    if (orderBy && orderDirection) {
      orderByClause = { [orderBy]: orderDirection }
    }
    
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          _count: {
            select: {
              invitees: true,
              checkins: true,
              emailJobs: true
            }
          }
        },
        orderBy: orderByClause,
        skip,
        take: limit
      }),
      prisma.event.count({ where })
    ])

    return paginatedResponse(events, page, limit, total, 'Eventos obtenidos exitosamente')

  } catch (error) {
    console.error('Error en GET /api/events:', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await getRequestBody(request)
    
    // Validar datos del evento
    const validationResult = createEventSchema.safeParse(body)

    if (!validationResult.success) {
      return handleError(validationResult.error)
    }

    const eventData = validationResult.data

    // Verificar que el organizador existe
    const organizer = await prisma.organizer.findUnique({
      where: { id: eventData.organizerId }
    })

    if (!organizer) {
      return errorResponse('NOT_FOUND', 'Organizador no encontrado', 404)
    }

    // Generar un token único para el formulario
    const formToken = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Generar un ID único para Google Event
    const googleEventId = `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Crear el evento
    const event = await prisma.event.create({
      data: {
        ...eventData,
        startAt: new Date(eventData.startAt),
        endAt: new Date(eventData.endAt),
        formToken,
        googleEventId: eventData.googleEventId || googleEventId,
        status: 'active'
      },
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        _count: {
          select: {
            invitees: true,
            checkins: true,
            emailJobs: true
          }
        }
      }
    })

    return createdResponse(event, 'Evento creado exitosamente')

  } catch (error) {
    console.error('Error en POST /api/events:', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}
