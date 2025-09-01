// lib/pdf/generator.ts
import PDFDocument from 'pdfkit';
import { reportsService } from '@/lib/services/reports';

export async function generateEventReport(eventId: string): Promise<Buffer> {
  const doc = new PDFDocument();
  const buffers: Buffer[] = [];

  // Recolectar datos del evento usando el nuevo servicio
  const summary = await reportsService.getEventSummary(eventId);

  // Crear el contenido del PDF
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {
    // La promesa se resolverá aquí, pero solo si es la última función en el evento 'end'
  });

  doc.fontSize(25).text('Reporte de Asistencia', { align: 'center' });
  doc.moveDown();

  doc.fontSize(16).text(`Evento: ${summary.eventName}`);
  doc.text(`Fecha: ${summary.date}`);
  doc.text(`Total de Invitados: ${summary.totalInvitees}`);
  doc.text(`Asistentes: ${summary.totalCheckins}`);

  // Agregar la lista de asistentes
  doc.moveDown();
  doc.fontSize(14).text('Detalles de Asistentes:');
  summary.attendees.forEach(attendee => {
    doc.text(`- ${attendee.name} (${attendee.email}) - Asistencia: ${attendee.checkedIn ? '✅' : '❌'}`);
  });

  doc.end();

  return new Promise<Buffer>((resolve) => {
    doc.on('end', () => {
      const resultBuffer = Buffer.concat(buffers);
      resolve(resultBuffer);
    });
  });
}
