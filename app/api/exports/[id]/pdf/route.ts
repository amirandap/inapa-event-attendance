import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInitialPDF, generateFinalPDF } from '@/lib/pdf/generator';
import { internalServerErrorResponse } from '@/lib/api/responses';

/**
 * GET /api/exports/[eventId]/pdf?type=initial|final
 * Genera y devuelve un archivo PDF para un evento específico.
 * - type=initial: Genera una hoja con el QR del evento para el registro.
 * - type=final: Genera un reporte final completo de asistencia.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // CORRECCIÓN 1: Se accede a params.id directamente para evitar la advertencia de Next.js
  const eventId = params.id;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'final'; // 'final' por defecto

  if (!eventId) {
    return NextResponse.json(
      { error: 'ID de evento no proporcionado' },
      { status: 400 }
    );
  }

  try {
    let pdfBuffer: Buffer;
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Genera el PDF según el tipo solicitado
    if (type === 'initial') {
      pdfBuffer = await generateInitialPDF(eventId);
    } else {
      pdfBuffer = await generateFinalPDF(eventId);
    }

    // Limpia el título del evento para usarlo en el nombre del archivo
    const safeTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${
      type === 'initial' ? 'QR_Asistencia' : 'Reporte_Final'
    }_${safeTitle}.pdf`;

    // Devuelve el buffer del PDF como respuesta
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(`Error generando PDF para el evento ${eventId}:`, error);
    return internalServerErrorResponse(
      'Ocurrió un error al generar el archivo PDF.'
    );
  }
}

