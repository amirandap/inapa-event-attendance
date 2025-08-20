import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAttendanceShortUrl } from '@/lib/utils/shortUrl'

export async function POST(request: NextRequest) {
  try {
    // Obtener todos los eventos
    const events = await prisma.event.findMany({
      select: {
        id: true,
        formToken: true,
        title: true
      }
    })

    // Obtener eventos que ya tienen URL corta (temporal hasta que se actualice Prisma)
    // const existingShortUrls = await prisma.shortUrl.findMany({
    //   select: {
    //     eventId: true
    //   }
    // })

    // const eventsWithShortUrls = new Set(existingShortUrls.map(su => su.eventId))
    // const eventsNeedingShortUrls = events.filter(event => !eventsWithShortUrls.has(event.id))
    
    // Por ahora, procesar todos los eventos
    const eventsNeedingShortUrls = events

    const results = []
    const baseUrl = request.nextUrl.origin

    for (const event of eventsNeedingShortUrls) {
      try {
        const { shortCode, shortUrl } = await createAttendanceShortUrl(
          event.id, 
          event.formToken, 
          baseUrl
        )
        
        results.push({
          eventId: event.id,
          title: event.title,
          shortCode,
          shortUrl,
          status: 'created'
        })
      } catch (error) {
        results.push({
          eventId: event.id,
          title: event.title,
          error: error instanceof Error ? error.message : 'Error desconocido',
          status: 'error'
        })
      }
    }

    return NextResponse.json({
      message: `Procesados ${eventsNeedingShortUrls.length} eventos`,
      results,
      summary: {
        total: eventsNeedingShortUrls.length,
        created: results.filter(r => r.status === 'created').length,
        errors: results.filter(r => r.status === 'error').length
      }
    })

  } catch (error) {
    console.error('Error al generar URLs cortas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
