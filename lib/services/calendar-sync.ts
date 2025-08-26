import { prisma } from '@/lib/prisma';
import { googleOAuthService } from '@/lib/auth/google-oauth';
import { generateUniqueFormToken } from '@/lib/utils/form-tokens';

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  status: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  created?: string;
  updated?: string;
  creator?: {
    email?: string;
    displayName?: string;
  };
}

interface SyncResult {
  success: boolean;
  totalEvents: number;
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
  syncedEvents: Array<{
    id: string;
    googleEventId: string;
    title: string;
    action: 'created' | 'updated' | 'skipped' | 'deleted';
  }>;
}

interface SyncOptions {
  calendarEmail: string;
  calendarId?: string;
  syncDays?: number;
  organizerId?: number;
  deleteRemovedEvents?: boolean;
  syncAttendees?: boolean;
}

export class CalendarSyncService {
  
  /**
   * Sincronizar eventos desde Google Calendar a la base de datos local
   */
  async syncCalendarEvents(options: SyncOptions): Promise<SyncResult> {
    const {
      calendarEmail,
      calendarId = 'primary',
      syncDays = 30,
      organizerId = 1, // Default organizer
      deleteRemovedEvents = false,
      syncAttendees = true
    } = options;

    const result: SyncResult = {
      success: false,
      totalEvents: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
      syncedEvents: []
    };

    try {
      console.log(`🔄 Iniciando sincronización de calendario: ${calendarEmail}`);

      // 1. Verificar autorización
      const authStatus = await googleOAuthService.getAuthStatus(calendarEmail);
      if (!authStatus.isAuthorized) {
        throw new Error(`Usuario ${calendarEmail} no está autorizado para Google Calendar`);
      }

      // 2. Obtener eventos de Google Calendar
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - syncDays);
      
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + syncDays);

      console.log(`📅 Obteniendo eventos entre ${timeMin.toISOString()} y ${timeMax.toISOString()}`);
      
      const googleEvents = await googleOAuthService.getCalendarEvents(
        calendarEmail,
        calendarId,
        timeMin,
        timeMax,
        250 // Máximo 250 eventos
      );

      result.totalEvents = googleEvents.length;
      console.log(`📋 Encontrados ${googleEvents.length} eventos en Google Calendar`);

      // 3. Obtener eventos existentes en la base de datos
      const existingEvents = await prisma.event.findMany({
        where: {
          googleEventId: {
            not: ''
          }
        },
        select: {
          id: true,
          googleEventId: true,
          title: true,
          startAt: true,
          endAt: true,
          updatedAt: true
        }
      });

      const existingEventMap = new Map(
        existingEvents.map(event => [event.googleEventId, event])
      );

      console.log(`💾 Eventos existentes en base de datos: ${existingEvents.length}`);

      // 4. Procesar cada evento de Google
      for (const googleEvent of googleEvents) {
        try {
          await this.syncSingleEvent(
            googleEvent as GoogleCalendarEvent,
            organizerId,
            existingEventMap,
            result,
            syncAttendees
          );
        } catch (error: any) {
          const errorMsg = `Error sincronizando evento ${googleEvent.id}: ${error.message}`;
          result.errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }

      // 5. Eliminar eventos que ya no existen en Google (opcional)
      if (deleteRemovedEvents) {
        await this.deleteRemovedEvents(googleEvents, existingEventMap, result);
      }

      // 6. Actualizar timestamp de última sincronización
      await prisma.calendarAuth.updateMany({
        where: { email: calendarEmail },
        data: { lastSyncAt: new Date() }
      });

      result.success = true;
      console.log(`✅ Sincronización completada: ${result.created} creados, ${result.updated} actualizados, ${result.deleted} eliminados`);

    } catch (error: any) {
      result.errors.push(`Error general de sincronización: ${error.message}`);
      console.error('❌ Error en sincronización:', error.message);
    }

