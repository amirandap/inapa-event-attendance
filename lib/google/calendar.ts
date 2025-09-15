import { google } from 'googleapis';
import { GoogleCalendarEvent } from '@/lib/types';
import ICAL from 'ical.js';
import { smtpService } from '@/lib/email/smtpService';
import { prisma } from '@/lib/prisma';

// Configuración del fallback iCal
const ICAL_URL = 'https://calendar.google.com/calendar/ical/c_f02682f1ca102750e235b9686d67b19ede3faf5b244547c677e9685b006e5e3f%40group.calendar.google.com/private-b527da9f779a644f8460cdd8149a2944/basic.ics';

class GoogleCalendarService {
  private calendar: any;
  private auth: any;
  private calendarId: string;

  constructor() {
    try {
      // Usar credenciales desde variables de entorno
      const privateKey = process.env.GOOGLE_PRIVATE_KEY;
      if (!privateKey) throw new Error('GOOGLE_PRIVATE_KEY no está definida');
      if (!process.env.GOOGLE_CLIENT_EMAIL) throw new Error('GOOGLE_CLIENT_EMAIL no está definida');
      
      const credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey.includes('\\n') 
          ? privateKey.split('\\n').join('\n') 
          : privateKey,
        project_id: process.env.GOOGLE_PROJECT_ID,
      };

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/gmail.send'
        ]
      });

      this.calendar = google.calendar({ version: 'v3', auth: this.auth });
      this.calendarId = process.env.GOOGLE_CALENDAR_ID || '';
    } catch (error) {
      console.error('Error inicializando GoogleCalendarService:', error);
      throw error;
    }
  }

  /**
   * Listar eventos en un rango de fechas con fallback iCal
   */
  async listEvents(
    timeMin?: Date,
    timeMax?: Date,
    maxResults: number = 10
  ): Promise<GoogleCalendarEvent[]> {
    try {
      // Intentar primero con la API de Google Calendar
      const client = await this.auth.getClient();
      const calendar = google.calendar({ version: 'v3', auth: client });

      const response = await calendar.events.list({
        calendarId: this.calendarId,
        timeMin: timeMin?.toISOString(),
        timeMax: timeMax?.toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      console.log('✅ Eventos obtenidos desde Google Calendar API');
      return response.data.items?.map(this.transformEvent) || [];
      
    } catch (error) {
      console.warn('⚠️ Google Calendar API falló, usando fallback iCal:', error);
      
      // Fallback: usar iCal
      return await this.listEventsFromICal(timeMin, timeMax, maxResults);
    }
  }

  /**
   * Fallback: Obtener eventos desde iCal URL
   */
  private async listEventsFromICal(
    timeMin?: Date,
    timeMax?: Date,
    maxResults: number = 10
  ): Promise<GoogleCalendarEvent[]> {
    try {
      console.log('🔄 Obteniendo eventos desde iCal fallback...');
      
      const response = await fetch(ICAL_URL);
      if (!response.ok) {
        throw new Error(`Error descargando iCal: ${response.status}`);
      }
      
      const icalData = await response.text();
      const jcalData = ICAL.parse(icalData);
      const comp = new ICAL.Component(jcalData);
      
      const vevents = comp.getAllSubcomponents('vevent');
      const events: GoogleCalendarEvent[] = [];
      
      for (const vevent of vevents) {
        const event = new ICAL.Event(vevent);
        
        if (timeMin && event.startDate.toJSDate() < timeMin) continue;
        if (timeMax && event.startDate.toJSDate() > timeMax) continue;
        
        events.push(this.transformICalJSEvent(event));
      }
      
      events.sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());
      
      console.log(`✅ ${events.length} eventos obtenidos desde iCal`);
      return events.slice(0, maxResults);
      
    } catch (error) {
      console.error('❌ Error obteniendo eventos desde iCal:', error);
      throw new Error('No se pudieron obtener eventos ni desde API ni desde iCal');
    }
  }

  /**
   * Transformar evento ical.js a nuestro formato
   */
  private transformICalJSEvent(icalEvent: ICAL.Event): GoogleCalendarEvent {
    return {
      id: icalEvent.uid || '',
      summary: icalEvent.summary || 'Sin título',
      description: icalEvent.description || '',
      location: icalEvent.location || '',
      start: {
        dateTime: icalEvent.startDate.toJSDate().toISOString(),
        timeZone: 'America/Santo_Domingo'
      },
      end: {
        dateTime: icalEvent.endDate.toJSDate().toISOString(),
        timeZone: 'America/Santo_Domingo'
      },
      organizer: {
        email: icalEvent.organizer || '',
        displayName: ''
      },
      attendees: icalEvent.attendees?.map((attendee) => ({
        email: attendee.toString() || '',
        displayName: '',
        responseStatus: 'needsAction',
        resource: false
      })) || [],
      status: 'confirmed'
    };
  }

  /**
   * Mapear estado de respuesta iCal a formato Google
   */
  private mapICalResponseStatus(partstat?: string): string {
    switch (partstat?.toUpperCase()) {
      case 'ACCEPTED': return 'accepted';
      case 'DECLINED': return 'declined';
      case 'TENTATIVE': return 'tentative';
      case 'NEEDS-ACTION': return 'needsAction';
      default: return 'needsAction';
    }
  }

  /**
   * Crear un nuevo evento y enviar email de confirmación.
   */
  async createEvent(eventData: any): Promise<GoogleCalendarEvent> {
    try {
      const client = await this.auth.getClient();
      const calendar = google.calendar({ version: 'v3', auth: client });

      const response = await calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: eventData,
      });
            
      const createdEvent = this.transformEvent(response.data);

      // Encontrar o crear el organizador en nuestra BD
      const organizer = await prisma.organizer.upsert({
          where: { email: createdEvent.organizer?.email || 'default@example.com' },
          update: {},
          create: {
              email: createdEvent.organizer?.email || 'default@example.com',
              name: createdEvent.organizer?.displayName || createdEvent.organizer?.email
          }
      });
      
      // Enviar email de confirmación
      if (organizer.email) {
          const subject = `Evento Registrado: ${createdEvent.summary}`;
          const body = `
              <h1>¡Evento Sincronizado Exitosamente!</h1>
              <p>Hola ${organizer.name || organizer.email},</p>
              <p>El siguiente evento ha sido registrado y sincronizado en el sistema de asistencias de INAPA:</p>
              <ul>
                  <li><strong>Título:</strong> ${createdEvent.summary}</li>
                  <li><strong>Fecha de Inicio:</strong> ${new Date(createdEvent.start.dateTime).toLocaleString('es-DO')}</li>
                  <li><strong>Ubicación:</strong> ${createdEvent.location || 'No especificada'}</li>
              </ul>
              <p>Ya puedes gestionar las asistencias y reportes desde el dashboard.</p>
              <br/>
              <p>Saludos,</p>
              <p><strong>Sistema de Asistencias INAPA</strong></p>
          `;
          await smtpService.sendEmail([organizer.email], subject, body);
          console.log(`✅ Email de confirmación enviado a ${organizer.email} para el evento "${createdEvent.summary}".`);
      }

      return createdEvent;
    } catch (error) {
      console.error('Error creando evento:', error);
      throw error;
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
    };
  }

  /**
   * Validar la configuración del servicio con fallback
   */
  async validateConfiguration(): Promise<{ api: boolean; ical: boolean; message: string }> {
    const result = { api: false, ical: false, message: '' };
    
    try {
      const client = await this.auth.getClient();
      const calendar = google.calendar({ version: 'v3', auth: client });
      
      const response = await calendar.calendars.get({
        calendarId: this.calendarId
      });
      
      result.api = true;
      result.message += `✅ API Google Calendar: ${response.data.summary}\n`;
    } catch (error) {
      result.message += `❌ API Google Calendar: ${error}\n`;
    }
    
    try {
      const response = await fetch(ICAL_URL);
      if (response.ok) {
        result.ical = true;
        result.message += `✅ iCal Fallback: Conectado correctamente\n`;
      } else {
        result.message += `❌ iCal Fallback: Error ${response.status}\n`;
      }
    } catch (error) {
      result.message += `❌ iCal Fallback: ${error}\n`;
    }
    
    if (!result.api && !result.ical) {
      result.message += '🚨 CRÍTICO: Ningún método de acceso funciona';
    } else if (!result.api && result.ical) {
      result.message += '⚠️ Solo funciona el fallback iCal';
    } else if (result.api && !result.ical) {
      result.message += '⚠️ Solo funciona la API de Google';
    } else {
      result.message += '🎉 Ambos métodos funcionan correctamente';
    }
    
    return result;
  }

}
export const googleCalendarService = new GoogleCalendarService();
