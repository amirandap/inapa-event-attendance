import { NextRequest, NextResponse } from 'next/server';
import { reportsService } from '@/lib/services/reports';
import { successResponse, internalServerErrorResponse } from '@/lib/api/responses';

export async function POST(request: NextRequest) {
  try {
    const { eventId, recipientEmail } = await request.json();

    if (!eventId || !recipientEmail) {
      return NextResponse.json({ 
        success: false, 
        message: 'Falta eventId o recipientEmail' 
      }, { status: 400 });
    }
    
    // Llamar al servicio de reportes para generar y enviar el email
    await reportsService.sendAttendanceReport(eventId, [recipientEmail]);

    return successResponse({
      message: 'Reporte de asistencia enviado con éxito.',
      eventId,
      recipientEmail
    });
  } catch (error) {
    console.error('Error en la ruta de prueba:', error);
    return internalServerErrorResponse();
  }
}
