import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  errorResponse, 
  handleCors,
  getRequestBody,
  paginatedResponse,
  createdResponse,
  successResponse,
  getSearchParams,
  parseQueryParams
} from '@/lib/api/responses'
import { 
  createOrganizerSchema, 
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
    
    // Si no se especifican parámetros, devolver todos los organizadores (para dropdowns, etc.)
    if (!queryParams.page && !queryParams.limit) {
      const organizers = await prisma.organizer.findMany({
        include: {
          _count: {
            select: {
              events: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      return successResponse(organizers, 'Organizadores obtenidos exitosamente')
    }
    
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
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } }
      ]
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt as Record<string, unknown>, gte: new Date(startDate) }
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt as Record<string, unknown>, lte: new Date(endDate) }
    }

    // Obtener organizadores con paginación
    const skip = (page - 1) * limit
    
    // Definir ordenamiento por defecto
    let orderByClause: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' }
    
    // Si se especifica un orden válido, usarlo
    if (orderBy && orderDirection) {
      orderByClause = { [orderBy]: orderDirection }
    }
    
    const [organizers, total] = await Promise.all([
      prisma.organizer.findMany({
        where,
        include: {
          _count: {
            select: {
              events: true
            }
          }
        },
        orderBy: orderByClause,
        skip,
        take: limit
      }),
      prisma.organizer.count({ where })
    ])

    return paginatedResponse(organizers, page, limit, total, 'Organizadores obtenidos exitosamente')

  } catch (error) {
    console.error('Error en GET /api/organizers:', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await getRequestBody(request)
    
    // Validar datos del organizador
    const validationResult = createOrganizerSchema.safeParse(body)

    if (!validationResult.success) {
      return errorResponse('VALIDATION_ERROR', 'Datos de organizador inválidos', 400)
    }

    const organizerData = validationResult.data

    // Verificar que no existe ya un organizador con este email
    const existingOrganizer = await prisma.organizer.findUnique({
      where: { email: organizerData.email }
    })

    if (existingOrganizer) {
      return errorResponse('CONFLICT', 'Ya existe un organizador con este email', 409)
    }

    // Crear el organizador
    const organizer = await prisma.organizer.create({
      data: organizerData,
      include: {
        _count: {
          select: {
            events: true
          }
        }
      }
    })

    return createdResponse(organizer, 'Organizador creado exitosamente')

  } catch (error) {
    console.error('Error en POST /api/organizers:', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}
