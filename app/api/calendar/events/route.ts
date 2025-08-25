import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthService } from '@/lib/auth/google-oauth';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');
    const calendarId = url.searchParams.get('calendarId') || 'primary';
    const timeMin = url.searchParams.get('timeMin');
    const timeMax = url.searchParams.get('timeMax');
    const maxResults = parseInt(url.searchParams.get('maxResults') || '250');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'userEmail es requerido' },
        { status: 400 }
      );
    }

    const events = await googleOAuthService.getCalendarEvents(
      userEmail,
      calendarId,
      timeMin ? new Date(timeMin) : undefined,
      timeMax ? new Date(timeMax) : undefined,
      maxResults
    );

    return NextResponse.json({
      success: true,
      events,
      total: events.length,
      calendarId
    });

  } catch (error: any) {
    console.error('Error obteniendo eventos:', error);
    
    if (error.message.includes('Usuario no autorizado')) {
      return NextResponse.json(
        { error: 'Usuario debe autorizar acceso al calendario', needsAuth: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      userEmail,
      calendarId = 'primary',
      summary,
      description,
      location,
      start,
      end,
      attendees
    } = await request.json();

    if (!userEmail || !summary || !start || !end) {
      return NextResponse.json(
        { error: 'Campos requeridos: userEmail, summary, start, end' },
        { status: 400 }
      );
    }

    const event = await googleOAuthService.createCalendarEvent(
      userEmail,
      calendarId,
      {
        summary,
        description,
        location,
        start: new Date(start),
        end: new Date(end),
        attendees
      }
    );

    return NextResponse.json({
      success: true,
      event,
      message: 'Evento creado exitosamente'
    });

  } catch (error: any) {
    console.error('Error creando evento:', error);
    
    if (error.message.includes('Usuario no autorizado')) {
      return NextResponse.json(
        { error: 'Usuario debe autorizar acceso al calendario', needsAuth: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const {
      userEmail,
      calendarId = 'primary',
      eventId,
      summary,
      description,
      location,
      start,
      end,
      attendees
    } = await request.json();

    if (!userEmail || !eventId) {
      return NextResponse.json(
        { error: 'Campos requeridos: userEmail, eventId' },
        { status: 400 }
      );
    }

    const eventData: any = {};
    if (summary) eventData.summary = summary;
    if (description) eventData.description = description;
    if (location) eventData.location = location;
    if (start) eventData.start = new Date(start);
    if (end) eventData.end = new Date(end);
    if (attendees) eventData.attendees = attendees;

    const event = await googleOAuthService.updateCalendarEvent(
      userEmail,
      calendarId,
      eventId,
      eventData
    );

    return NextResponse.json({
      success: true,
      event,
      message: 'Evento actualizado exitosamente'
    });

  } catch (error: any) {
    console.error('Error actualizando evento:', error);
    
    if (error.message.includes('Usuario no autorizado')) {
      return NextResponse.json(
        { error: 'Usuario debe autorizar acceso al calendario', needsAuth: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');
    const calendarId = url.searchParams.get('calendarId') || 'primary';
    const eventId = url.searchParams.get('eventId');

    if (!userEmail || !eventId) {
      return NextResponse.json(
        { error: 'Campos requeridos: userEmail, eventId' },
        { status: 400 }
      );
    }

    await googleOAuthService.deleteCalendarEvent(userEmail, calendarId, eventId);

    return NextResponse.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    });

  } catch (error: any) {
    console.error('Error eliminando evento:', error);
    
    if (error.message.includes('Usuario no autorizado')) {
      return NextResponse.json(
        { error: 'Usuario debe autorizar acceso al calendario', needsAuth: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
