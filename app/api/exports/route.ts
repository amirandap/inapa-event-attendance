import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  handleCors,
  getSearchParams,
  parseQueryParams,
  internalServerErrorResponse
} from '@/lib/api/responses'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function GET(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const searchParams = getSearchParams(request)
    const queryParams = parseQueryParams(searchParams)

    const { 
      type = 'events', 
      eventId, 
      format = 'json',
      startDate,
      endDate 
    } = queryParams

    // Validar tipo de exportación
    const validTypes = ['events', 'checkins', 'invitees', 'attendance', 'institutions']
    if (!validTypes.includes(type as string)) {
      return errorResponse('INVALID_TYPE', 'Tipo de exportación inválido', 400)
    }

    // Validar formato
    const validFormats = ['json', 'csv', 'excel']
    if (!validFormats.includes(format as string)) {
      return errorResponse('INVALID_FORMAT', 'Formato de exportación inválido', 400)
    }

    let data: unknown[] = []
    let filename = ''

    // Preparar filtros de fecha
    const dateFilters: { startAt?: { gte: Date }, endAt?: { lte: Date } } = {}
    if (startDate) {
      dateFilters.startAt = { gte: new Date(startDate as string) }
    }
    if (endDate) {
      dateFilters.endAt = { lte: new Date(endDate as string) }
    }

    switch (type) {
      case 'events':
        data = await prisma.event.findMany({
          where: dateFilters,
          include: {
            organizer: {
              select: { name: true, email: true }
            },
            _count: {
              select: {
                invitees: true,
                checkins: true
              }
            }
          },
          orderBy: { startAt: 'desc' }
        })
        filename = `eventos_${new Date().toISOString().split('T')[0]}`
        break

      case 'checkins':
        const checkinFilters: { eventId?: string } = {}
        if (eventId) {
          checkinFilters.eventId = eventId as string
        }
        
        data = await prisma.checkin.findMany({
          where: {
            ...checkinFilters,
            ...(startDate || endDate ? {
              event: dateFilters
            } : {})
          },
          include: {
            event: {
              select: {
                title: true,
                startAt: true,
                endAt: true,
                location: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
        filename = `asistencias_${new Date().toISOString().split('T')[0]}`
        break

      case 'invitees':
        const inviteeFilters: { eventId?: string } = {}
        if (eventId) {
          inviteeFilters.eventId = eventId as string
        }
        
        data = await prisma.invitee.findMany({
          where: {
            ...inviteeFilters,
            ...(startDate || endDate ? {
              event: dateFilters
            } : {})
          },
          include: {
            event: {
              select: {
                title: true,
                startAt: true,
                endAt: true,
                location: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
        filename = `invitados_${new Date().toISOString().split('T')[0]}`
        break

      case 'attendance':
        // Reporte de asistencia con datos combinados
        const attendanceFilters: { id?: string } = {}
        if (eventId) {
          attendanceFilters.id = eventId as string
        }
        
        const events = await prisma.event.findMany({
          where: {
            ...attendanceFilters,
            ...dateFilters
          },
          include: {
            invitees: {
              include: {
                _count: {
                  select: {
                    checkins: true
                  }
                }
              }
            },
            checkins: true,
            _count: {
              select: {
                invitees: true,
                checkins: true
              }
            }
          }
        })
        
        // Transformar datos para reporte de asistencia
        data = events.map(event => ({
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.startAt,
          eventLocation: event.location,
          totalInvitees: event._count.invitees,
          totalCheckins: event._count.checkins,
          attendanceRate: event._count.invitees > 0 
            ? (event._count.checkins / event._count.invitees * 100).toFixed(2) + '%'
            : '0%',
          invitees: event.invitees.map(invitee => ({
            ...invitee,
            hasAttended: invitee._count.checkins > 0
          }))
        }))
        filename = `reporte_asistencia_${new Date().toISOString().split('T')[0]}`
        break

      case 'institutions':
        // Reporte por instituciones
        const institutionData = await prisma.checkin.groupBy({
          by: ['institucion'],
          where: {
            institucion: { not: null },
            ...(eventId ? { eventId: eventId as string } : {}),
            ...(startDate || endDate ? {
              event: dateFilters
            } : {})
          },
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          }
        })
        
        data = institutionData.map(item => ({
          institucion: item.institucion,
          totalAsistencias: item._count.id
        }))
        filename = `instituciones_${new Date().toISOString().split('T')[0]}`
        break

      default:
        return errorResponse('INVALID_TYPE', 'Tipo de exportación no soportado', 400)
    }

    // Preparar respuesta según formato
    const response = {
      type,
      format,
      filename,
      generatedAt: new Date().toISOString(),
      totalRecords: data.length,
      data
    }

    // Para CSV y Excel, se podría implementar conversión aquí
    // Por ahora retornamos JSON con metadata para conversión en frontend
    if (format === 'csv' || format === 'excel') {
      response.filename += format === 'csv' ? '.csv' : '.xlsx'
      // Aquí se podría implementar la conversión directa a CSV/Excel
      // Por ahora indicamos que el frontend debe procesar los datos
    }

    return successResponse(response, `Exportación de ${type} generada exitosamente`)

  } catch (error) {
    console.error('Error al generar exportación:', error)
    return internalServerErrorResponse()
  }
}
