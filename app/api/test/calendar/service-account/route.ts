import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const authError = requireAuth(request);
    
    // Verificar si el usuario está autenticado
    if (authError) {
      return authError;
    }
    
    // Intentar autenticar con Google usando las credenciales de servicio
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          type: "service_account",
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          client_id: process.env.GOOGLE_CLIENT_ID,
        },
        scopes: ['https://www.googleapis.com/auth/calendar.readonly']
      });
      
      // Intentar autenticar y listar calendarios
      const calendar = google.calendar({ version: 'v3', auth });
      const response = await calendar.calendarList.list({
        maxResults: 10
      });
      
      // Contar calendarios accesibles
      const calendarsCount = response.data.items?.length || 0;
      
      // Verificar acceso al calendario específico
      let calendarAccess = false;
      const calendarId = process.env.GOOGLE_CALENDAR_ID;
      
      if (calendarId) {
        try {
          const calendarInfo = await calendar.calendars.get({
            calendarId
          });
          
          calendarAccess = !!calendarInfo.data.id;
        } catch (error) {
          calendarAccess = false;
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Conexión exitosa con Google Calendar API',
        data: {
          calendarsCount,
          calendarAccess,
          targetCalendarId: calendarId
        }
      });
      
    } catch (error) {
      console.error('Error conectando con Google Calendar:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se pudo conectar con Google Calendar API',
          details: error.message || 'Error desconocido'
        },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error interno:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
