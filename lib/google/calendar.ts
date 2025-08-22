import { google } from 'googleapis';
import { GoogleCalendarEvent } from '@/lib/types';
import path from 'path';

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
          'https://www.googleapis.com/auth/calendar.events'
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
   * Listar eventos en un rango de fechas
   */
  async listEvents(
    timeMin?: Date,
    timeMax?: Date,
    maxResults: number = 10
  ): Promise<GoogleCalendarEvent[]> {
    try {
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

      return response.data.items?.map(this.transformEvent) || [];
    } catch (error) {
      console.error('Error listando eventos:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo evento
   */
  async createEvent(eventData: any): Promise<GoogleCalendarEvent> {
    try {
      const client = await this.auth.getClient();
      const calendar = google.calendar({ version: 'v3', auth: client });

      const response = await calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: eventData,
      });

      return this.transformEvent(response.data);
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
   * Validar la configuración del servicio
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      const client = await this.auth.getClient();
      const calendar = google.calendar({ version: 'v3', auth: client });
      
      const response = await calendar.calendars.get({
        calendarId: this.calendarId
      });
      
      console.log('Calendario accesible:', response.data.summary);
      return true;
    } catch (error) {
      console.error('Error validando acceso al calendario:', error);
      return false;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
