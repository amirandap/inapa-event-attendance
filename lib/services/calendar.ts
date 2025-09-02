import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { GoogleCalendarEvent } from '@/lib/types/calendar';
import { generateUniqueFormToken } from '@/lib/utils/form-tokens';

class CalendarService {
  private auth: any;
  private calendarId: string;

  constructor() {
    // ... (Lógica de autenticación con Google)
    try {
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      if (!privateKey || !process.env.GOOGLE_CLIENT_EMAIL) {
        throw new Error('Credenciales de Service Account de Google no están definidas.');
      }
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/calendar.events.readonly'],
      });
      this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    } catch (error) {
        console.error("Fallo al inicializar Google Auth en CalendarService", error);
    }
  }

  /**
   * FUNCIÓN PRINCIPAL PARA EL WEBHOOK
   * Sincroniza un único evento. Busca si existe, y si no, lo crea.
   */
  async syncSingleEventById(googleEventId: string): Promise<void> {
    // 1. Obtener los datos más recientes del evento desde la API de Google
    const googleEvent = await this.getEventDetails(googleEventId);

    if (!googleEvent) {
      // Si el evento ya no se encuentra en Google, lo tratamos como una cancelación.
      await this.cancelEventByGoogleId(googleEventId);
      return;
    }

    // 2. Buscar si ya tenemos este evento en nuestra base de datos
    const localEvent = await prisma.event.findUnique({
      where: { googleEventId },
    });

    const eventData = {
        title: googleEvent.summary || 'Sin Título',
        description: googleEvent.description,
        location: googleEvent.location,
        startAt: new Date(googleEvent.start.dateTime || googleEvent.start.date!),
        endAt: new Date(googleEvent.end.dateTime || googleEvent.end.date!),
        status: googleEvent.status === 'cancelled' ? 'cancelled' : 'active',
    };

    if (localEvent) {
      // 3. Si existe, lo ACTUALIZAMOS en Prisma
      await prisma.event.update({
        where: { id: localEvent.id },
        data: eventData,
      });
      console.log(`🔄 Evento actualizado en Prisma: "${eventData.title}"`);
    } else {
      // 4. Si no existe, lo CREAMOS en Prisma
      await prisma.event.create({
        data: {
          ...eventData,
          googleEventId: googleEvent.id,
          formToken: await generateUniqueFormToken(), // Asignamos un token para el formulario
          organizer: { connect: { email: 'minutas@inapa.gob.do' } }, // Conectamos a un organizador por defecto
        },
      });
      console.log(`✨ Evento nuevo creado en Prisma: "${eventData.title}"`);
    }
    
    // Aquí también se sincronizarían los asistentes (invitees)
  }

  /**
   * Marca un evento como cancelado en la base de datos de Prisma.
   */
  async cancelEventByGoogleId(googleEventId: string): Promise<void> {
    const localEvent = await prisma.event.findUnique({
      where: { googleEventId },
    });

    // Solo actualizamos si existe y no está ya cancelado
    if (localEvent && localEvent.status !== 'cancelled') {
      await prisma.event.update({
        where: { id: localEvent.id },
        data: { status: 'cancelled' },
      });
      console.log(`🗑️  Evento marcado como cancelado en Prisma: "${localEvent.title}"`);
    }
  }

  /**
   * Obtiene los detalles de un evento desde la API de Google.
   */
  private async getEventDetails(googleEventId: string): Promise<GoogleCalendarEvent | null> {
    // ... (Lógica para llamar a la API de google.calendar.events.get)
    try {
        const client = await this.auth.getClient();
        const calendar = google.calendar({ version: 'v3', auth: client });
        const response = await calendar.events.get({
            calendarId: this.calendarId,
            eventId: googleEventId,
        });
        return response.data as GoogleCalendarEvent;
    } catch (error: any) {
        if (error.code === 404) {
            return null; // El evento no existe en Google, no es un error.
        }
        throw error; // Otro tipo de error sí debe ser reportado.
    }
  }

  /**
   * Extrae el ID del evento desde la URL que envía Google.
   */
  extractEventIdFromUri(resourceUri?: string | null): string | null {
    if (!resourceUri) return null;
    try {
      return new URL(resourceUri).pathname.split('/').pop() || null;
    } catch {
      return null;
    }
  }
}

export const calendarService = new CalendarService();