    return result;
  }

  /**
   * Sincronizar un evento individual
   */
  private async syncSingleEvent(
    googleEvent: GoogleCalendarEvent,
    organizerId: number,
    existingEventMap: Map<string, any>,
    result: SyncResult,
    syncAttendees: boolean
  ): Promise<void> {
    
    // Ignorar eventos cancelados en Google
    if (googleEvent.status === 'cancelled') {
      if (existingEventMap.has(googleEvent.id)) {
        // Marcar como inactivo en lugar de eliminar
        await prisma.event.update({
          where: { googleEventId: googleEvent.id },
          data: { status: 'cancelled' }
        });
        
        result.deleted++;
        result.syncedEvents.push({
          id: existingEventMap.get(googleEvent.id)?.id || 'unknown',
          googleEventId: googleEvent.id,
          title: googleEvent.summary || 'Evento cancelado',
          action: 'deleted'
        });
      }
      return;
    }

    // Preparar datos del evento
    const eventData = this.prepareEventData(googleEvent, organizerId);
    
    // Verificar si el evento ya existe
    const existingEvent = existingEventMap.get(googleEvent.id);
    
    if (existingEvent) {
      // Actualizar evento existente
      await this.updateExistingEvent(existingEvent, eventData, googleEvent, result, syncAttendees);
    } else {
      // Crear nuevo evento
      await this.createNewEvent(eventData, googleEvent, result, syncAttendees);
    }
  }

  /**
   * Preparar datos del evento para la base de datos
   */
  private prepareEventData(googleEvent: GoogleCalendarEvent, organizerId: number) {
    const startTime = new Date(googleEvent.start.dateTime || googleEvent.start.date || '');
    const endTime = new Date(googleEvent.end.dateTime || googleEvent.end.date || '');

    return {
      googleEventId: googleEvent.id,
      title: googleEvent.summary || 'Sin título',
      description: googleEvent.description || null,
      location: googleEvent.location || null,
      startAt: startTime,
      endAt: endTime,
      organizerId,
      status: 'active'
    };
  }

  /**
   * Crear nuevo evento
   */
  private async createNewEvent(
    eventData: any,
    googleEvent: GoogleCalendarEvent,
    result: SyncResult,
    syncAttendees: boolean
  ): Promise<void> {
    
    // Generar token único para el formulario
    const formToken = await generateUniqueFormToken();
    
    const newEvent = await prisma.event.create({
      data: {
        ...eventData,
        formToken
      }
    });

    console.log(`✅ Evento creado: "${eventData.title}" (${googleEvent.id})`);

    // Sincronizar asistentes si está habilitado
    if (syncAttendees && googleEvent.attendees) {
      await this.syncEventAttendees(newEvent.id, googleEvent.attendees);
    }

    result.created++;
    result.syncedEvents.push({
      id: newEvent.id,
      googleEventId: googleEvent.id,
      title: eventData.title,
      action: 'created'
    });
  }

  /**
   * Actualizar evento existente
   */
  private async updateExistingEvent(
    existingEvent: any,
    eventData: any,
    googleEvent: GoogleCalendarEvent,
    result: SyncResult,
    syncAttendees: boolean
  ): Promise<void> {
    
    // Verificar si hay cambios
    const hasChanges = this.hasEventChanges(existingEvent, eventData);
    
    if (hasChanges) {
      await prisma.event.update({
        where: { id: existingEvent.id },
        data: eventData
      });

      console.log(`🔄 Evento actualizado: "${eventData.title}" (${googleEvent.id})`);

      // Sincronizar asistentes si está habilitado
      if (syncAttendees && googleEvent.attendees) {
        await this.syncEventAttendees(existingEvent.id, googleEvent.attendees);
      }

      result.updated++;
      result.syncedEvents.push({
        id: existingEvent.id,
        googleEventId: googleEvent.id,
        title: eventData.title,
        action: 'updated'
      });
    } else {
      result.syncedEvents.push({
        id: existingEvent.id,
        googleEventId: googleEvent.id,
        title: eventData.title,
        action: 'skipped'
      });
    }
  }

  /**
   * Verificar si hay cambios en el evento
   */
  private hasEventChanges(existingEvent: any, newEventData: any): boolean {
    return (
      existingEvent.title !== newEventData.title ||
      existingEvent.startAt.getTime() !== newEventData.startAt.getTime() ||
      existingEvent.endAt.getTime() !== newEventData.endAt.getTime() ||
      existingEvent.location !== newEventData.location ||
      existingEvent.description !== newEventData.description
    );
  }

  /**
   * Sincronizar asistentes del evento
   */
  private async syncEventAttendees(
    eventId: string,
    googleAttendees: Array<{
      email: string;
      displayName?: string;
      responseStatus?: string;
    }>
  ): Promise<void> {
    
    try {
      // Filtrar solo asistentes válidos (excluir recursos como salas)
      const validAttendees = googleAttendees.filter(attendee => 
        attendee.email && 
        !attendee.email.includes('@resource.calendar.google.com') &&
        !attendee.email.includes('@group.calendar.google.com')
      );

      if (validAttendees.length === 0) {
        return;
      }

      // Eliminar asistentes existentes para reemplazarlos
      await prisma.invitee.deleteMany({
        where: { eventId }
      });

      // Crear nuevos asistentes
      const inviteesToCreate = validAttendees.map((attendee, index) => {
        // Usar email como cédula por ahora (se puede mejorar)
        const cedula = this.extractCedulaFromEmail(attendee.email) || `EMAIL_${index + 1}`;
        
        return {
          id: `${eventId}_${attendee.email}`,
          eventId,
          cedula,
          nombre: attendee.displayName || this.extractNameFromEmail(attendee.email),
          email: attendee.email,
          cargo: null,
          institucion: this.extractInstitutionFromEmail(attendee.email),
          sexo: null,
          telefono: null
        };
      });

      if (inviteesToCreate.length > 0) {
        await prisma.invitee.createMany({
          data: inviteesToCreate
        });

        console.log(`👥 Sincronizados ${inviteesToCreate.length} asistentes para evento ${eventId}`);
      }

    } catch (error: any) {
      console.error(`❌ Error sincronizando asistentes del evento ${eventId}:`, error.message);
    }
  }

  /**
   * Extraer cédula del email (lógica personalizable)
   */
  private extractCedulaFromEmail(email: string): string | null {
    // Por ahora, usar el email como identificador único
    // Se puede implementar lógica más sofisticada aquí
    return email.replace('@', '_').replace('.', '_');
  }

  /**
   * Extraer nombre del email
   */
  private extractNameFromEmail(email: string): string {
    const username = email.split('@')[0];
    return username
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  /**
   * Extraer institución del email
   */
  private extractInstitutionFromEmail(email: string): string | null {
    const domain = email.split('@')[1];
    if (domain?.includes('inapa.gob.do')) {
      return 'INAPA';
    }
    return domain || null;
  }

  /**
   * Eliminar eventos que ya no existen en Google
   */
  private async deleteRemovedEvents(
    googleEvents: any[],
    existingEventMap: Map<string, any>,
    result: SyncResult
  ): Promise<void> {
    
    const googleEventIds = new Set(googleEvents.map(event => event.id));
    
    const existingEventIds = Array.from(existingEventMap.keys());
    for (const googleEventId of existingEventIds) {
      const localEvent = existingEventMap.get(googleEventId);
      if (!googleEventIds.has(googleEventId) && localEvent) {
        // Marcar como inactivo en lugar de eliminar completamente
        await prisma.event.update({
          where: { id: localEvent.id },
          data: { status: 'cancelled' }
        });

        result.deleted++;
        result.syncedEvents.push({
          id: localEvent.id,
          googleEventId,
          title: localEvent.title,
          action: 'deleted'
        });

        console.log(`🗑️ Evento eliminado (no existe en Google): "${localEvent.title}"`);
      }
    }
  }

  /**
   * Obtener estadísticas de sincronización
   */
  async getSyncStats(): Promise<{
    totalEvents: number;
    googleEvents: number;
    localOnlyEvents: number;
    lastSync: Date | null;
  }> {
    
    const totalEvents = await prisma.event.count();
    const googleEvents = await prisma.event.count({
      where: {
        googleEventId: { not: '' }
      }
    });
    
    const lastSyncRecord = await prisma.calendarAuth.findFirst({
      where: { isValid: true },
      orderBy: { lastSyncAt: 'desc' },
      select: { lastSyncAt: true }
    });

    return {
      totalEvents,
      googleEvents,
      localOnlyEvents: totalEvents - googleEvents,
      lastSync: lastSyncRecord?.lastSyncAt || null
    };
  }

  /**
   * Sincronización manual de un evento específico por su Google Event ID
   */
  async syncSpecificEvent(
    calendarEmail: string,
    googleEventId: string,
    organizerId: number = 1
  ): Promise<{ success: boolean; action: string; event?: any; error?: string }> {
    
    try {
      // Obtener el evento específico de Google
      const calendars = await googleOAuthService.getUserCalendars(calendarEmail);
      
      for (const calendar of calendars) {
        try {
          const events = await googleOAuthService.getCalendarEvents(
            calendarEmail,
            calendar.id,
            new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 año atrás
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)   // 1 año adelante
          );

          const googleEvent = events.find(event => event.id === googleEventId);
          
          if (googleEvent) {
            const existingEvent = await prisma.event.findUnique({
              where: { googleEventId }
            });

            const eventData = this.prepareEventData(googleEvent as GoogleCalendarEvent, organizerId);

            if (existingEvent) {
              // Actualizar
              const updatedEvent = await prisma.event.update({
                where: { id: existingEvent.id },
                data: eventData
              });

              return {
                success: true,
                action: 'updated',
                event: updatedEvent
              };
            } else {
              // Crear
              const formToken = await generateUniqueFormToken();
              const newEvent = await prisma.event.create({
                data: { ...eventData, formToken }
              });

              return {
                success: true,
                action: 'created',
                event: newEvent
              };
            }
          }
        } catch (error) {
          // Continuar con el siguiente calendario
          continue;
        }
      }

      return {
        success: false,
        action: 'not_found',
        error: `Evento ${googleEventId} no encontrado en ningún calendario`
      };

    } catch (error: any) {
      return {
        success: false,
        action: 'error',
        error: error.message
      };
    }
  }
}

export const calendarSyncService = new CalendarSyncService();
