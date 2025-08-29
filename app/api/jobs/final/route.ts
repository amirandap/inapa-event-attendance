import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  successResponse, 
  errorResponse, 
  handleCors,
  getRequestBody,
  internalServerErrorResponse
} from '@/lib/api/responses';
import { generateEventReport } from '@/lib/pdf/generator';
import { smtpService } from '@/lib/email/smtpService';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const body = await getRequestBody(request)
    const { eventId, hoursAfterEvent = 1 } = body

    if (!eventId) {
      return errorResponse('INVALID_DATA', 'ID del evento requerido', 400)
    }

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: true,
        invitees: true,
        checkins: true
      }
    })

    if (!event) {
      return errorResponse('NOT_FOUND', 'Evento no encontrado', 404)
    }

    // Calcular cuándo enviar el email final (X horas después del evento)
    const scheduledAt = new Date(event.endAt.getTime() + (hoursAfterEvent * 60 * 60 * 1000))

    // Verificar que no exista ya un job final para este evento
    const existingJob = await prisma.emailJob.findFirst({
      where: {
        eventId,
        kind: 'final'
      }
    })

    if (existingJob) {
      return errorResponse('DUPLICATE_JOB', 'Ya existe un job final para este evento', 409)
    }

    // Crear job de email
    const emailJob = await prisma.emailJob.create({
      data: {
        eventId,
        kind: 'final',
        scheduledAt,
        status: 'pending'
      }
    })

    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'final_job_created',
        entityType: 'email_job',
        entityId: emailJob.id.toString(),
        details: {
          eventId,
          eventTitle: event.title,
          scheduledAt: scheduledAt.toISOString(),
          hoursAfterEvent,
          inviteeCount: event.invitees.length,
          attendeeCount: event.checkins.length
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
      kind: 'final',
      scheduledAt: scheduledAt.toISOString(),
      hoursAfterEvent,
      status: 'pending',
      inviteeCount: event.invitees.length,
      attendeeCount: event.checkins.length
    }, `Job final programado ${hoursAfterEvent}h después del evento`)

  } catch (error) {
    console.error('Error creando job final:', error)
    return internalServerErrorResponse()
  }
}

export async function GET(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    // Obtener jobs finales pendientes y recientes
    const jobs = await prisma.emailJob.findMany({
      where: {
        kind: 'final'
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
            status: true,
            _count: {
              select: {
                invitees: true,
                checkins: true
              }
            }
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
    }, 'Jobs finales obtenidos exitosamente')

  } catch (error) {
    console.error('Error obteniendo jobs finales:', error)
    return internalServerErrorResponse()
  }
}

export async function PUT(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    // Ejecutar jobs finales que están programados para ahora
    const now = new Date()
    
    const jobsToExecute = await prisma.emailJob.findMany({
      where: {
        kind: 'final',
        status: 'pending',
        scheduledAt: { lte: now }
      },
      include: {
        event: {
          include: {
            organizer: true,
            invitees: true,
            checkins: true
          }
        }
      }
    })

    if (jobsToExecute.length === 0) {
      return successResponse({
        executed: 0,
        message: 'No hay jobs finales pendientes para ejecutar'
      })
    }

    const results = []

    for (const job of jobsToExecute) {
      try {
        const organizerEmail = job.event.organizer?.email;
        if (!organizerEmail) {
          console.warn(`No se pudo encontrar el correo del organizador para el evento ${job.event.title}. Saltando...`);
          continue;
        }

        // Obtener estadísticas del evento
        const totalInvitees = job.event.invitees.length
        const totalAttendees = job.event.checkins.length
        const attendanceRate = totalInvitees > 0 ? (totalAttendees / totalInvitees * 100).toFixed(2) : '0'
        
        console.log(`Ejecutando job final ${job.id} para evento ${job.event.title}`)
        console.log(`Estadísticas: ${totalAttendees}/${totalInvitees} asistieron (${attendanceRate}%)`)
        
        // 1. Generar el reporte PDF
        const pdfBuffer = await generateEventReport(job.eventId);

        // 2. Definir el adjunto
        const attachments = [{
          filename: 'reporte-asistencia.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        }];

        // 3. Enviar el reporte final al organizador
        await smtpService.sendEmail(
          [organizerEmail],
          `Reporte de Asistencia: ${job.event.title}`,
          `Hola ${job.event.organizer?.name || ''},<br><br>Adjunto encontrarás el reporte final de asistencia para tu evento: <strong>${job.event.title}</strong>.<br><br>Han asistido <strong>${totalAttendees}</strong> de <strong>${totalInvitees}</strong> invitados. La tasa de asistencia es del <strong>${attendanceRate}%</strong>.<br><br>Gracias por usar nuestro servicio.<br><br>Saludos,<br>El equipo de INAPA.`,
          attachments
        );
        

        // Marcar job como enviado
        await prisma.emailJob.update({
          where: { id: job.id },
          data: {
            status: 'sent',
            sentAt: new Date()
          }
        })

        // Log de auditoría con estadísticas
        await prisma.auditLog.create({
          data: {
            action: 'final_job_executed',
            entityType: 'email_job',
            entityId: job.id.toString(),
            details: {
              eventId: job.eventId,
              eventTitle: job.event.title,
              totalInvitees,
              totalAttendees,
              attendanceRate: `${attendanceRate}%`,
              executedAt: new Date().toISOString()
            }
          }
        })

        // Marcar evento como completado si no lo está ya
        if (job.event.status !== 'completed') {
          await prisma.event.update({
            where: { id: job.eventId },
            data: { status: 'completed' }
          })
        }

        results.push({
          jobId: job.id,
          eventTitle: job.event.title,
          totalInvitees,
          totalAttendees,
          attendanceRate: `${attendanceRate}%`,
          status: 'sent'
        })

      } catch (jobError) {
        console.error(`Error ejecutando job final ${job.id}:`, jobError)
        
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
    }, `Ejecutados ${results.length} jobs finales`)

  } catch (error) {
    console.error('Error ejecutando jobs finales:', error)
    return internalServerErrorResponse()
  }
}