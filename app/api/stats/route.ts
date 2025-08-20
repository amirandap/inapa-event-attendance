import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, internalServerErrorResponse } from '@/lib/api/responses'

interface EventWithCounts {
  id: string
  title: string
  startAt: Date
  status: string
  _count: {
    invitees: number
    checkins: number
  }
}

interface UpcomingEventWithDetails {
  id: string
  title: string
  startAt: Date
  organizer: {
    name: string | null
  }
  _count: {
    invitees: number
    checkins: number
  }
}

interface DailyCheckinResult {
  date: string
  count: bigint
}

interface InstitutionStatsResult {
  institution: string
  count: bigint
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // días

    const daysAgo = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // Obtener estadísticas generales
    const [
      totalEvents,
      activeEvents,
      totalCheckins,
      totalInvitees,
      recentCheckins,
      eventStats
    ] = await Promise.all([
      // Total de eventos
      prisma.event.count(),
      
      // Eventos activos
      prisma.event.count({
        where: { status: 'active' }
      }),
      
      // Total de check-ins
      prisma.checkin.count(),
      
      // Total de invitados
      prisma.invitee.count(),
      
      // Check-ins recientes
      prisma.checkin.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Estadísticas por evento
      prisma.event.findMany({
        select: {
          id: true,
          title: true,
          startAt: true,
          status: true,
          _count: {
            select: {
              invitees: true,
              checkins: true
            }
          }
        },
        where: {
          startAt: { gte: startDate }
        },
        orderBy: { startAt: 'desc' },
        take: 10
      })
    ])

    // Calcular tasa de asistencia promedio
    const attendanceRate = totalInvitees > 0 ? Math.round((totalCheckins / totalInvitees) * 100) : 0

    // Obtener check-ins por día en el período especificado
    const dailyCheckins = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM checkins 
      WHERE createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `

    // Obtener distribución por institución
    const institutionStats = await prisma.$queryRaw`
      SELECT 
        COALESCE(institucion, 'Sin especificar') as institution,
        COUNT(*) as count
      FROM checkins 
      WHERE createdAt >= ${startDate}
      GROUP BY institucion
      ORDER BY count DESC
      LIMIT 10
    `

    // Obtener eventos próximos
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startAt: { gt: new Date() },
        status: 'active'
      },
      include: {
        organizer: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            invitees: true,
            checkins: true
          }
        }
      },
      orderBy: { startAt: 'asc' },
      take: 5
    })

    return successResponse({
      overview: {
        totalEvents: Number(totalEvents),
        activeEvents: Number(activeEvents),
        totalCheckins: Number(totalCheckins),
        totalInvitees: Number(totalInvitees),
        recentCheckins: Number(recentCheckins),
        attendanceRate
      },
      charts: {
        dailyCheckins: (dailyCheckins as DailyCheckinResult[]).map((item: DailyCheckinResult) => ({
          date: item.date,
          count: Number(item.count)
        })),
        institutionStats: (institutionStats as InstitutionStatsResult[]).map((item: InstitutionStatsResult) => ({
          institution: item.institution,
          count: Number(item.count)
        }))
      },
      eventStats: eventStats.map((event: EventWithCounts) => ({
        ...event,
        attendanceRate: event._count.invitees > 0 
          ? Math.round((event._count.checkins / event._count.invitees) * 100) 
          : 0
      })),
      upcomingEvents: upcomingEvents.map((event: UpcomingEventWithDetails) => ({
        id: event.id,
        title: event.title,
        startAt: event.startAt,
        organizer: event.organizer.name,
        invitees: event._count.invitees,
        checkins: event._count.checkins,
        attendanceRate: event._count.invitees > 0 
          ? Math.round((event._count.checkins / event._count.invitees) * 100) 
          : 0
      }))
    })

  } catch (error) {
    console.error('Error fetching stats:', error)
    return internalServerErrorResponse('Error al obtener las estadísticas')
  }
}
