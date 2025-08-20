import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  handleCors,
  getRequestBody,
  noContentResponse
} from '@/lib/api/responses'
import { 
  updateEventSchema
} from '@/lib/api/validations'
import { z } from 'zod'

// Schema para validar ID
const idSchema = z.string().uuid('ID debe ser un UUID válido')

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Validar ID
    const idResult = idSchema.safeParse(params.id)
    if (!idResult.success) {
      return errorResponse('INVALID_INPUT', 'ID de evento inválido', 400)
    }

    const eventId = idResult.data

    // Obtener el evento
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        invitees: {
          select: {
            id: true,
            email: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        checkins: {
          select: {
            id: true,
            cedula: true,
            nombre: true,
            cargo: true,
            institucion: true,
            correo: true,
            sexo: true,
            telefono: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        emailJobs: {
          select: {
            id: true,
            kind: true,
            status: true,
            scheduledAt: true,
            sentAt: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            invitees: true,
            checkins: true,
            emailJobs: true
          }
        }
      }
    })

    if (!event) {
      return errorResponse('NOT_FOUND', 'Evento no encontrado', 404)
    }

    return successResponse(event, 'Evento obtenido exitosamente')

  } catch (error) {
    console.error('Error en GET /api/events/[id]:', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Validar ID
    const idResult = idSchema.safeParse(params.id)
    if (!idResult.success) {
      return errorResponse('INVALID_INPUT', 'ID de evento inválido', 400)
    }

    const eventId = idResult.data
    const body = await getRequestBody(request)

    // Validar datos de actualización
    const validationResult = updateEventSchema.safeParse(body)
    if (!validationResult.success) {
      return errorResponse('VALIDATION_ERROR', 'Datos de evento inválidos', 400)
    }

    const updateData = validationResult.data

    // Verificar que el evento existe
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!existingEvent) {
      return errorResponse('NOT_FOUND', 'Evento no encontrado', 404)
    }

    // Si se especifica un organizador, verificar que existe
    if (updateData.organizerId) {
      const organizer = await prisma.organizer.findUnique({
        where: { id: updateData.organizerId }
      })

      if (!organizer) {
        return errorResponse('NOT_FOUND', 'Organizador no encontrado', 404)
      }
    }

    // Actualizar el evento
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...updateData,
        startAt: updateData.startAt ? new Date(updateData.startAt) : undefined,
        endAt: updateData.endAt ? new Date(updateData.endAt) : undefined,
      },
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        _count: {
          select: {
            invitees: true,
            checkins: true,
            emailJobs: true
          }
        }
      }
    })

    return successResponse(updatedEvent, 'Evento actualizado exitosamente')

  } catch (error) {
    console.error('Error en PUT /api/events/[id]:', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Validar ID
    const idResult = idSchema.safeParse(params.id)
    if (!idResult.success) {
      return errorResponse('INVALID_INPUT', 'ID de evento inválido', 400)
    }

    const eventId = idResult.data

    // Verificar que el evento existe
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            invitees: true,
            checkins: true,
            emailJobs: true
          }
        }
      }
    })

    if (!existingEvent) {
      return errorResponse('NOT_FOUND', 'Evento no encontrado', 404)
    }

    // Eliminar el evento y todos sus datos relacionados en una transacción
    await prisma.$transaction(async (tx) => {
      // Eliminar checkins
      await tx.checkin.deleteMany({
        where: { eventId }
      })

      // Eliminar jobs de email
      await tx.emailJob.deleteMany({
        where: { eventId }
      })

      // Eliminar invitados
      await tx.invitee.deleteMany({
        where: { eventId }
      })

      // Finalmente eliminar el evento
      await tx.event.delete({
        where: { id: eventId }
      })
    })

    return noContentResponse()

  } catch (error) {
    console.error('Error en DELETE /api/events/[id]:', error)
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}
