import { google } from 'googleapis';
import { GoogleCalendarEvent } from '@/lib/types';
import { prisma } from '@/lib/prisma';

interface CalendarSyncOptions {
  useGoogleAPI?: boolean;
  fallbackToLocal?: boolean;
  syncInterval?: number; // minutos
}

export class HybridCalendarService {
  private auth: any;
  private lastSyncAttempt: Date = new Date(0);
  private syncInterval: number = 15; // minutos

  constructor(options: CalendarSyncOptions = {}) {
    this.syncInterval = options.syncInterval || 15;
    
    if (options.useGoogleAPI) {
      try {
        this.initializeGoogleAuth();
      } catch (error) {
        console.warn('Google Calendar API no disponible, usando modo local');
      }
    }
  }

  private initializeGoogleAuth() {
    // Intentar diferentes métodos de autenticación
    const authMethods = [
      this.tryServiceAccount.bind(this),
      this.tryOAuth.bind(this),
      this.tryDelegatedAccess.bind(this)
    ];

    for (const method of authMethods) {
      try {
        this.auth = method();
        console.log('✅ Google Calendar conectado');
        return;
      } catch (error) {
        console.warn(`Método de auth falló: ${error.message}`);
      }
    }
    
    throw new Error('No se pudo conectar con Google Calendar');
  }

