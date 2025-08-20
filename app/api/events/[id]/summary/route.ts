import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateEventQRData } from '@/lib/qr/generator'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id

    // Obtener evento con organizador
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: true
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    // Obtener invitados
    const invitees = await prisma.invitee.findMany({
      where: { eventId },
      orderBy: { email: 'asc' }
    })

    // Obtener check-ins
    const checkins = await prisma.checkin.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    })

    // Generar datos del QR
    const baseUrl = request.nextUrl.origin
    const qrData = generateEventQRData(eventId, event.formToken, baseUrl)

    // Calcular estadísticas
    const stats = {
      totalInvitees: invitees.length,
      totalCheckins: checkins.length,
      attendanceRate: invitees.length > 0 ? Math.round((checkins.length / invitees.length) * 100) : 0,
      notAttended: invitees.length - checkins.length
    }

    const summaryData = {
      event: {
        ...event,
        organizer: event.organizer
      },
      invitees,
      checkins,
      qrData,
      stats,
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json(summaryData)

  } catch (error) {
    console.error('Error al generar resumen de reunión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
