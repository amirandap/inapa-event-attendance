# INSTRUCCIONES 03: Integración con Google APIs

## Objetivo
Configurar e implementar la integración con Google Calendar API y Gmail API para sincronizar eventos y enviar correos electrónicos.

## Tareas a Ejecutar

### 1. Configuración de Google APIs

#### 1.1 Configurar Google Cloud Console
1. Crear/acceder proyecto en Google Cloud Console
2. Habilitar APIs:
   - Google Calendar API
   - Gmail API
   - Google Cloud Pub/Sub API (para webhooks)
3. Crear Service Account con Domain-Wide Delegation
4. Descargar archivo de credenciales JSON
5. Configurar Domain-Wide Delegation en Google Workspace Admin

#### 1.2 Variables de Entorno
Añadir en `.env.local`:

```env
GOOGLE_PROJECT_ID="tu-proyecto-id"
GOOGLE_CLIENT_EMAIL="service-account@proyecto.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID="minutas@inapa.gob.do"
GMAIL_SENDER="minutas@inapa.gob.do"
GOOGLE_WEBHOOK_URL="https://tu-dominio.com/api/webhooks/google/calendar"
```

### 2. Cliente de Google Calendar

Crear `lib/google/calendar.ts`:

```typescript
import { google } from 'googleapis'
import { GoogleCalendarEvent } from '@/lib/types'

class GoogleCalendarService {
  private calendar: any
  private auth: any

  constructor() {
    this.auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly'
      ],
      subject: process.env.GOOGLE_CALENDAR_ID // Para Domain-Wide Delegation
    })

    this.calendar = google.calendar({ version: 'v3', auth: this.auth })
  }

  /**
   * Configurar webhook para recibir notificaciones
   */
  async setupWebhook(): Promise<string> {
    try {
      const response = await this.calendar.events.watch({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        requestBody: {
          id: `inapa-webhook-${Date.now()}`, // ID único
          type: 'web_hook',
          address: process.env.GOOGLE_WEBHOOK_URL,
          params: {
            ttl: '3600' // 1 hora para testing, usar más tiempo en producción
          }
        }
      })

      console.log('Webhook configurado:', response.data)
      return response.data.resourceId
    } catch (error) {
      console.error('Error configurando webhook:', error)
      throw error
    }
  }

  /**
   * Obtener evento específico
   */
  async getEvent(eventId: string): Promise<GoogleCalendarEvent | null> {
    try {
      const response = await this.calendar.events.get({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        eventId: eventId
      })

      return this.transformEvent(response.data)
    } catch (error) {
      console.error('Error obteniendo evento:', error)
      if (error.code === 404) {
        return null // Evento no encontrado o eliminado
      }
      throw error
    }
  }

  /**
   * Listar eventos en rango de fechas
   */
  async listEvents(
    timeMin?: Date,
    timeMax?: Date,
    maxResults: number = 250
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        timeMin: timeMin?.toISOString(),
        timeMax: timeMax?.toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      })

      return response.data.items?.map(this.transformEvent) || []
    } catch (error) {
      console.error('Error listando eventos:', error)
      throw error
    }
  }

  /**
   * Sincronizar eventos usando token de sincronización
   */
  async syncEvents(syncToken?: string): Promise<{
    events: GoogleCalendarEvent[]
    nextSyncToken: string
  }> {
    try {
      const params: any = {
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        singleEvents: true
      }

      if (syncToken) {
        params.syncToken = syncToken
      } else {
        // Primera sincronización - últimos 30 días y próximos 90 días
        params.timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        params.timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      }

      const response = await this.calendar.events.list(params)

      return {
        events: response.data.items?.map(this.transformEvent) || [],
        nextSyncToken: response.data.nextSyncToken
      }
    } catch (error) {
      console.error('Error sincronizando eventos:', error)
      throw error
    }
  }

  /**
   * Transformar evento de Google a nuestro formato
   */
  private transformEvent(googleEvent: any): GoogleCalendarEvent {
    return {
      id: googleEvent.id,
      summary: googleEvent.summary || 'Sin título',
      description: googleEvent.description,
      location: googleEvent.location,
      start: {
        dateTime: googleEvent.start?.dateTime || googleEvent.start?.date,
        timeZone: googleEvent.start?.timeZone
      },
      end: {
        dateTime: googleEvent.end?.dateTime || googleEvent.end?.date,
        timeZone: googleEvent.end?.timeZone
      },
      organizer: {
        email: googleEvent.organizer?.email || '',
        displayName: googleEvent.organizer?.displayName
      },
      attendees: googleEvent.attendees?.map((attendee: any) => ({
        email: attendee.email,
        displayName: attendee.displayName,
        responseStatus: attendee.responseStatus,
        resource: attendee.resource || false
      })),
      status: googleEvent.status
    }
  }

  /**
   * Validar configuración de webhook
   */
  async validateWebhook(): Promise<boolean> {
    try {
      // Intentar obtener información del calendario
      const response = await this.calendar.calendars.get({
        calendarId: process.env.GOOGLE_CALENDAR_ID
      })
      
      console.log('Calendario accesible:', response.data.summary)
      return true
    } catch (error) {
      console.error('Error validando acceso al calendario:', error)
      return false
    }
  }
}

export const googleCalendarService = new GoogleCalendarService()
```

