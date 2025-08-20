import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  handleCors,
  getRequestBody,
  internalServerErrorResponse
} from '@/lib/api/responses'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const body = await getRequestBody(request)
    const { eventId, hoursBeforeEvent = 24 } = body

    if (!eventId) {
      return errorResponse('INVALID_DATA', 'ID del evento requerido', 400)
    }

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: true,
        invitees: true
      }
    })

    if (!event) {
      return errorResponse('NOT_FOUND', 'Evento no encontrado', 404)
    }

    // Calcular cuándo enviar el recordatorio (X horas antes del evento)
    const scheduledAt = new Date(event.startAt.getTime() - (hoursBeforeEvent * 60 * 60 * 1000))

    // Verificar que no sea en el pasado
    if (scheduledAt <= new Date()) {
      return errorResponse('INVALID_SCHEDULE', 'La fecha programada no puede ser en el pasado', 400)
    }

    // Verificar que no exista ya un job de pre-close para este evento
    const existingJob = await prisma.emailJob.findFirst({
      where: {
        eventId,
        kind: 'pre_close'
      }
    })

    if (existingJob) {
      return errorResponse('DUPLICATE_JOB', 'Ya existe un job de pre-close para este evento', 409)
    }

    // Crear job de email
    const emailJob = await prisma.emailJob.create({
      data: {
        eventId,
        kind: 'pre_close',
        scheduledAt,
        status: 'pending'
      }
    })

    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'pre_close_job_created',
        entityType: 'email_job',
        entityId: emailJob.id.toString(),
        details: {
          eventId,
          eventTitle: event.title,
          scheduledAt: scheduledAt.toISOString(),
          hoursBeforeEvent,
          inviteeCount: event.invitees.length
        },
        ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return successResponse({
      jobId: emailJob.id,
      eventId,
      eventTitle: event.title,
      kind: 'pre_close',
      scheduledAt: scheduledAt.toISOString(),
      hoursBeforeEvent,
      status: 'pending',
      inviteeCount: event.invitees.length
    }, `Job de recordatorio programado ${hoursBeforeEvent}h antes del evento`)

  } catch (error) {
    console.error('Error creando job de pre-close:', error)
    return internalServerErrorResponse()
  }
}

export async function GET(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    // Obtener jobs de pre-close pendientes y recientes
    const jobs = await prisma.emailJob.findMany({
      where: {
        kind: 'pre_close'
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
            status: true
          }
        }
      },
      orderBy: { scheduledAt: 'asc' },
      take: 50
    })

    // Separar jobs por estado
    const pendingJobs = jobs.filter(job => job.status === 'pending')
    const completedJobs = jobs.filter(job => job.status === 'sent')
    const failedJobs = jobs.filter(job => job.status === 'failed')

    // Encontrar jobs que deberían ejecutarse pronto
    const now = new Date()
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000)
    const jobsDueSoon = pendingJobs.filter(job => 
      job.scheduledAt <= nextHour && job.scheduledAt > now
    )

    return successResponse({
      total: jobs.length,
      pending: pendingJobs.length,
      completed: completedJobs.length,
      failed: failedJobs.length,
      dueSoon: jobsDueSoon.length,
      jobs: {
        pending: pendingJobs,
        dueSoon: jobsDueSoon,
        recent: jobs.slice(0, 10)
      }
    }, 'Jobs de pre-close obtenidos exitosamente')

  } catch (error) {
    console.error('Error obteniendo jobs de pre-close:', error)
    return internalServerErrorResponse()
  }
}

export async function PUT(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    // Ejecutar jobs de pre-close que están programados para ahora
    const now = new Date()
    
    const jobsToExecute = await prisma.emailJob.findMany({
      where: {
        kind: 'pre_close',
        status: 'pending',
        scheduledAt: { lte: now }
      },
      include: {
        event: {
          include: {
            organizer: true,
            invitees: true
          }
        }
      }
    })

    if (jobsToExecute.length === 0) {
      return successResponse({
        executed: 0,
        message: 'No hay jobs de pre-close pendientes para ejecutar'
      })
    }

    const results = []

    for (const job of jobsToExecute) {
      try {
        // Simular envío de email de recordatorio
        const recipientList = job.event.invitees
          .filter(invitee => invitee.email)
          .map(invitee => invitee.email)

        console.log(`Ejecutando job pre-close ${job.id} para evento ${job.event.title}`)
        console.log(`Enviando recordatorio a ${recipientList.length} invitados`)

        // Marcar job como enviado
        await prisma.emailJob.update({
          where: { id: job.id },
          data: {
            status: 'sent',
            sentAt: new Date()
          }
        })

        // Log de auditoría
        await prisma.auditLog.create({
          data: {
            action: 'pre_close_job_executed',
            entityType: 'email_job',
            entityId: job.id.toString(),
            details: {
              eventId: job.eventId,
              eventTitle: job.event.title,
              recipientCount: recipientList.length,
              executedAt: new Date().toISOString()
            }
          }
        })

        results.push({
          jobId: job.id,
          eventTitle: job.event.title,
          recipients: recipientList.length,
          status: 'sent'
        })

      } catch (jobError) {
        console.error(`Error ejecutando job ${job.id}:`, jobError)
        
        // Marcar job como fallido
        await prisma.emailJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            errorMsg: jobError instanceof Error ? jobError.message : 'Error desconocido',
            retryCount: (job.retryCount || 0) + 1
          }
        })

        results.push({
          jobId: job.id,
          eventTitle: job.event.title,
          status: 'failed',
          error: jobError instanceof Error ? jobError.message : 'Error desconocido'
        })
      }
    }

    return successResponse({
      executed: results.length,
      successful: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    }, `Ejecutados ${results.length} jobs de pre-close`)

  } catch (error) {
    console.error('Error ejecutando jobs de pre-close:', error)
    return internalServerErrorResponse()
  }
}
