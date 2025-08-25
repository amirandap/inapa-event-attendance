import { NextRequest } from 'next/server'
import { googleCalendarService } from '@/lib/google/calendar'
import { 
  successResponse, 
  errorResponse 
} from '@/lib/api/responses'

export async function POST(request: NextRequest) {
  try {
    const eventData = {
      summary: "Evento de Prueba desde API",
      description: "Este es un evento de prueba creado desde la API Next.js",
      start: {
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mañana
        timeZone: "America/Santo_Domingo"
      },
      end: {
        dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Mañana + 1 hora
        timeZone: "America/Santo_Domingo"
      }
      // No incluimos attendees por la limitación de la cuenta de servicio
    }

    const event = await googleCalendarService.createEvent(eventData)
    return successResponse(event, 'Evento creado exitosamente')

  } catch (error) {
    console.error('Error creando evento de prueba:', error)
    return errorResponse(
      'CALENDAR_ERROR',
      'Error creando evento en Google Calendar',
      500
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Obtener eventos de los próximos 7 días (con fallback automático)
    const events = await googleCalendarService.listEvents(
      new Date(),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    )
    return successResponse(events, 'Eventos obtenidos exitosamente')

  } catch (error: any) {
    console.error('Error obteniendo eventos:', error)
    return errorResponse(
      'CALENDAR_ERROR',
      error.message || 'Error obteniendo eventos de Google Calendar',
      500
    )
  }
}

// Nuevo endpoint para validar conectividad
export async function PUT(request: NextRequest) {
  try {
    const validation = await googleCalendarService.validateConfiguration()
    
    return successResponse({
      validation,
      hasAccess: validation.api || validation.ical
    }, 'Validación de conectividad completada')

  } catch (error: any) {
    console.error('Error validando conectividad:', error)
    return errorResponse(
      'VALIDATION_ERROR',
      error.message || 'Error validando conectividad',
      500
    )
  }
}