### 3. Cliente de Gmail

Crear `lib/google/gmail.ts`:

```typescript
import { google } from 'googleapis'
import nodemailer from 'nodemailer'
import { createTransport } from 'nodemailer'

interface EmailAttachment {
  filename: string
  content: Buffer
  contentType: string
}

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: EmailAttachment[]
}

class GmailService {
  private auth: any
  private gmail: any
  private transporter: any

  constructor() {
    this.auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose'
      ],
      subject: process.env.GMAIL_SENDER // Para Domain-Wide Delegation
    })

    this.gmail = google.gmail({ version: 'v1', auth: this.auth })
    this.setupTransporter()
  }

  private async setupTransporter() {
    try {
      // Obtener access token
      const accessToken = await this.auth.getAccessToken()
      
      this.transporter = createTransporter({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.GMAIL_SENDER,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN,
          accessToken: accessToken.token
        }
      })
    } catch (error) {
      console.error('Error configurando transporter Gmail:', error)
      throw error
    }
  }

  /**
   * Enviar email usando Nodemailer con OAuth2
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.GMAIL_SENDER,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Email enviado exitosamente:', result.messageId)
      return true
    } catch (error) {
      console.error('Error enviando email:', error)
      throw error
    }
  }

  /**
   * Enviar email usando Gmail API directamente
   */
  async sendEmailWithGmailAPI(options: EmailOptions): Promise<boolean> {
    try {
      const emailContent = this.buildEmailContent(options)
      const encodedEmail = Buffer.from(emailContent).toString('base64url')

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail
        }
      })

      console.log('Email enviado con Gmail API:', response.data.id)
      return true
    } catch (error) {
      console.error('Error enviando email con Gmail API:', error)
      throw error
    }
  }

  /**
   * Construir contenido del email en formato MIME
   */
  private buildEmailContent(options: EmailOptions): string {
    const boundary = 'boundary_' + Math.random().toString(36).substr(2, 9)
    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to

    let email = [
      `From: ${process.env.GMAIL_SENDER}`,
      `To: ${recipients}`,
      `Subject: ${options.subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      options.html,
      ''
    ]

    // Añadir adjuntos si existen
    if (options.attachments) {
      options.attachments.forEach(attachment => {
        email.push(`--${boundary}`)
        email.push(`Content-Type: ${attachment.contentType}`)
        email.push(`Content-Disposition: attachment; filename="${attachment.filename}"`)
        email.push('Content-Transfer-Encoding: base64')
        email.push('')
        email.push(attachment.content.toString('base64'))
        email.push('')
      })
    }

    email.push(`--${boundary}--`)
    return email.join('\r\n')
  }

  /**
   * Validar configuración de Gmail
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      const response = await this.gmail.users.getProfile({
        userId: 'me'
      })
      
      console.log('Gmail configurado correctamente para:', response.data.emailAddress)
      return true
    } catch (error) {
      console.error('Error validando configuración Gmail:', error)
      return false
    }
  }
}

export const gmailService = new GmailService()
```

### 4. Webhook de Google Calendar

Crear `app/api/webhooks/google/calendar/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { googleCalendarService } from '@/lib/google/calendar'
import { DatabaseService } from '@/lib/utils/database'
import { generateFormToken } from '@/lib/tokens'
import { qrService } from '@/lib/qr/generate'
import { pdfService } from '@/lib/pdf/buildInitial'
import { gmailService } from '@/lib/google/gmail'
import { jobScheduler } from '@/lib/jobs/scheduler'

export async function POST(request: NextRequest) {
  try {
    // Validar headers de Google
    const headersList = headers()
    const channelId = headersList.get('x-goog-channel-id')
    const channelToken = headersList.get('x-goog-channel-token')
    const resourceId = headersList.get('x-goog-resource-id')
    const resourceState = headersList.get('x-goog-resource-state')

    if (!channelId || !resourceId) {
      return NextResponse.json({ error: 'Invalid webhook headers' }, { status: 400 })
    }

    // Log del webhook recibido
    await DatabaseService.createAuditLog(
      'webhook_received',
      'calendar',
      resourceId,
      {
        channelId,
        resourceState,
        headers: Object.fromEntries(headersList.entries())
      }
    )

    // Si es solo sincronización, obtener eventos cambiados
    if (resourceState === 'sync') {
      console.log('Webhook de sincronización recibido')
      return NextResponse.json({ ok: true })
    }

    // Para cambios de recursos, necesitamos obtener el evento específico
    // Nota: Google no envía el ID del evento en el webhook, necesitamos sincronizar
    try {
      await syncRecentEvents()
    } catch (error) {
      console.error('Error sincronizando eventos:', error)
      // No fallar el webhook por errores de sincronización
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error procesando webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Sincronizar eventos recientes para detectar cambios
 */
