import { prisma } from '@/lib/db'
import { GoogleCalendarEvent, EventWithRelations } from '@/lib/types'

export class DatabaseService {
  // Organizers
  static async upsertOrganizer(email: string, name?: string) {
    return await prisma.organizer.upsert({
      where: { email },
      update: { name },
      create: { email, name }
    })
  }

  // Events
  static async upsertEventFromGoogle(
    googleEvent: GoogleCalendarEvent,
    organizerId: number
  ) {
    const existingEvent = await prisma.event.findUnique({
      where: { googleEventId: googleEvent.id }
    })

    const eventData = {
      title: googleEvent.summary,
      description: googleEvent.description,
      location: googleEvent.location,
      startAt: new Date(googleEvent.start.dateTime),
      endAt: new Date(googleEvent.end.dateTime),
      status: googleEvent.status === 'cancelled' ? 'cancelled' : 'active',
      organizerId
    }

    if (existingEvent) {
      return await prisma.event.update({
        where: { id: existingEvent.id },
        data: eventData
      })
    } else {
      return await prisma.event.create({
        data: {
          ...eventData,
          googleEventId: googleEvent.id,
          formToken: '' // Se actualizará después de generar el token
        }
      })
    }
  }

  // Invitees
  static async upsertInvitees(eventId: string, attendees: GoogleCalendarEvent['attendees']) {
    if (!attendees) return

    // Borrar invitados existentes
    await prisma.invitee.deleteMany({
      where: { eventId }
    })

    // Crear nuevos invitados
    const inviteesToCreate = attendees
      .filter(attendee => !attendee.resource) // Filtrar recursos/salas
      .map(attendee => ({
        eventId,
        email: attendee.email,
        name: attendee.displayName,
        response: attendee.responseStatus,
        isResource: attendee.resource || false
      }))

    if (inviteesToCreate.length > 0) {
      await prisma.invitee.createMany({
        data: inviteesToCreate,
        skipDuplicates: true
      })
    }
  }

  // Checkins
  static async createCheckin(eventId: string, data: Record<string, unknown>, auditData?: Record<string, string>) {
    return await prisma.checkin.create({
      data: {
        eventId,
        ...data,
        ipAddress: auditData?.ipAddress,
        userAgent: auditData?.userAgent
      }
    })
  }

  // Email Jobs
  static async scheduleEmailJob(
    eventId: string,
    kind: string,
    scheduledAt: Date
  ) {
    return await prisma.emailJob.create({
      data: {
        eventId,
        kind,
        scheduledAt
      }
    })
  }

  // Audit Logs
  static async createAuditLog(
    action: string,
    entityType: string,
    entityId?: string,
    details?: Record<string, unknown>,
    auditData?: Record<string, string>
  ) {
    return await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        details,
        ipAddress: auditData?.ipAddress,
        userAgent: auditData?.userAgent
      }
    })
  }

  // Consultas complejas
  static async getEventWithRelations(eventId: string): Promise<EventWithRelations | null> {
    return await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: true,
        invitees: true,
        checkins: true,
        emailJobs: true
      }
    })
  }

  static async getEventByToken(formToken: string) {
    return await prisma.event.findUnique({
      where: { formToken },
      include: {
        organizer: true
      }
    })
  }

  static async getEventsWithCounts(organizerEmail?: string) {
    const whereClause = organizerEmail 
      ? { organizer: { email: organizerEmail } }
      : {}

    return await prisma.event.findMany({
      where: whereClause,
      include: {
        organizer: true,
        _count: {
          select: {
            invitees: true,
            checkins: true
          }
        }
      },
      orderBy: { startAt: 'desc' }
    })
  }
}
