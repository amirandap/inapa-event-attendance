import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { formatDate } from '@/lib/utils/dates';
import { Event, Checkin, Invitee, Organizer } from '@prisma/client';
import QRCode from 'qrcode';

// --- Definir y usar rutas absolutas para las fuentes ---
const fonts = {
  Helvetica: path.join(process.cwd(), 'public', 'fonts', 'Helvetica.ttf'),
  HelveticaBold: path.join(
    process.cwd(),
    'public',
    'fonts',
    'Helvetica-Bold.ttf'
  ),
};

type EventWithRelations = Event & {
  organizer: Organizer;
  checkins: Checkin[];
  invitees: Invitee[];
};

// --- Funciones de Datos ---

/**
 * Carga todos los datos necesarios para un reporte de un evento.
 */
async function getEventDataForReport(
  eventId: string
): Promise<EventWithRelations> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      checkins: { orderBy: { createdAt: 'asc' } },
      invitees: { orderBy: { nombre: 'asc' } },
      organizer: true,
    },
  });

  if (!event) {
    throw new Error('Evento no encontrado');
  }

  return event;
}

// --- Funciones de Dibujo del PDF ---

/**
 * Dibuja el encabezado estándar de INAPA en un documento PDF.
 */
function drawHeader(doc: PDFKit.PDFDocument, title: string) {
  const logoPath = path.join(
    process.cwd(),
    'public',
    'images',
    'inapa-logo.jpeg'
  );
  try {
    if (fs.existsSync(logoPath)) {
      const imageWidth = 120;
      const imageHeight = 120;
      const pageW = doc.page.width;
      const xPosition = (pageW - imageWidth) / 2;
      const yPosition = doc.y;

      doc.image(logoPath, xPosition, yPosition, {
        fit: [imageWidth, imageHeight],
      });

      doc.y = yPosition + imageHeight + 5;
    } else {
      doc.moveDown(2);
    }
  } catch (error) {
    console.warn('No se pudo cargar el logo.');
    doc.moveDown(2);
  }

  doc
    .font(fonts.HelveticaBold)
    .fontSize(22)
    .fillColor('#1e40af')
    .text(title, { align: 'center' });
  doc
    .font(fonts.Helvetica)
    .fontSize(12)
    .fillColor('#64748b')
    .text('Sistema de Registro de Asistencias INAPA', { align: 'center' });
  doc.moveDown(2);
}

/**
 * Dibuja la ficha de información del evento.
 */
function drawEventInfoCard(doc: PDFKit.PDFDocument, event: EventWithRelations) {
  const cardY = doc.y;
  const cardHeight = 160;
  const cardContent = drawCard(doc, 50, cardY, 500, cardHeight);

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#111827')
    .text('Información del Evento', cardContent.x, cardContent.y);
  doc.moveDown(0);

  doc.font(fonts.Helvetica).fontSize(10).fillColor('#4b5563');
  if (event.description) {
    doc.text(event.description, {
      width: cardContent.width,
      align: 'justify',
      lineGap: 2,
    });
    doc.moveDown(1.5);
  }

  const col1X = cardContent.x;
  const col2X = cardContent.x + 250;
  const initialY = doc.y;

  // Columna Izquierda
  doc.font('Helvetica-Bold').text('Fecha y Hora', col1X, initialY);
  doc
    .font(fonts.Helvetica)
    .fontSize(9)
    .fillColor('#64748b')
    .text(`Inicio: ${formatDate(new Date(event.startAt), 'PPPp')}`, {
      lineGap: 2,
    })
    .text(`Fin: ${formatDate(new Date(event.endAt), 'PPPp')}`);

  doc.moveDown(1);

  if (event.location) {
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#111827')
      .text('Ubicación', col1X, doc.y);
    doc
      .font(fonts.Helvetica)
      .fontSize(9)
      .fillColor('#64748b')
      .text(event.location);
  }

  // Columna Derecha
  doc.y = initialY;
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#111827')
    .text('Organizador', col2X, doc.y);
  doc
    .font(fonts.Helvetica)
    .fontSize(9)
    .fillColor('#64748b')
    .text(event.organizer.name || event.organizer.email);

  doc.moveDown(1);

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#111827')
    .text('Estado', col2X, doc.y);
  doc.font(fonts.Helvetica).fontSize(9).fillColor('#64748b').text(event.status);

  doc.x = doc.page.margins.left;
  doc.y = cardY + cardHeight + 5;
}

