import { prisma } from '@/lib/prisma';
import { addMinutes, subHours, subMinutes } from 'date-fns';

export enum EmailJobKind {
  PRE_EVENT_REMINDER = 'pre_event_reminder',
  POST_EVENT_REPORT = 'post_event_report',
}

class EmailJobScheduler {
  /**
   * Programa todos los correos automáticos para un evento guardándolos en la base de datos.
   */
  async scheduleEventEmails(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      console.error(`No se encontró el evento con ID ${eventId} para programar correos.`);
      return;
    }

    // Para evitar duplicados, eliminamos las tareas pendientes anteriores para este evento
    await prisma.emailJob.deleteMany({
      where: { eventId: eventId, status: 'pending' },
    });

    // 1. Programar recordatorio 1 hora antes del evento
    const preEventReminderTime = subHours(new Date(event.startAt), 1);
    if (preEventReminderTime > new Date()) {
      await prisma.emailJob.create({
        data: {
          eventId: eventId,
          kind: EmailJobKind.PRE_EVENT_REMINDER, // Usando 'kind'
          scheduledAt: preEventReminderTime,
          status: 'pending', // Usando 'status' en minúsculas
        },
      });
      console.log(
        `✅ Job '${
          EmailJobKind.PRE_EVENT_REMINDER
        }' guardado en DB para: ${preEventReminderTime.toISOString()}`
      );
    }

    // 2. Programar reporte final 15 minutos antes de finalizar el evento
    const postEventReportTime = subMinutes(new Date(event.endAt), 15);
    if (postEventReportTime > new Date()) {
      await prisma.emailJob.create({
        data: {
          eventId: eventId,
          kind: EmailJobKind.POST_EVENT_REPORT, // Usando 'kind'
          scheduledAt: postEventReportTime,
          status: 'pending', // Usando 'status' en minúsculas
        },
      });
      console.log(
        `✅ Job '${
          EmailJobKind.POST_EVENT_REPORT
        }' guardado en DB para: ${postEventReportTime.toISOString()}`
      );
    }
  }
}

export const emailJobScheduler = new EmailJobScheduler();

