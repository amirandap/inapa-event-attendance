// /app/api/TestEmail/route.js
import { googleCalendarService } from '@/lib/google/calendar';
import { NextResponse } from 'next/server';
import { smtpService } from '@/lib/email/smtpService';

export async function POST(request) {
  // Aquí puedes acceder al cuerpo de la solicitud
  // const data = await request.json(); 
  
  // Datos para el correo (puedes pasarlos desde el cuerpo de la solicitud)
  const emailOptions = {
    to: 'correo.destino@ejemplo.com', // ⚠️ CAMBIA ESTO por el correo del destinatario
    subject: 'Prueba de envío de email con Nodemailer',
    body: '<h1>Hola, este es un correo de prueba enviado con Nodemailer.</h1><p>Funciona sin necesidad de la API de Google Cloud.</p>',
  };

  try {
    await smtpService.sendEmail(emailOptions.to, emailOptions.subject, emailOptions.body);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Correo enviado con éxito usando SMTP.' 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al enviar el correo vía SMTP.' 
    }, { status: 500 });
  }
}