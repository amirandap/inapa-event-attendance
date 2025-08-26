import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

interface CalendarAuth {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  lastSyncAt?: Date | null;
}

interface EventData {
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  attendees?: string[];
}

interface AuthStatus {
  isAuthorized: boolean;
  email?: string;
  expiresAt?: Date;
  calendars?: number;
  lastSync?: Date;
}

export class GoogleOAuthCalendarService {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
    );
  }

  /**
   * Generar URL de autorización para el usuario
   */
  generateAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Forzar refresh token
      scope: scopes,
      state: userId, // Para identificar al usuario después
      include_granted_scopes: true
    });
  }

  /**
   * Intercambiar código por tokens
   */
  async exchangeCodeForTokens(code: string, userId: string): Promise<CalendarAuth> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      // Obtener info del usuario
      this.oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data: userInfo } = await oauth2.userinfo.get();

      // Calcular expiración
      const expiresAt = new Date();
      if (tokens.expiry_date) {
        expiresAt.setTime(tokens.expiry_date);
      } else {
        // Default: 1 hora desde ahora
        expiresAt.setHours(expiresAt.getHours() + 1);
      }

      // Verificar que tenemos refresh token
      if (!tokens.refresh_token) {
        throw new Error('No se recibió refresh token. Asegúrate de incluir prompt=consent en la URL de autorización.');
      }

      const authData: CalendarAuth = {
        userId,
        email: userInfo.email!,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiresAt
      };

      // Guardar en base de datos
      await this.saveCalendarAuth(authData);

      console.log(`✅ Usuario autorizado: ${userInfo.email}`);
      return authData;
    } catch (error: any) {
      console.error('Error intercambiando código:', error);
      throw new Error(`Error intercambiando código: ${error.message}`);
    }
  }

  /**
   * Obtener calendarios del usuario autenticado
   */
  async getUserCalendars(userEmail: string): Promise<any[]> {
    const auth = await this.getValidAuth(userEmail);
    if (!auth) throw new Error('Usuario no autorizado');

    this.oauth2Client.setCredentials({
      access_token: auth.accessToken,
      refresh_token: auth.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    try {
      const response = await calendar.calendarList.list();
      const calendars = response.data.items || [];
      
      console.log(`📅 ${calendars.length} calendarios encontrados para ${userEmail}`);
      return calendars;
    } catch (error: any) {
      if (error.code === 401) {
        // Token expirado, intentar refresh
        await this.refreshUserTokens(userEmail);
        return this.getUserCalendars(userEmail); // Retry
      }
      throw error;
    }
  }

  /**
   * Obtener eventos de calendario específico
   */
  async getCalendarEvents(
    userEmail: string, 
    calendarId: string = 'primary',
    timeMin?: Date,
    timeMax?: Date,
    maxResults: number = 250
  ): Promise<any[]> {
    const auth = await this.getValidAuth(userEmail);
    if (!auth) throw new Error('Usuario no autorizado');

    this.oauth2Client.setCredentials({
      access_token: auth.accessToken,
      refresh_token: auth.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    try {
      const response = await calendar.events.list({
        calendarId,
        timeMin: timeMin?.toISOString(),
        timeMax: timeMax?.toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items || [];
      console.log(`📋 ${events.length} eventos obtenidos de ${calendarId} para ${userEmail}`);
      
      return events;
    } catch (error: any) {
      if (error.code === 401) {
        await this.refreshUserTokens(userEmail);
        return this.getCalendarEvents(userEmail, calendarId, timeMin, timeMax, maxResults);
      }
      throw error;
    }
  }

  /**
   * Crear evento en calendario del usuario
   */
  async createCalendarEvent(
    userEmail: string,
    calendarId: string,
    eventData: EventData
  ): Promise<any> {
    const auth = await this.getValidAuth(userEmail);
    if (!auth) throw new Error('Usuario no autorizado');

    this.oauth2Client.setCredentials({
      access_token: auth.accessToken,
      refresh_token: auth.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const event = {
      summary: eventData.summary,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.start.toISOString(),
        timeZone: 'America/Santo_Domingo'
      },
      end: {
        dateTime: eventData.end.toISOString(),
        timeZone: 'America/Santo_Domingo'
      },
      attendees: eventData.attendees?.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    try {
      const response = await calendar.events.insert({
        calendarId,
        requestBody: event,
        conferenceDataVersion: 1
      });

      console.log(`✅ Evento creado: ${event.summary} en ${calendarId}`);
      return response.data;
    } catch (error: any) {
      if (error.code === 401) {
        await this.refreshUserTokens(userEmail);
        return this.createCalendarEvent(userEmail, calendarId, eventData);
      }
      throw error;
    }
  }

  /**
   * Actualizar evento existente
   */
  async updateCalendarEvent(
    userEmail: string,
    calendarId: string,
    eventId: string,
    eventData: Partial<EventData>
  ): Promise<any> {
    const auth = await this.getValidAuth(userEmail);
    if (!auth) throw new Error('Usuario no autorizado');

    this.oauth2Client.setCredentials({
      access_token: auth.accessToken,
      refresh_token: auth.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const updateData: any = {};
    
    if (eventData.summary) updateData.summary = eventData.summary;
    if (eventData.description) updateData.description = eventData.description;
    if (eventData.location) updateData.location = eventData.location;
    
    if (eventData.start) {
      updateData.start = {
        dateTime: eventData.start.toISOString(),
        timeZone: 'America/Santo_Domingo'
      };
    }
    
    if (eventData.end) {
      updateData.end = {
        dateTime: eventData.end.toISOString(),
        timeZone: 'America/Santo_Domingo'
      };
    }
    
    if (eventData.attendees) {
      updateData.attendees = eventData.attendees.map(email => ({ email }));
    }

    try {
      const response = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: updateData
      });

      console.log(`✅ Evento actualizado: ${eventId} en ${calendarId}`);
      return response.data;
    } catch (error: any) {
      if (error.code === 401) {
        await this.refreshUserTokens(userEmail);
        return this.updateCalendarEvent(userEmail, calendarId, eventId, eventData);
      }
      throw error;
    }
  }

  /**
   * Eliminar evento
   */
  async deleteCalendarEvent(
    userEmail: string,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    const auth = await this.getValidAuth(userEmail);
    if (!auth) throw new Error('Usuario no autorizado');

    this.oauth2Client.setCredentials({
      access_token: auth.accessToken,
      refresh_token: auth.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    try {
      await calendar.events.delete({
        calendarId,
        eventId
      });

      console.log(`🗑️ Evento eliminado: ${eventId} de ${calendarId}`);
    } catch (error: any) {
      if (error.code === 401) {
        await this.refreshUserTokens(userEmail);
        return this.deleteCalendarEvent(userEmail, calendarId, eventId);
      }
      throw error;
    }
  }

  /**
   * Refrescar tokens del usuario
   */
  private async refreshUserTokens(userEmail: string): Promise<void> {
    const auth = await prisma.calendarAuth.findUnique({
      where: { email: userEmail }
    });

    if (!auth || !auth.refreshToken) {
      throw new Error('No se puede refrescar el token. Usuario debe reautorizar.');
    }

    this.oauth2Client.setCredentials({
      refresh_token: auth.refreshToken
    });

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (credentials.expiry_date || 3600));

      await prisma.calendarAuth.update({
        where: { email: userEmail },
        data: {
          accessToken: credentials.access_token!,
          expiresAt,
          updatedAt: new Date()
        }
      });

      console.log(`🔄 Tokens refrescados para ${userEmail}`);
    } catch (error: any) {
      // Token refresh falló, marcar como inválido
      await prisma.calendarAuth.update({
        where: { email: userEmail },
        data: { isValid: false }
      });
      
      console.error(`❌ Token refresh falló para ${userEmail}:`, error.message);
      throw new Error('Token refresh falló. Usuario debe reautorizar.');
    }
  }

  /**
   * Obtener autenticación válida (con refresh automático)
   */
  private async getValidAuth(userEmail: string): Promise<CalendarAuth | null> {
    const auth = await prisma.calendarAuth.findUnique({
      where: { email: userEmail, isValid: true }
    });

    if (!auth) return null;

    // Verificar si el token está por expirar (refresh 5 min antes)
    const fiveMinutesFromNow = new Date();
    fiveMinutesFromNow.setMinutes(fiveMinutesFromNow.getMinutes() + 5);

    if (auth.expiresAt <= fiveMinutesFromNow) {
      await this.refreshUserTokens(userEmail);
      // Obtener el token actualizado
      return await prisma.calendarAuth.findUnique({
        where: { email: userEmail, isValid: true }
      });
    }

    return auth;
  }

  /**
   * Guardar autorización en base de datos
   */
  private async saveCalendarAuth(authData: CalendarAuth): Promise<void> {
    await prisma.calendarAuth.upsert({
      where: { email: authData.email },
      update: {
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        expiresAt: authData.expiresAt,
        isValid: true,
        updatedAt: new Date(),
        lastSyncAt: new Date()
      },
      create: {
        userId: authData.userId,
        email: authData.email,
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        expiresAt: authData.expiresAt,
        isValid: true,
        provider: 'google',
        scopes: 'calendar.readonly,calendar.events,userinfo.email,userinfo.profile',
        lastSyncAt: new Date()
      }
    });
  }

  /**
   * Revocar autorización del usuario
   */
  async revokeAccess(userEmail: string): Promise<void> {
    const auth = await prisma.calendarAuth.findUnique({
      where: { email: userEmail }
    });

    if (auth) {
      // Revocar en Google
      try {
        this.oauth2Client.setCredentials({
          access_token: auth.accessToken
        });
        await this.oauth2Client.revokeToken(auth.accessToken);
        console.log(`🔐 Acceso revocado en Google para ${userEmail}`);
      } catch (error: any) {
        console.warn('Error revocando token en Google:', error.message);
      }

      // Marcar como inválido en DB
      await prisma.calendarAuth.update({
        where: { email: userEmail },
        data: { 
          isValid: false,
          updatedAt: new Date()
        }
      });

      console.log(`✅ Acceso revocado localmente para ${userEmail}`);
    }
  }

  /**
   * Obtener estado de autorización
   */
  async getAuthStatus(userEmail: string): Promise<AuthStatus> {
    const auth = await this.getValidAuth(userEmail);
    
    if (!auth) {
      return { isAuthorized: false };
    }

    try {
      const calendars = await this.getUserCalendars(userEmail);
      return {
        isAuthorized: true,
        email: auth.email,
        expiresAt: auth.expiresAt,
        calendars: calendars.length,
        lastSync: auth.lastSyncAt || undefined
      };
    } catch (error: any) {
      console.error(`Error verificando estado para ${userEmail}:`, error.message);
      return { isAuthorized: false };
    }
  }

  /**
   * Obtener todos los usuarios autorizados
   */
  async getAuthorizedUsers(): Promise<CalendarAuth[]> {
    return await prisma.calendarAuth.findMany({
      where: { isValid: true },
      orderBy: { updatedAt: 'desc' }
    });
  }

  /**
   * Buscar calendario por nombre o ID
   */
  async findCalendar(userEmail: string, searchTerm: string): Promise<any | null> {
    const calendars = await this.getUserCalendars(userEmail);
    
    // Buscar por ID exacto primero
    let calendar = calendars.find(cal => cal.id === searchTerm);
    
    // Si no se encuentra, buscar por nombre (case insensitive)
    if (!calendar) {
      calendar = calendars.find(cal => 
        cal.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return calendar || null;
  }

  /**
   * Sincronizar eventos desde Google Calendar a base de datos local
   */
  async syncCalendarEvents(
    userEmail: string, 
    calendarId: string,
    syncDays: number = 30
  ): Promise<{ synced: number; errors: string[] }> {
    try {
      const timeMin = new Date();
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + syncDays);

      const events = await this.getCalendarEvents(userEmail, calendarId, timeMin, timeMax);
      const errors: string[] = [];
      let synced = 0;

      for (const googleEvent of events) {
        try {
          // Convertir evento de Google a formato local
          await this.syncSingleEvent(googleEvent, calendarId, userEmail);
          synced++;
        } catch (error: any) {
          errors.push(`Error sincronizando evento ${googleEvent.id}: ${error.message}`);
        }
      }

      // Actualizar timestamp de última sincronización
      await prisma.calendarAuth.update({
        where: { email: userEmail },
        data: { lastSyncAt: new Date() }
      });

      console.log(`🔄 Sincronización completa: ${synced} eventos, ${errors.length} errores`);
      return { synced, errors };
    } catch (error: any) {
      throw new Error(`Error en sincronización: ${error.message}`);
    }
  }

  /**
   * Sincronizar un evento individual
   */
  private async syncSingleEvent(googleEvent: any, calendarId: string, userEmail: string): Promise<void> {
    // Aquí puedes implementar la lógica para guardar el evento en tu base de datos local
    // Por ejemplo, crear/actualizar en la tabla Events
    
    const eventData = {
      googleEventId: googleEvent.id,
      title: googleEvent.summary || 'Sin título',
      description: googleEvent.description || '',
      location: googleEvent.location || '',
      startAt: new Date(googleEvent.start?.dateTime || googleEvent.start?.date),
      endAt: new Date(googleEvent.end?.dateTime || googleEvent.end?.date),
      calendarId,
      ownerEmail: userEmail,
      status: googleEvent.status || 'confirmed'
    };

    // Ejemplo de upsert (ajustar según tu esquema)
    /*
    await prisma.event.upsert({
      where: { googleEventId: googleEvent.id },
      update: eventData,
      create: {
        ...eventData,
        formToken: crypto.randomUUID(),
        organizerId: 1 // Ajustar según tu lógica
      }
    });
    */
  }
}

export const googleOAuthService = new GoogleOAuthCalendarService();
