import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  handleCors,
  getRequestBody,
  notFoundResponse,
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
    
    const { 
      eventId, 
      type = 'manual', 
      recipients = 'all',
      subject,
      message,
      template
    } = body

    // Validar datos básicos
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
      return notFoundResponse('Evento')
    }

    // Determinar destinatarios
    let recipientList: string[] = []
    
    switch (recipients) {
      case 'all':
        recipientList = event.invitees
          .filter(invitee => invitee.email)
          .map(invitee => invitee.email)
        break
        
      case 'pending':
        // Invitados que aún no han confirmado asistencia
        const confirmedCheckins = await prisma.checkin.findMany({
          where: { eventId },
          select: { correo: true }
        })
        const confirmedEmails = new Set(confirmedCheckins.map(c => c.correo).filter(Boolean))
        
        recipientList = event.invitees
          .filter(invitee => 
            invitee.email && 
            !confirmedEmails.has(invitee.email)
          )
          .map(invitee => invitee.email)
        break
        
      case 'attended':
        // Solo quienes ya se registraron
        const attendeeCheckins = await prisma.checkin.findMany({
          where: { eventId },
          select: { correo: true }
        })
        recipientList = attendeeCheckins
          .map(c => c.correo)
          .filter(Boolean) as string[]
        break
        
      case 'custom':
        // Lista personalizada (debe venir en el body)
        if (body.customRecipients && Array.isArray(body.customRecipients)) {
          recipientList = body.customRecipients
        }
        break
        
      default:
        return errorResponse('INVALID_RECIPIENTS', 'Tipo de destinatarios inválido', 400)
    }

    if (recipientList.length === 0) {
      return errorResponse('NO_RECIPIENTS', 'No hay destinatarios para enviar el email', 400)
    }

    // Preparar contenido del email
    let emailSubject = subject
    let emailContent = message

    // Si se especifica un template, usar contenido predefinido
    if (template) {
      switch (template) {
        case 'invitation':
          emailSubject = `Invitación: ${event.title}`
          emailContent = `
            Estimado/a invitado/a,
            
            Tienes una invitación para el evento "${event.title}".
            
            📅 Fecha: ${event.startAt.toLocaleDateString('es-ES')}
            ⏰ Hora: ${event.startAt.toLocaleTimeString('es-ES')}
            📍 Lugar: ${event.location || 'Por confirmar'}
            
            Para confirmar tu asistencia, accede al siguiente enlace:
            ${process.env.NEXT_PUBLIC_BASE_URL}/a/${event.formToken}
            
            ¡Esperamos verte allí!
            
            Saludos,
            ${event.organizer.name || 'Equipo organizador'}
          `
          break
          
        case 'reminder':
          emailSubject = `Recordatorio: ${event.title}`
          emailContent = `
            Hola,
            
            Te recordamos que tienes confirmada tu asistencia al evento "${event.title}".
            
            📅 Fecha: ${event.startAt.toLocaleDateString('es-ES')}
            ⏰ Hora: ${event.startAt.toLocaleTimeString('es-ES')}
            📍 Lugar: ${event.location || 'Por confirmar'}
            
            Si necesitas cancelar o modificar tu asistencia:
            ${process.env.NEXT_PUBLIC_BASE_URL}/a/${event.formToken}
            
            ¡Te esperamos!
            
            Saludos,
            ${event.organizer.name || 'Equipo organizador'}
          `
          break
          
        case 'thank_you':
          emailSubject = `Gracias por asistir: ${event.title}`
          emailContent = `
            ¡Muchas gracias por asistir!
            
            Esperamos que hayas disfrutado del evento "${event.title}".
            
            Tu participación es muy valiosa para nosotros.
            
            Saludos,
            ${event.organizer.name || 'Equipo organizador'}
          `
          break
          
        default:
          return errorResponse('INVALID_TEMPLATE', 'Template de email inválido', 400)
      }
    }

    // Validar que tenemos subject y content
    if (!emailSubject || !emailContent) {
      return errorResponse('INCOMPLETE_EMAIL', 'Asunto y contenido son requeridos', 400)
    }

    // Crear job de email en la base de datos
    const emailJob = await prisma.emailJob.create({
      data: {
        eventId,
        kind: type,
        scheduledAt: new Date(),
        status: 'pending'
      }
    })

    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'email_job_created',
        entityType: 'email_job',
        entityId: emailJob.id.toString(),
        details: {
          eventId,
          type,
          recipients: recipients,
          recipientCount: recipientList.length,
          subject: emailSubject,
          template: template || 'custom'
        },
        ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // Aquí normalmente se integraría con un servicio de email como SendGrid, AWS SES, etc.
    // Por ahora simularemos el envío y marcaremos como exitoso
    
    try {
      // Simular envío de emails
      console.log(`Simulando envío de ${recipientList.length} emails`)
      console.log(`Asunto: ${emailSubject}`)
      console.log(`Destinatarios: ${recipientList.slice(0, 3).join(', ')}${recipientList.length > 3 ? '...' : ''}`)
      
      // Marcar job como enviado
      await prisma.emailJob.update({
        where: { id: emailJob.id },
        data: {
          status: 'sent',
          sentAt: new Date()
        }
      })

      return successResponse({
        jobId: emailJob.id,
        eventId,
        subject: emailSubject,
        recipientCount: recipientList.length,
        status: 'sent',
        sentAt: new Date().toISOString()
      }, `Email enviado exitosamente a ${recipientList.length} destinatarios`)

    } catch (emailError) {
      console.error('Error al enviar emails:', emailError)
      
      // Marcar job como fallido
      await prisma.emailJob.update({
        where: { id: emailJob.id },
        data: {
          status: 'failed',
          errorMsg: emailError instanceof Error ? emailError.message : 'Error desconocido',
          retryCount: 1
        }
      })

      return errorResponse('EMAIL_SEND_FAILED', 'Error al enviar los emails', 500)
    }

  } catch (error) {
    console.error('Error en API de envío de emails:', error)
    return internalServerErrorResponse()
  }
}

export async function GET(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    // Obtener estado de jobs de email recientes
    const recentJobs = await prisma.emailJob.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            title: true,
            startAt: true
          }
        }
      }
    })

    return successResponse(recentJobs, 'Jobs de email obtenidos exitosamente')

  } catch (error) {
    console.error('Error al obtener jobs de email:', error)
    return internalServerErrorResponse()
  }
}
