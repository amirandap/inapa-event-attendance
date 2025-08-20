import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  handleCors,
  internalServerErrorResponse
} from '@/lib/api/responses'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    // Google Calendar webhook headers
    const channelId = request.headers.get('x-goog-channel-id')
    const channelToken = request.headers.get('x-goog-channel-token')
    const resourceId = request.headers.get('x-goog-resource-id')
    const resourceUri = request.headers.get('x-goog-resource-uri')
    const resourceState = request.headers.get('x-goog-resource-state')

    // Log del webhook recibido
    console.log('Google Calendar Webhook recibido:', {
      channelId,
      channelToken,
      resourceId,
      resourceUri,
      resourceState
    })

    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'webhook_received',
        entityType: 'calendar_webhook',
        entityId: channelId || 'unknown',
        details: {
          channelId,
          channelToken,
          resourceId,
          resourceUri,
          resourceState,
          headers: {
            'x-goog-channel-id': channelId,
            'x-goog-channel-token': channelToken,
            'x-goog-resource-id': resourceId,
            'x-goog-resource-uri': resourceUri,
            'x-goog-resource-state': resourceState
          }
        },
        ipAddress: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // Verificar que el webhook viene de Google
    if (!channelId || !resourceState) {
      return errorResponse('INVALID_WEBHOOK', 'Webhook inválido de Google Calendar', 400)
    }

    // Procesar según el estado del recurso
    switch (resourceState) {
      case 'sync':
        // Sincronización inicial - no requiere procesamiento
        console.log('Webhook de sincronización inicial recibido')
        break

      case 'exists':
        // Evento modificado o creado
        console.log('Evento de calendario modificado')
        
        // Aquí se podría implementar la lógica para:
        // 1. Obtener los detalles del evento desde Google Calendar API
        // 2. Actualizar la base de datos local
        // 3. Sincronizar invitados
        // 4. Enviar notificaciones si es necesario
        
        await processCalendarEventChange(resourceUri, channelId)
        break

      case 'not_exists':
        // Evento eliminado
        console.log('Evento de calendario eliminado')
        
        // Aquí se podría implementar la lógica para:
        // 1. Marcar el evento como cancelado en la base de datos
        // 2. Enviar notificaciones de cancelación
        
        await processCalendarEventDeletion(resourceUri, channelId)
        break

      default:
        console.log(`Estado de webhook no manejado: ${resourceState}`)
    }

    // Google espera una respuesta 200 para confirmar recepción
    return successResponse(
      { 
        processed: true, 
        resourceState,
        channelId 
      }, 
      'Webhook procesado exitosamente'
    )

  } catch (error) {
    console.error('Error procesando webhook de Google Calendar:', error)
    
    // Crear log de error
    try {
      await prisma.auditLog.create({
        data: {
          action: 'webhook_error',
          entityType: 'calendar_webhook',
          entityId: 'error',
          details: {
            error: error instanceof Error ? error.message : 'Error desconocido',
            stack: error instanceof Error ? error.stack : undefined
          }
        }
      })
    } catch (logError) {
      console.error('Error creando log de auditoría:', logError)
    }

    return internalServerErrorResponse()
  }
}

async function processCalendarEventChange(resourceUri?: string | null, channelId?: string | null) {
  try {
    console.log(`Procesando cambio de evento: ${resourceUri}`)
    
    // Aquí se implementaría la lógica para:
    // 1. Extraer el ID del evento de Google desde resourceUri
    // 2. Hacer una llamada al Google Calendar API para obtener detalles
    // 3. Buscar el evento en nuestra base de datos por googleEventId
    // 4. Actualizar los datos del evento si existe
    // 5. Sincronizar la lista de invitados
    // 6. Crear/actualizar jobs de email si es necesario

    // Por ahora, solo loggeamos la acción
    await prisma.auditLog.create({
      data: {
        action: 'calendar_event_change_processed',
        entityType: 'event',
        details: {
          resourceUri,
          channelId,
          action: 'event_modified_or_created'
        }
      }
    })

  } catch (error) {
    console.error('Error procesando cambio de evento:', error)
    throw error
  }
}

async function processCalendarEventDeletion(resourceUri?: string | null, channelId?: string | null) {
  try {
    console.log(`Procesando eliminación de evento: ${resourceUri}`)
    
    // Aquí se implementaría la lógica para:
    // 1. Extraer el ID del evento de Google desde resourceUri
    // 2. Buscar el evento en nuestra base de datos por googleEventId
    // 3. Marcar el evento como 'cancelled'
    // 4. Enviar emails de cancelación a los invitados
    // 5. Cancelar jobs de email pendientes

    // Por ahora, solo loggeamos la acción
    await prisma.auditLog.create({
      data: {
        action: 'calendar_event_deletion_processed',
        entityType: 'event',
        details: {
          resourceUri,
          channelId,
          action: 'event_deleted'
        }
      }
    })

  } catch (error) {
    console.error('Error procesando eliminación de evento:', error)
    throw error
  }
}

// GET method para verificar que el endpoint está funcionando
export async function GET(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    // Obtener estadísticas de webhooks recientes
    const recentWebhooks = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['webhook_received', 'webhook_error']
        }
      },
      take: 20,
      orderBy: { createdAt: 'desc' }
    })

    const stats = {
      totalWebhooks: recentWebhooks.length,
      successfulWebhooks: recentWebhooks.filter(w => w.action === 'webhook_received').length,
      errorWebhooks: recentWebhooks.filter(w => w.action === 'webhook_error').length,
      lastWebhook: recentWebhooks[0]?.createdAt || null
    }

    return successResponse({
      status: 'active',
      endpoint: '/api/webhooks/google/calendar',
      stats,
      recentWebhooks
    }, 'Webhook endpoint funcionando correctamente')

  } catch (error) {
    console.error('Error obteniendo estado de webhooks:', error)
    return internalServerErrorResponse()
  }
}
