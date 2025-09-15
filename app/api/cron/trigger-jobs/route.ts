import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reportsService } from '@/lib/services/reports';
import { smtpService } from '@/lib/email/smtpService';
import { EmailJobKind } from '@/lib/jobs/email-scheduler';
import { generateInitialPDF } from '@/lib/pdf/generator';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const pendingJobs = await prisma.emailJob.findMany({
      where: {
        status: 'pending',
        scheduledAt: { lte: now },
      },
      include: {
        event: {
          include: {
            organizer: true,
          },
        },
      },
      take: 20,
    });

    if (pendingJobs.length === 0) {
      return NextResponse.json({ message: 'No hay tareas pendientes para ejecutar.' });
    }

    console.log(`🚀 Encontradas ${pendingJobs.length} tareas pendientes para ejecutar.`);
    let executedJobs = 0;

    for (const job of pendingJobs) {
      try {
        const { event, kind } = job;
        if (!event || !event.organizer) {
          throw new Error(`Evento u organizador no encontrado para la tarea ID: ${job.id}`);
        }
        const recipientEmail = event.organizer.email;

        await prisma.emailJob.update({
          where: { id: job.id },
          data: { status: 'processing' },
        });

        // 2. MODIFICAR EL SWITCH PARA ADJUNTAR ARCHIVOS
        switch (kind) {
          case EmailJobKind.PRE_EVENT_REMINDER:
            // Generar el PDF inicial con el QR
            const pdfBuffer = await generateInitialPDF(event.id);
            const pdfFilename = `Hoja-QR-${event.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;

            await smtpService.sendEmail(
              [recipientEmail],
              `Recordatorio: El evento "${event.title}" comienza pronto`,
              `<p>Hola ${event.organizer.name || ''},</p>
               <p>Te recordamos que el evento <strong>${event.title}</strong> está programado para comenzar en aproximadamente una hora.</p>
               <p>Adjunto encontrarás la <strong>hoja de registro con el código QR</strong> para que los asistentes puedan registrarse fácilmente a su llegada.</p>`,
              [
                {
                  filename: pdfFilename,
                  content: pdfBuffer,
                  contentType: 'application/pdf',
                },
              ]
            );
            break;

          case EmailJobKind.POST_EVENT_REPORT:
            // El servicio de reportes ahora se encarga de adjuntar ambos archivos (PDF y Excel)
            await reportsService.sendAttendanceReport(event.id, [recipientEmail]);
            break;
        }

        await prisma.emailJob.update({
          where: { id: job.id },
          data: { status: 'completed', sentAt: new Date() },
        });
        executedJobs++;
      } catch (error: any) {
        await prisma.emailJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            errorMsg: error.message,
            retryCount: { increment: 1 },
          },
        });
        console.error(`❌ Error procesando job ID ${job.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Ejecución finalizada. Tareas procesadas: ${executedJobs}.`,
    });
  } catch (error) {
    console.error('❌ Error general en el endpoint de ejecución de tareas:', error);
    return NextResponse.json({ error: 'Error Interno del Servidor' }, { status: 500 });
  }
}