/**
 * Dibuja el pie de página con el número de página.
 */
function drawFooter(doc: PDFKit.PDFDocument) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(9)
      .fillColor('#64748b')
      .text(
        `Página ${i + 1} de ${
          range.count
        } | Generado el ${formatDate(new Date(), 'PPpp')}`,
        50,
        780,
        { align: 'center' }
      );
  }
}

/**
 * Dibuja una tarjeta con sombra para agrupar contenido.
 */
function drawCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  padding = 20
) {
  doc
    .roundedRect(x, y, width, height, 8)
    .lineWidth(1)
    .strokeColor('#e5e7eb')
    .stroke();
  return { x: x + padding, y: y + padding, width: width - padding * 2 };
}

// --- Funciones Principales de Generación de PDF ---

export async function generateInitialPDF(eventId: string): Promise<Buffer> {
  const event = await getEventDataForReport(eventId);

  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    font: fonts.Helvetica,
    layout: 'portrait',
  });
  doc.registerFont('Helvetica-Bold', fonts.HelveticaBold);

  const stream = doc.pipe(require('stream').PassThrough());

  // Página 1: Hoja de QR
  drawHeader(doc, 'Hoja de Registro de Asistencia');
  drawEventInfoCard(doc, event);
  doc.moveDown(2);

  try {
    // SOLUCIÓN: Usar la URL directa con el formToken, que es más robusta.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const directUrl = `${baseUrl}/a/${event.formToken}`;

    const qrBuffer = await QRCode.toBuffer(directUrl, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 1,
      width: 180,
    });

    const qrCodeSize = 180;
    const qrX = (doc.page.width - qrCodeSize) / 2;
    const qrY = doc.y;
    doc.image(qrBuffer, qrX, qrY, {
      fit: [qrCodeSize, qrCodeSize],
    });
    doc.y = qrY + qrCodeSize + 5;

    doc
      .font(fonts.Helvetica)
      .fontSize(9)
      .fillColor('#4b5563')
      .text(directUrl, { align: 'center', link: directUrl });
  } catch (error) {
    console.error('Error al generar el QR para el PDF:', error);
    doc.text('No se pudo generar el código QR.', { align: 'center' });
  }

  doc.moveDown(2);

  // Instrucciones
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#1e40af')
    .text('Instrucciones para Participantes:', {
      align: 'left',
      underline: true,
    })
    .moveDown();
  doc
    .font(fonts.Helvetica)
    .fontSize(11)
    .fillColor('#374151')
    .list(
      [
        'Escanee este código QR con la cámara de su celular.',
        'Complete el formulario con su información personal.',
        'Asegúrese de que su cédula y nombre estén correctos.',
        'Recibirá una confirmación en pantalla al finalizar.',
      ],
      { bulletRadius: 2, textIndent: 15 }
    );

  drawFooter(doc);
  doc.end();

  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = [];
    stream.on('data', (chunk) => buffers.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(buffers)));
    stream.on('error', reject);
  });
}

