import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthService } from '@/lib/auth/google-oauth';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'userEmail es requerido' },
        { status: 400 }
      );
    }

    const calendars = await googleOAuthService.getUserCalendars(userEmail);

    return NextResponse.json({
      success: true,
      calendars,
      total: calendars.length
    });

  } catch (error: any) {
    console.error('Error obteniendo calendarios:', error);
    
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
