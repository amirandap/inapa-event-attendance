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
import fs from 'fs'
import path from 'path'
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
    console.log('GET /api/events: Starting request processing')
    
    // Verificar la base de datos
    const dbUrl = process.env.DATABASE_URL || ''
    console.log(`GET /api/events: DATABASE_URL raw value: "${dbUrl}"`)
    
    const dbPath = dbUrl.replace('file:', '')
    console.log(`GET /api/events: Database path after replacing 'file:': "${dbPath}"`)
    
    // También verificar la ruta relativa desde el directorio actual
    const currentDir = process.cwd()
    console.log(`GET /api/events: Current working directory: "${currentDir}"`)
    
    // Probar diferentes rutas posibles para encontrar la base de datos
    const possiblePaths = [
      dbPath, 
      path.join(currentDir, 'prisma/dev.db'),
      path.join(currentDir, 'dev.db'),
      '/Users/amiranda/Github/inapa-event-attendance/prisma/dev.db'
    ]
    
    console.log('GET /api/events: Verificando posibles rutas de base de datos:')
    for (const testPath of possiblePaths) {
      const exists = fs.existsSync(testPath)
      console.log(`- "${testPath}": ${exists ? 'EXISTE' : 'NO EXISTE'}`)
    }
    
    if (dbPath && fs.existsSync(dbPath)) {
      console.log(`GET /api/events: Base de datos encontrada en: ${dbPath}`)
    } else {
      // Buscar una ruta alternativa que funcione
      const workingPath = possiblePaths.find(p => fs.existsSync(p))
      
      if (workingPath) {
        console.log(`GET /api/events: Base de datos encontrada en ruta alternativa: ${workingPath}`)
        // No retornar error, intentar usar la base de datos
      } else {
        console.error('GET /api/events: No se encontró la base de datos en ninguna ruta')
        return errorResponse('DATABASE_ERROR', 'La base de datos no existe en la ruta especificada', 500)
      }
    }
    
    // Verificar la conexión a Prisma
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('GET /api/events: Conexión a Prisma establecida correctamente')
    } catch (prismaError) {
      console.error('GET /api/events: Error al conectar con Prisma:', prismaError)
      return errorResponse('DATABASE_ERROR', 'No se pudo conectar a la base de datos', 500)
    }
    
    const searchParams = getSearchParams(request)
    const queryParams = parseQueryParams(searchParams)
    console.log('GET /api/events: Query parameters:', queryParams)
    
    // Validar parámetros de paginación
    console.log('GET /api/events: Validating pagination parameters')
    const paginationResult = paginationSchema.safeParse({
      page: queryParams.page || 1,
      limit: queryParams.limit || 10,
      orderBy: queryParams.orderBy || 'startAt',
      orderDirection: queryParams.orderDirection || 'desc'
    })

    if (!paginationResult.success) {
      console.error('GET /api/events: Pagination validation failed:', paginationResult.error)
      return handleError(paginationResult.error)
    }

    const { page, limit, orderBy, orderDirection } = paginationResult.data
    console.log('GET /api/events: Pagination parameters validated successfully:', { page, limit, orderBy, orderDirection })

    // Validar filtros de búsqueda
    console.log('GET /api/events: Validating search filters')
    const searchResult = searchSchema.safeParse({
      q: queryParams.q,
      status: queryParams.status,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate
    })

    if (!searchResult.success) {
      console.error('GET /api/events: Search validation failed:', searchResult.error)
      return handleError(searchResult.error)
    }

    const { q, status, startDate, endDate } = searchResult.data
    console.log('GET /api/events: Search filters validated successfully:', { q, status, startDate, endDate })

    // Construir filtros WHERE
    console.log('GET /api/events: Building WHERE filters')
    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
      console.log('GET /api/events: Adding status filter:', status)
    }

    if (q) {
      // SQLite no soporta el modo 'insensitive', así que lo quitamos
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { location: { contains: q } }
      ]
      console.log('GET /api/events: Adding search query filter:', q)
    }

    if (startDate) {
      where.startAt = { ...where.startAt as Record<string, unknown>, gte: new Date(startDate) }
      console.log('GET /api/events: Adding startDate filter:', startDate)
    }

    if (endDate) {
      where.endAt = { ...where.endAt as Record<string, unknown>, lte: new Date(endDate) }
      console.log('GET /api/events: Adding endDate filter:', endDate)
    }

    if (queryParams.organizerId) {
      where.organizerId = Number(queryParams.organizerId)
      console.log('GET /api/events: Adding organizerId filter:', queryParams.organizerId)
    }
    
    console.log('GET /api/events: Final WHERE filters:', JSON.stringify(where))

    // Obtener eventos con paginación
    console.log('GET /api/events: Preparing pagination and sorting')
    const skip = (page - 1) * limit
    
    // Definir ordenamiento por defecto
    let orderByClause: Record<string, 'asc' | 'desc'> = { startAt: 'desc' }
    
    // Si se especifica un orden válido, usarlo
    if (orderBy && orderDirection) {
      orderByClause = { [orderBy]: orderDirection }
      console.log(`GET /api/events: Using custom ordering: ${orderBy} ${orderDirection}`)
    } else {
      console.log('GET /api/events: Using default ordering: startAt desc')
    }
    
    try {
      console.log('GET /api/events: Executing Prisma queries')
      console.log('GET /api/events: Database URL:', process.env.DATABASE_URL?.substring(0, process.env.DATABASE_URL.indexOf(":")))
      
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
      ]);
      
      console.log(`GET /api/events: Query successful, found ${events.length} events, total: ${total}`)
      
      // Verificar estructura de datos antes de enviar respuesta
      const safeEvents = events.map(event => {
        // Crear un objeto seguro para serializar (sin fechas que puedan causar problemas)
        const safeEvent: any = {};
        
        // Copiar todas las propiedades serializando fechas
        Object.keys(event).forEach(key => {
          const value = (event as any)[key];
          
          // Convertir fechas a formato ISO string
          if (value instanceof Date) {
            safeEvent[key] = value.toISOString();
          } else {
            safeEvent[key] = value;
          }
        });
        
        return safeEvent;
      });
      
      console.log('GET /api/events: Sending paginated response')
      return paginatedResponse(safeEvents, page, limit, total, 'Eventos obtenidos exitosamente')
    } catch (error) {
      console.error('GET /api/events: Error executing Prisma query:', error)
      throw error; // Relanzar para capturar en el try/catch exterior
    }

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
