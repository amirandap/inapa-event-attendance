import { NextRequest, NextResponse } from 'next/server';
import { calendarSyncService } from '@/lib/services/calendar-sync';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      calendarEmail = 'minutas@inapa.gob.do',
      calendarId = 'minutas@inapa.gob.do',
      syncDays = 30,
      organizerId = 1,
      deleteRemovedEvents = false,
      syncAttendees = true
    } = body;

    console.log(`🔄 Iniciando sincronización manual para: ${calendarEmail}`);

    const result = await calendarSyncService.syncCalendarEvents({
      calendarEmail,
      calendarId,
      syncDays,
      organizerId,
      deleteRemovedEvents,
      syncAttendees
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Sincronización completada exitosamente',
        data: {
          totalEvents: result.totalEvents,
          created: result.created,
          updated: result.updated,
          deleted: result.deleted,
          errors: result.errors,
          syncedEvents: result.syncedEvents
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Error durante la sincronización',
        errors: result.errors
      }, { status: 400 });
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ Error en endpoint de sincronización:', errorMessage);
    
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: errorMessage
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const calendarEmail = url.searchParams.get('email') || 'minutas@inapa.gob.do';

    // Obtener estadísticas de sincronización
    const stats = await calendarSyncService.getSyncStats();

    return NextResponse.json({
      success: true,
      data: {
        calendarEmail,
        stats,
        lastSync: stats.lastSync,
        recommendation: stats.lastSync ? 
          'Calendario sincronizado' : 
          'Se recomienda realizar una sincronización inicial'
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ Error obteniendo estadísticas:', errorMessage);
    
    return NextResponse.json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: errorMessage
    }, { status: 500 });
  }
}
