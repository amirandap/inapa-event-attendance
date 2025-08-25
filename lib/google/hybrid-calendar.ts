import { google } from 'googleapis';
import { calendar_v3 } from '@googleapis/calendar';
import { GoogleCalendarEvent } from '@/lib/types';
import { prisma } from '@/lib/prisma';
import { EventIdentifiers, EventSyncStatus, EventSource, EventStatus } from './types';
import { Event, GoogleEvent } from './models';

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
        type: "service_account",
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        client_id: process.env.GOOGLE_CLIENT_ID,
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
  /**
   * Forzar sincronización completa de eventos
   */
  public async forceSyncEvents(options: {
    fullSync?: boolean;
    timeMin?: Date;
    timeMax?: Date;
  } = {}): Promise<{
    synced: number;
    errors: number;
    details: string[];
  }> {
    const result = {
      synced: 0,
      errors: 0,
      details: [] as string[]
    };

    if (!this.auth) {
      throw new Error('Google Calendar no disponible');
    }

    try {
      console.log('🔄 Iniciando sincronización forzada...');
      
      const calendar = google.calendar({ version: 'v3', auth: this.auth });
      
      // Parámetros de búsqueda
      const searchParams: calendar_v3.Params$Resource$Events$List = {
        calendarId: 'minutas@inapa.gob.do',
        maxResults: options.fullSync ? 2500 : 100, // Máximo permitido por Google
        singleEvents: true,
        orderBy: 'updated',
        timeMin: options.timeMin?.toISOString() || new Date().toISOString()
      };

      if (options.timeMax) {
        searchParams.timeMax = options.timeMax.toISOString();
      }

      // Si no es sincronización completa, solo traer eventos actualizados desde última sincronización
      if (!options.fullSync) {
        const lastSync = await this.getLastSuccessfulSync();
        if (lastSync) {
          searchParams.updatedMin = lastSync.toISOString();
        }
      }

      const response = await calendar.events.list(searchParams);

      if (response.data.items?.length) {
        // Actualizar eventos en lotes para mejor rendimiento
        const batchSize = 50;
        for (let i = 0; i < response.data.items.length; i += batchSize) {
          const batch = response.data.items.slice(i, i + batchSize);
          try {
            await this.updateLocalEvents(batch);
            result.synced += batch.length;
            result.details.push(`✅ Lote ${i/batchSize + 1}: ${batch.length} eventos actualizados`);
          } catch (error) {
            result.errors += batch.length;
            result.details.push(`❌ Error en lote ${i/batchSize + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          }
        }
      }

      // Actualizar timestamp de última sincronización exitosa
      await this.updateLastSuccessfulSync();
      
      console.log(`✅ Sincronización completada: ${result.synced} eventos, ${result.errors} errores`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error en sincronización:', errorMessage);
      await this.logSyncError(errorMessage);
      throw error;
    }

    return result;
  }

  /**
   * Intento de sincronización regular (llamado por getEvents)
   */
  private async attemptSync(): Promise<void> {
    const now = new Date();
    const timeSinceLastSync = (now.getTime() - this.lastSyncAttempt.getTime()) / (1000 * 60);

    // Solo intentar sync si ha pasado el intervalo
    if (timeSinceLastSync < this.syncInterval) {
      return;
    }

    this.lastSyncAttempt = now;

    try {
      await this.forceSyncEvents({ fullSync: false });
    } catch (error) {
      // Solo log del error, no reintentamos para evitar bloquear getEvents
      console.warn('⚠️ Sync incremental falló, continuando con datos locales');
    }
  }

  /**
   * Obtener timestamp de última sincronización exitosa
   */
  private async getLastSuccessfulSync(): Promise<Date | null> {
    const lastSync = await prisma.event.findFirst({
      where: {
        syncStatus: EventSyncStatus.SYNCED
      },
      orderBy: {
        lastSyncAt: 'desc'
      },
      select: {
        lastSyncAt: true
      }
    });

    return lastSync?.lastSyncAt || null;
  }

  /**
   * Actualizar timestamp de última sincronización exitosa
   */
  private async updateLastSuccessfulSync(): Promise<void> {
    await prisma.systemConfig.upsert({
      where: {
        key: 'last_calendar_sync'
      },
      update: {
        value: new Date().toISOString()
      },
      create: {
        key: 'last_calendar_sync',
        value: new Date().toISOString(),
        description: 'Última sincronización exitosa con Google Calendar'
      }
    });
  }

  /**
   * Actualizar eventos locales con datos de Google
   */
  private async updateLocalEvents(googleEvents: calendar_v3.Schema$Event[]): Promise<void> {
    for (const googleEvent of googleEvents) {
      const eventIdentifiers: EventIdentifiers = {
        googleEventId: googleEvent.id || '',
        googleICalUID: googleEvent.iCalUID,
        recurringEventId: googleEvent.recurringEventId,
        sequence: googleEvent.sequence || 0,
        etag: googleEvent.etag
      };

      const existingEvent = await this.findExistingEvent(eventIdentifiers);
      
      if (existingEvent) {
        if (await this.shouldUpdateEvent(existingEvent, googleEvent)) {
          await this.updateEvent(existingEvent.id, googleEvent);
        }
      } else {
        await this.createNewEvent(googleEvent);
      }
    }
  }

  private async findExistingEvent(identifiers: EventIdentifiers): Promise<Event | null> {
    return await prisma.event.findFirst({
      where: {
        OR: [
          { googleEventId: identifiers.googleEventId },
          identifiers.googleICalUID ? { googleICalUID: identifiers.googleICalUID } : {},
          identifiers.recurringEventId ? { recurringEventId: identifiers.recurringEventId } : {}
        ]
      }
    });
  }

  private async shouldUpdateEvent(existingEvent: Event, googleEvent: calendar_v3.Schema$Event): Promise<boolean> {
    return (
      (googleEvent.sequence || 0) > (existingEvent.sequence || 0) ||
      new Date(googleEvent.updated || '') > (existingEvent.sourceUpdatedAt || new Date(0)) ||
      googleEvent.etag !== existingEvent.etag
    );
  }

  private async createNewEvent(googleEvent: calendar_v3.Schema$Event): Promise<Event> {
    const eventData = {
      googleEventId: googleEvent.id || '',
      googleICalUID: googleEvent.iCalUID || null,
      recurringEventId: googleEvent.recurringEventId || null,
      etag: googleEvent.etag || null,
      title: googleEvent.summary || 'Sin título',
      description: googleEvent.description || '',
      location: googleEvent.location || '',
      startAt: new Date(googleEvent.start?.dateTime || googleEvent.start?.date || ''),
      endAt: new Date(googleEvent.end?.dateTime || googleEvent.end?.date || ''),
      lastSyncAt: new Date(),
      sourceCreatedAt: googleEvent.created ? new Date(googleEvent.created) : null,
      sourceUpdatedAt: googleEvent.updated ? new Date(googleEvent.updated) : null,
      sequence: googleEvent.sequence || 0,
      meetingId: googleEvent.conferenceData?.conferenceId || null,
      conferenceData: googleEvent.conferenceData ? JSON.stringify(googleEvent.conferenceData) : null,
      source: EventSource.GOOGLE_CALENDAR,
      syncStatus: EventSyncStatus.SYNCED,
      status: this.mapGoogleEventStatus(googleEvent.status || '')
    };

    // Buscar primero por googleEventId y luego por iCalUID
    const existingEvent = await prisma.event.findFirst({
      where: {
        OR: [
          { googleEventId: googleEvent.id },
          { googleICalUID: googleEvent.iCalUID }
        ]
      }
    });

    if (existingEvent) {
      // Si el evento existe, actualizar solo si la versión es más reciente
      if (eventData.sequence > existingEvent.sequence || 
          new Date(eventData.sourceUpdatedAt!) > new Date(existingEvent.sourceUpdatedAt!)) {
        await prisma.event.update({
          where: { id: existingEvent.id },
          data: eventData
        });
        return existingEvent;
      }
      return existingEvent;
    } else {
      // Si el evento no existe, crearlo
      return await prisma.event.create({
        data: {
          ...eventData,
          formToken: this.generateFormToken(),
          organizerId: await this.getOrCreateOrganizer(googleEvent.organizer?.email || 'minutas@inapa.gob.do')
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

  private transformToGoogleFormat(event: Event): GoogleCalendarEvent {
    return {
      id: event.googleEventId || event.id,
      summary: event.title,
      description: event.description || '',
      location: event.location || '',
      start: {
        dateTime: event.startAt.toISOString(),
        timeZone: 'America/Santo_Domingo'
      },
      end: {
        dateTime: event.endAt.toISOString(),
        timeZone: 'America/Santo_Domingo'
      },
      sequence: event.sequence,
      etag: event.etag || undefined,
      iCalUID: event.googleICalUID || undefined,
      recurringEventId: event.recurringEventId || undefined,
      status: event.status
    };
  }

  private async updateEvent(eventId: string, googleEvent: calendar_v3.Schema$Event): Promise<Event> {
    const eventData = {
      googleEventId: googleEvent.id || '',
      googleICalUID: googleEvent.iCalUID || null,
      recurringEventId: googleEvent.recurringEventId || null,
      etag: googleEvent.etag || null,
      title: googleEvent.summary || 'Sin título',
      description: googleEvent.description || null,
      location: googleEvent.location || null,
      startAt: new Date(googleEvent.start?.dateTime || googleEvent.start?.date || ''),
      endAt: new Date(googleEvent.end?.dateTime || googleEvent.end?.date || ''),
      lastSyncAt: new Date(),
      sourceCreatedAt: googleEvent.created ? new Date(googleEvent.created) : null,
      sourceUpdatedAt: googleEvent.updated ? new Date(googleEvent.updated) : null,
      sequence: googleEvent.sequence || 0,
      meetingId: googleEvent.conferenceData?.conferenceId || null,
      conferenceData: googleEvent.conferenceData ? JSON.stringify(googleEvent.conferenceData) : null,
      syncStatus: EventSyncStatus.SYNCED,
      syncError: null,
      syncRetries: 0
    };

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: eventData
    });

    return updatedEvent;
  }

  private async logSyncError(error: string): Promise<void> {
    console.error(`Sync error at ${new Date().toISOString()}: ${error}`);
    
    // Opcional: guardar en la base de datos para análisis
    await prisma.auditLog.create({
      data: {
        action: 'SYNC_ERROR',
        entityType: 'Event',
        details: { error },
        ipAddress: null,
        userAgent: null
      }
    });
  }

  private mapGoogleEventStatus(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return EventStatus.ACTIVE;
      case 'cancelled':
        return EventStatus.CANCELLED;
      case 'tentative':
        return EventStatus.TENTATIVE;
      default:
        return EventStatus.ACTIVE;
    }
  }
}

export const hybridCalendarService = new HybridCalendarService({
  useGoogleAPI: true,
  fallbackToLocal: true,
  syncInterval: 15 // minutos
});
