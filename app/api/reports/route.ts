import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  handleCors,
  getSearchParams,
  parseQueryParams
} from '@/lib/api/responses'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = getSearchParams(request)
    const queryParams = parseQueryParams(searchParams)

    const reportType = typeof queryParams.type === 'string' ? queryParams.type : 'events'
    const format = typeof queryParams.format === 'string' ? queryParams.format : 'json'
    const eventId = typeof queryParams.eventId === 'string' ? queryParams.eventId : undefined
    const startDate = typeof queryParams.startDate === 'string' ? queryParams.startDate : undefined
    const endDate = typeof queryParams.endDate === 'string' ? queryParams.endDate : undefined

    // Validar tipo de reporte
    const validReportTypes = ['events', 'checkins', 'invitees', 'attendance', 'institutions']
    if (!validReportTypes.includes(reportType)) {
      return errorResponse('INVALID_INPUT', 'Tipo de reporte inválido', 400)
    }

    // Construir filtros de fecha
    const dateFilter: Record<string, Date> = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    let reportData: unknown
    let reportTitle = ''

    switch (reportType) {
      case 'events':
        reportTitle = 'Reporte de Eventos'
        const eventWhere: Record<string, unknown> = {}
        if (Object.keys(dateFilter).length > 0) {
          eventWhere.startAt = dateFilter
        }

        reportData = await prisma.event.findMany({
          where: eventWhere,
          include: {
            organizer: {
              select: {
                name: true,
                email: true
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
          orderBy: { startAt: 'desc' }
        })
        break

      case 'checkins':
        reportTitle = 'Reporte de Asistencias'
        const checkinWhere: Record<string, unknown> = {}
        if (eventId) {
          checkinWhere.eventId = eventId
        }
        if (Object.keys(dateFilter).length > 0) {
          checkinWhere.createdAt = dateFilter
        }

        reportData = await prisma.checkin.findMany({
          where: checkinWhere,
          include: {
            event: {
              select: {
                title: true,
                startAt: true,
                organizer: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
        break

      case 'invitees':
        reportTitle = 'Reporte de Invitados'
        const inviteeWhere: Record<string, unknown> = {}
        if (eventId) {
          inviteeWhere.eventId = eventId
        }
        if (Object.keys(dateFilter).length > 0) {
          inviteeWhere.createdAt = dateFilter
        }

        reportData = await prisma.invitee.findMany({
          where: inviteeWhere,
          include: {
            event: {
              select: {
                title: true,
                startAt: true,
                organizer: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
        break

      case 'attendance':
        reportTitle = 'Reporte de Asistencia por Evento'
        const attendanceWhere: Record<string, unknown> = {}
        if (Object.keys(dateFilter).length > 0) {
          attendanceWhere.startAt = dateFilter
        }
        if (eventId) {
          attendanceWhere.id = eventId
        }

        const eventsWithAttendance = await prisma.event.findMany({
          where: attendanceWhere,
          include: {
            organizer: {
              select: {
                name: true,
                email: true
              }
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

        reportData = eventsWithAttendance.map(event => ({
          ...event,
          attendanceRate: event._count.invitees > 0 
            ? ((event._count.checkins / event._count.invitees) * 100).toFixed(2)
            : '0.00',
          attendancePercentage: event._count.invitees > 0 
            ? Math.round((event._count.checkins / event._count.invitees) * 100)
            : 0
        }))
        break

      case 'institutions':
        reportTitle = 'Reporte por Instituciones'
        const institutionWhere: Record<string, unknown> = {}
        if (eventId) {
          institutionWhere.eventId = eventId
        }
        if (Object.keys(dateFilter).length > 0) {
          institutionWhere.createdAt = dateFilter
        }

        const institutionStats = await prisma.checkin.groupBy({
          by: ['institucion'],
          where: {
            ...institutionWhere,
            institucion: { not: null }
          },
          _count: {
            institucion: true
          },
          orderBy: { 
            _count: { 
              institucion: 'desc' 
            } 
          }
        })

        reportData = institutionStats.map(stat => ({
          institucion: stat.institucion || 'Sin especificar',
          totalAsistentes: stat._count.institucion
        }))
        break

      default:
        return errorResponse('INVALID_INPUT', 'Tipo de reporte no implementado', 400)
    }

    const response = {
      reportType,
      reportTitle,
      generatedAt: new Date().toISOString(),
      filters: {
        eventId,
        startDate,
        endDate
      },
      totalRecords: Array.isArray(reportData) ? reportData.length : 0,
      data: reportData
    }

    // Si se solicita formato CSV o Excel, aquí se podría agregar la lógica de conversión
    if (format === 'csv') {
      // TODO: Implementar conversión a CSV
      return errorResponse('NOT_IMPLEMENTED', 'Formato CSV no implementado aún', 501)
    }

    if (format === 'excel') {
      // TODO: Implementar conversión a Excel
      return errorResponse('NOT_IMPLEMENTED', 'Formato Excel no implementado aún', 501)
    }

    return successResponse(response, 'Reporte generado exitosamente')

  } catch (error) {
    console.error('Error en GET /api/reports:', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}