async function syncRecentEvents() {
  // Obtener eventos de las últimas 2 horas y próximas 24 horas
  const timeMin = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
  const timeMax = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas adelante

  const googleEvents = await googleCalendarService.listEvents(timeMin, timeMax)

  for (const googleEvent of googleEvents) {
    await processGoogleEvent(googleEvent)
  }
}

/**
 * Procesar un evento de Google Calendar
 */
async function processGoogleEvent(googleEvent: any) {
  try {
    // Si el evento está cancelado, marcar como cancelado
    if (googleEvent.status === 'cancelled') {
      await handleCancelledEvent(googleEvent.id)
      return
    }

    // Crear/actualizar organizador
    const organizer = await DatabaseService.upsertOrganizer(
      googleEvent.organizer.email,
      googleEvent.organizer.displayName
    )

    // Crear/actualizar evento
    const event = await DatabaseService.upsertEventFromGoogle(googleEvent, organizer.id)

    // Actualizar invitados
    await DatabaseService.upsertInvitees(event.id, googleEvent.attendees)

    // Si es un evento nuevo, realizar configuración inicial
    const isNewEvent = !event.formToken

    if (isNewEvent) {
      await setupNewEvent(event.id)
    }

    console.log(`Evento ${isNewEvent ? 'creado' : 'actualizado'}:`, event.id)
  } catch (error) {
    console.error('Error procesando evento:', googleEvent.id, error)
    throw error
  }
}

/**
 * Configurar evento nuevo
 */
