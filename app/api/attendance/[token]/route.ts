import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  handleCors,
  getRequestBody
} from '@/lib/api/responses'
import { createCheckinSchema } from '@/lib/api/validations'
import { validateCedula } from '@/lib/utils/validation'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function GET(
  request: NextRequest, 
  { params }: { params: { token: string } }
) {
  try {
    // Obtener el evento por token
    const event = await prisma.event.findUnique({
      where: { formToken: params.token },
      include: {
        organizer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!event) {
      return errorResponse('NOT_FOUND', 'Evento no encontrado', 404)
    }

    // Verificar que el evento está activo
    if (event.status !== 'active') {
      return errorResponse('FORBIDDEN', 'El evento no está disponible para registro', 403)
    }

    // Verificar que el evento no haya terminado
    if (new Date() > event.endAt) {
      return errorResponse('FORBIDDEN', 'El periodo de registro para este evento ha terminado', 403)
    }

    // Devolver información básica del evento (sin datos sensibles)
    return successResponse({
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startAt: event.startAt,
        endAt: event.endAt,
        organizer: event.organizer.name
      }
    }, 'Evento obtenido exitosamente')

  } catch (error) {
    console.error('Error en GET /api/attendance/[token]:', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}

export async function POST(
  request: NextRequest, 
  { params }: { params: { token: string } }
) {
  try {
    const body = await getRequestBody(request)
    
        // Validar datos del body usando el schema público
    const validationResult = createCheckinSchema.safeParse(body)

    if (!validationResult.success) {
      return errorResponse('VALIDATION_ERROR', 'Datos de registro inválidos', 400)
    }

    const checkinData = validationResult.data

    // Validar cédula dominicana
    if (!validateCedula(checkinData.cedula)) {
      return errorResponse('VALIDATION_ERROR', 'Cédula dominicana inválida', 400)
    }

    // Verificar que el evento existe y está activo
    const event = await prisma.event.findUnique({
      where: { formToken: params.token }
    })

    if (!event) {
      return errorResponse('NOT_FOUND', 'Evento no encontrado', 404)
    }

    if (event.status !== 'active') {
      return errorResponse('FORBIDDEN', 'El evento no está disponible para registro', 403)
    }

    // Verificar que el evento no haya terminado
    if (new Date() > event.endAt) {
      return errorResponse('FORBIDDEN', 'El periodo de registro para este evento ha terminado', 403)
    }

    // Verificar si la persona ya está registrada
    const existingCheckin = await prisma.checkin.findUnique({
      where: {
        eventId_cedula: {
          eventId: event.id,
          cedula: checkinData.cedula
        }
      }
    })

    if (existingCheckin) {
      return errorResponse('CONFLICT', 'Esta persona ya está registrada para el evento', 409)
    }

    // Obtener información del cliente para auditoría
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Crear el check-in
    const checkin = await prisma.checkin.create({
      data: {
        eventId: event.id,
        cedula: checkinData.cedula,
        nombre: checkinData.nombre,
        cargo: checkinData.cargo,
        institucion: checkinData.institucion,
        correo: checkinData.correo,
        sexo: checkinData.sexo,
        telefono: checkinData.telefono,
        ipAddress,
        userAgent
      }
    })

    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'checkin_created',
        entityType: 'checkin',
        entityId: checkin.id.toString(),
        details: {
          eventId: event.id,
          eventTitle: event.title,
          participantName: checkinData.nombre,
          participantCedula: checkinData.cedula,
          source: 'public_form'
        },
        ipAddress,
        userAgent
      }
    })

    return successResponse({
      checkin: {
        id: checkin.id,
        nombre: checkin.nombre,
        createdAt: checkin.createdAt
      },
      event: {
        title: event.title,
        location: event.location,
        startAt: event.startAt
      },
      message: 'Registro de asistencia completado exitosamente'
    }, 'Asistencia registrada exitosamente')

  } catch (error) {
    console.error('Error en POST /api/attendance/[token]:', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}