  private tryServiceAccount() {
    return new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_PROJECT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly']
    });
  }

  private tryOAuth() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    return oauth2Client;
  }

  private tryDelegatedAccess() {
    return new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_DELEGATE_EMAIL,
        private_key: process.env.GOOGLE_DELEGATE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      subject: 'minutas@inapa.gob.do' // Impersonar cuenta objetivo
    });
  }

  /**
   * Obtener eventos con fallback automático
   */
  async getEvents(timeMin?: Date, timeMax?: Date): Promise<GoogleCalendarEvent[]> {
    // 1. Intentar sincronización si es necesaria
    await this.attemptSync();

    // 2. Siempre retornar desde base de datos local (fuente de verdad)
    return await this.getEventsFromDatabase(timeMin, timeMax);
  }

  /**
   * Intentar sincronización con Google Calendar
   */
  private async attemptSync(): Promise<void> {
    const now = new Date();
    const timeSinceLastSync = (now.getTime() - this.lastSyncAttempt.getTime()) / (1000 * 60);

    // Solo intentar sync si ha pasado el intervalo
    if (timeSinceLastSync < this.syncInterval) {
      return;
    }

    this.lastSyncAttempt = now;

    if (!this.auth) {
      console.log('🔄 Google Calendar no disponible, usando datos locales');
      return;
    }

    try {
      console.log('🔄 Sincronizando con Google Calendar...');
      
      const calendar = google.calendar({ version: 'v3', auth: this.auth });
      const response = await calendar.events.list({
        calendarId: 'minutas@inapa.gob.do',
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
        timeMin: new Date().toISOString(),
      });

      if (response.data.items) {
        await this.updateLocalEvents(response.data.items);
        console.log(`✅ ${response.data.items.length} eventos sincronizados`);
      }

    } catch (error) {
      console.warn('⚠️ Sync con Google Calendar falló:', error.message);
      
      // Registrar intento fallido para troubleshooting
      await this.logSyncError(error.message);
    }
  }

  /**
   * Actualizar eventos locales con datos de Google
   */
  private async updateLocalEvents(googleEvents: any[]): Promise<void> {
    for (const googleEvent of googleEvents) {
      const eventData = {
        googleEventId: googleEvent.id,
        title: googleEvent.summary || 'Sin título',
        description: googleEvent.description || '',
        location: googleEvent.location || '',
        startAt: new Date(googleEvent.start?.dateTime || googleEvent.start?.date),
        endAt: new Date(googleEvent.end?.dateTime || googleEvent.end?.date),
        lastSyncAt: new Date(),
        source: 'google_calendar'
      };

      // Upsert: crear o actualizar
      await prisma.event.upsert({
        where: { googleEventId: googleEvent.id },
        update: eventData,
        create: {
          ...eventData,
          formToken: this.generateFormToken(),
          status: 'active',
          organizerId: await this.getOrCreateOrganizer('minutas@inapa.gob.do')
        }
      });
    }
  }

  /**
   * Obtener eventos desde base de datos local
   */
  private async getEventsFromDatabase(
    timeMin?: Date, 
    timeMax?: Date
  ): Promise<GoogleCalendarEvent[]> {
    const events = await prisma.event.findMany({
      where: {
        AND: [
          timeMin ? { startAt: { gte: timeMin } } : {},
          timeMax ? { startAt: { lte: timeMax } } : {},
          { status: 'active' }
        ]
      },
      include: {
        organizer: true,
        invitees: true
      },
      orderBy: { startAt: 'asc' }
    });

    return events.map(this.transformToGoogleFormat);
  }

  /**
   * Crear evento manualmente (cuando Google no está disponible)
   */
  async createEvent(eventData: {
    title: string;
    description?: string;
    location?: string;
    startAt: Date;
    endAt: Date;
    organizerEmail: string;
  }): Promise<GoogleCalendarEvent> {
    
    // 1. Intentar crear en Google Calendar primero
    let googleEventId: string | null = null;
    
    if (this.auth) {
      try {
        const calendar = google.calendar({ version: 'v3', auth: this.auth });
        
        const googleResponse = await calendar.events.insert({
          calendarId: 'minutas@inapa.gob.do',
          requestBody: {
            summary: eventData.title,
            description: eventData.description,
            location: eventData.location,
            start: {
              dateTime: eventData.startAt.toISOString(),
              timeZone: 'America/Santo_Domingo'
            },
            end: {
              dateTime: eventData.endAt.toISOString(),
              timeZone: 'America/Santo_Domingo'
            }
          }
        });
        
        googleEventId = googleResponse.data.id;
        console.log('✅ Evento creado en Google Calendar');
        
      } catch (error) {
        console.warn('⚠️ No se pudo crear en Google Calendar, guardando solo localmente');
      }
    }

    // 2. Siempre guardar en base de datos local
    const localEvent = await prisma.event.create({
      data: {
        googleEventId,
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        startAt: eventData.startAt,
        endAt: eventData.endAt,
        formToken: this.generateFormToken(),
        status: 'active',
        source: googleEventId ? 'google_calendar' : 'manual_entry',
        organizerId: await this.getOrCreateOrganizer(eventData.organizerEmail)
      },
      include: {
        organizer: true,
        invitees: true
      }
    });

    return this.transformToGoogleFormat(localEvent);
  }

  /**
   * Verificar estado de conectividad
   */
  async getConnectionStatus(): Promise<{
    googleAPI: boolean;
    database: boolean;
    lastSync: Date;
    totalEvents: number;
    message: string;
  }> {
    const totalEvents = await prisma.event.count({ where: { status: 'active' } });
    
    let googleAPI = false;
    if (this.auth) {
      try {
        const calendar = google.calendar({ version: 'v3', auth: this.auth });
        await calendar.calendars.get({ calendarId: 'minutas@inapa.gob.do' });
        googleAPI = true;
      } catch (error) {
        // Google API no disponible
      }
    }

    const message = googleAPI 
      ? '🎉 Conectado a Google Calendar y base de datos local'
      : '⚠️ Solo base de datos local disponible (modo offline)';

    return {
      googleAPI,
      database: true, // Siempre true si llegamos aquí
      lastSync: this.lastSyncAttempt,
      totalEvents,
      message
    };
  }

  // Métodos auxiliares
  private generateFormToken(): string {
    return crypto.randomUUID();
  }

  private async getOrCreateOrganizer(email: string): Promise<number> {
    const organizer = await prisma.organizer.upsert({
      where: { email },
      update: {},
      create: { email, name: email.split('@')[0] }
    });
    return organizer.id;
  }

  private transformToGoogleFormat(event: any): GoogleCalendarEvent {
    return {
      id: event.googleEventId || event.id,
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startAt.toISOString(),
        timeZone: 'America/Santo_Domingo'
      },
      end: {
        dateTime: event.endAt.toISOString(),
        timeZone: 'America/Santo_Domingo'
      },
      organizer: {
        email: event.organizer.email,
        displayName: event.organizer.name
      },
      attendees: event.invitees?.map((invitee: any) => ({
        email: invitee.email,
        displayName: invitee.name,
        responseStatus: invitee.response || 'needsAction',
        resource: invitee.isResource
      })) || [],
      status: event.status
    };
  }

  private async logSyncError(error: string): Promise<void> {
    // Log para troubleshooting (opcional)
    console.error(`Sync error at ${new Date().toISOString()}: ${error}`);
  }
}

export const hybridCalendarService = new HybridCalendarService({
  useGoogleAPI: true,
  fallbackToLocal: true,
  syncInterval: 15 // minutos
});