async function setupNewEvent(eventId: string) {
  const event = await DatabaseService.getEventWithRelations(eventId)
  if (!event) return

  try {
    // Generar token del formulario
    const formToken = generateFormToken(eventId, event.endAt)
    
    // Actualizar evento con token
    await prisma.event.update({
      where: { id: eventId },
      data: { formToken }
    })

    // Generar QR
    const qrDataUrl = await qrService.generateQR(
      `${process.env.APP_BASE_URL}/a/${formToken}`
    )

    // Generar PDF inicial
    const pdfBuffer = await pdfService.generateInitialPDF({
      event,
      qr: qrDataUrl
    })

    // Enviar correo inicial
    await gmailService.sendEmail({
      to: event.organizer.email,
      subject: `QR de Asistencia - ${event.title}`,
      html: await buildInitialEmailTemplate(event, formToken),
      attachments: [{
        filename: `QR-Asistencia-${event.title}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    })

    // Programar jobs de notificación
    await jobScheduler.schedulePreCloseJob(
      eventId,
      new Date(event.endAt.getTime() - 15 * 60 * 1000) // 15 min antes
    )

    await jobScheduler.scheduleFinalJob(
      eventId,
      new Date(event.endAt.getTime() + 15 * 60 * 1000) // 15 min después
    )

    console.log('Evento configurado exitosamente:', eventId)
  } catch (error) {
    console.error('Error configurando evento nuevo:', eventId, error)
    throw error
  }
}

/**
 * Manejar evento cancelado
 */
async function handleCancelledEvent(googleEventId: string) {
  const event = await prisma.event.findUnique({
    where: { googleEventId }
  })

  if (event) {
    await prisma.event.update({
      where: { id: event.id },
      data: { status: 'cancelled' }
    })

    // Cancelar jobs programados
    await jobScheduler.cancelJobs(event.id)

    console.log('Evento cancelado:', event.id)
  }
}

/**
 * Template de email inicial
 */
async function buildInitialEmailTemplate(event: any, formToken: string) {
  const formUrl = `${process.env.APP_BASE_URL}/a/${formToken}`
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Sistema de Registro de Asistencias - INAPA</h2>
      
      <h3>Evento: ${event.title}</h3>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Fecha:</strong> ${event.startAt.toLocaleDateString('es-DO')}</p>
        <p><strong>Hora:</strong> ${event.startAt.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</p>
        ${event.location ? `<p><strong>Lugar:</strong> ${event.location}</p>` : ''}
      </div>
      
      <p>Se ha generado el formulario de registro de asistencias para su evento.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${formUrl}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Abrir Formulario de Asistencia
        </a>
      </div>
      
      <p>Adjunto encontrará el archivo PDF con el código QR para facilitar el acceso al formulario.</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
      
      <p style="font-size: 12px; color: #64748b;">
        Instituto Nacional de Aguas Potables y Alcantarillados (INAPA)<br>
        Sistema automatizado - No responder a este correo
      </p>
    </div>
  `
}
```

### 5. Endpoint de Sincronización Manual

Crear `app/api/events/sync/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { googleCalendarService } from '@/lib/google/calendar'
import { DatabaseService } from '@/lib/utils/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { googleEventId } = body

    if (googleEventId) {
      // Sincronizar evento específico
      const googleEvent = await googleCalendarService.getEvent(googleEventId)
      
      if (!googleEvent) {
        return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
      }

      await processGoogleEvent(googleEvent)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Evento sincronizado',
        eventId: googleEvent.id 
      })
    } else {
      // Sincronización completa
      const { events, nextSyncToken } = await googleCalendarService.syncEvents()
      
      let processed = 0
      for (const googleEvent of events) {
        await processGoogleEvent(googleEvent)
        processed++
      }

      return NextResponse.json({ 
        success: true, 
        message: `${processed} eventos sincronizados`,
        nextSyncToken 
      })
    }
  } catch (error) {
    console.error('Error en sincronización:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Validar configuración
    const isCalendarValid = await googleCalendarService.validateWebhook()
    const isGmailValid = await gmailService.validateConfiguration()

    return NextResponse.json({
      calendar: isCalendarValid,
      gmail: isGmailValid,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error validando configuración' },
      { status: 500 }
    )
  }
}

// Reutilizar función del webhook
async function processGoogleEvent(googleEvent: any) {
  // ... misma implementación del webhook
}
```

## Entregables

✅ Google Calendar API configurado  
✅ Gmail API configurado  
✅ Webhook de Google Calendar implementado  
✅ Sincronización de eventos implementada  
✅ Envío de emails configurado  
✅ Validación de configuración implementada  

## Testing

```bash
# Ejecutar para probar las configuraciones
curl http://localhost:3000/api/events/sync

# Configurar webhook (solo en producción)
# Se ejecuta automáticamente al inicializar el servicio
```

## Siguiente Paso
Continuar con **INSTRUCCIONES_04_UI_COMPONENTES.md** para crear la interfaz de usuario y componentes.