export async function generateFinalPDF(eventId: string): Promise<Buffer> {
  const event = await getEventDataForReport(eventId);
  const { checkins, invitees } = event;

  const checkinEmails = new Set(checkins.map((c) => c.correo));
  const absentees = invitees.filter(
    (invitee) => invitee.email && !checkinEmails.has(invitee.email)
  );

  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    font: fonts.Helvetica,
    bufferPages: true,
  });
  doc.registerFont('Helvetica-Bold', fonts.HelveticaBold);
  const stream = doc.pipe(require('stream').PassThrough());

  // --- Página 1: Portada y Resumen ---
  drawHeader(doc, 'Reporte Final de Asistencia');
  drawEventInfoCard(doc, event);

  // Tarjeta de Resumen Numérico
  const cardY = doc.y;
  const cardContent = drawCard(doc, 50, cardY, 500, 150);
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor('#1e40af')
    .text('Resumen del Evento', cardContent.x, cardContent.y);
  doc.moveDown();

  const totalInvitees = invitees.length;
  const totalCheckins = checkins.length;
  const attendanceRate =
    totalInvitees > 0
      ? ((totalCheckins / totalInvitees) * 100).toFixed(1)
      : '0.0';

  const statsY = doc.y;
  const lineGap = 18;

  doc.font(fonts.Helvetica).fontSize(12).fillColor('#374151');

  doc
    .text(`• Total de Invitados:`, cardContent.x, statsY)
    .text(`${totalInvitees}`, cardContent.x + 400, statsY, {
      width: 50,
      align: 'right',
    });

  doc
    .text(
      `• Total de Asistentes Registrados:`,
      cardContent.x,
      statsY + lineGap
    )
    .text(`${totalCheckins}`, cardContent.x + 400, statsY + lineGap, {
      width: 50,
      align: 'right',
    });

  doc
    .text(`• Total de Ausentes:`, cardContent.x, statsY + lineGap * 2)
    .text(`${absentees.length}`, cardContent.x + 400, statsY + lineGap * 2, {
      width: 50,
      align: 'right',
    });

  doc.font('Helvetica-Bold');
  doc
    .text(
      `• Tasa de Asistencia:`,
      cardContent.x,
      statsY + lineGap * 3 + 5
    )
    .text(
      `${attendanceRate}%`,
      cardContent.x + 400,
      statsY + lineGap * 3 + 5,
      { width: 50, align: 'right' }
    );

  doc.y = cardY + 160;

  // --- Página 2+: Lista de Asistentes ---
  if (checkins.length > 0) {
    doc.addPage();
    drawHeader(doc, event.title);
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#111827')
      .text('Lista de Asistentes Registrados', { underline: true });
    doc.moveDown();

    const tableTop = doc.y;
    const headers = ['#', 'Nombre', 'Cédula', 'Institución', 'Hora'];

    // Dibujar encabezados de tabla
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(headers[0], 50, tableTop, { width: 30 });
    doc.text(headers[1], 85, tableTop, { width: 150 });
    doc.text(headers[2], 240, tableTop, { width: 90 });
    doc.text(headers[3], 335, tableTop, { width: 140 });
    doc.text(headers[4], 480, tableTop, { width: 70, align: 'right' });
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .strokeColor('#cccccc')
      .stroke();
    doc.y = tableTop + 20;

    // Dibujar filas de la tabla
    doc.font(fonts.Helvetica).fontSize(9);
    checkins.forEach((checkin, i) => {
      if (doc.y > 700) {
        doc.addPage();
        drawHeader(doc, event.title);
        doc.y = 150;
      }
      const y = doc.y;
      doc.text(`${i + 1}`, 50, y, { width: 30 });
      doc.text(checkin.nombre, 85, y, { width: 150 });
      doc.text(checkin.cedula, 240, y, { width: 90 });
      doc.text(checkin.institucion || 'N/A', 335, y, { width: 140 });
      doc.text(formatDate(new Date(checkin.createdAt), 'p'), 480, y, {
        width: 70,
        align: 'right',
      });
      doc.y += 25;
    });
  }

  // --- Página final: Lista de Ausentes ---
  if (absentees.length > 0) {
    doc.addPage();
    drawHeader(doc, event.title);
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#111827')
      .text('Lista de Invitados Ausentes', { underline: true });
    doc.moveDown();

    const absenteeTableTop = doc.y;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('#', 50, absenteeTableTop, { width: 30 });
    doc.text('Nombre', 85, absenteeTableTop, { width: 200 });
    doc.text('Correo Electrónico', 290, absenteeTableTop, { width: 250 });
    doc
      .moveTo(50, absenteeTableTop + 15)
      .lineTo(550, absenteeTableTop + 15)
      .stroke();
    doc.y = absenteeTableTop + 20;

    doc.font(fonts.Helvetica).fontSize(9);
    absentees.forEach((invitee, i) => {
      if (doc.y > 700) {
        doc.addPage();
        drawHeader(doc, event.title);
        doc.y = 150;
      }
      const y = doc.y;
      doc.text(`${i + 1}`, 50, y, { width: 30 });
      doc.text(invitee.nombre, 85, y, { width: 200 });
      doc.text(invitee.email, 290, y, { width: 250 });
      doc.y += 25;
    });
  }

  drawFooter(doc);
  doc.end();

  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = [];
    stream.on('data', (chunk) => buffers.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(buffers)));
    stream.on('error', reject);
  });
}

