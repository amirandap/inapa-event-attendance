import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  successResponse, 
  errorResponse, 
  handleCors,
  getRequestBody,
  notFoundResponse,
  internalServerErrorResponse
} from '@/lib/api/responses'
import { createInviteeSchema } from '@/lib/api/validations'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const id = params.id
    if (!id) {
      return errorResponse('INVALID_ID', 'ID de invitado requerido', 400)
    }

    const invitee = await prisma.invitee.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
            location: true,
            status: true
          }
        },
        checkins: {
          select: {
            id: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!invitee) {
      return notFoundResponse('Invitado')
    }

    // Agregar información de asistencia
    const inviteeWithStatus = {
      ...invitee,
      hasAttended: invitee.checkins.length > 0,
      attendedAt: invitee.checkins[0]?.createdAt || null
    }

    return successResponse(inviteeWithStatus)

  } catch (error) {
    console.error('Error al obtener invitado:', error)
    return internalServerErrorResponse()
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const id = params.id
    if (!id) {
      return errorResponse('INVALID_ID', 'ID de invitado requerido', 400)
    }

    const body = await getRequestBody(request)

    // Verificar que el invitado existe
    const existingInvitee = await prisma.invitee.findUnique({
      where: { id }
    })

    if (!existingInvitee) {
      return notFoundResponse('Invitado')
    }

    // Validar datos (sin eventId para actualización)
    const updateData = { ...body }
    delete updateData.eventId // No permitir cambiar el evento

    const validation = createInviteeSchema.omit({ eventId: true }).safeParse(updateData)
    if (!validation.success) {
      return errorResponse('VALIDATION_ERROR', 'Datos del invitado inválidos', 400)
    }

    const data = validation.data

    // Verificar que no exista otro invitado con la misma cédula en el mismo evento
    if (data.cedula && data.cedula !== existingInvitee.cedula) {
      const duplicateInvitee = await prisma.invitee.findFirst({
        where: {
          cedula: data.cedula,
          eventId: existingInvitee.eventId,
          id: { not: id }
        }
      })

      if (duplicateInvitee) {
        return errorResponse('CONFLICT', 'Ya existe otro invitado con esta cédula para este evento', 409)
      }
    }

    // Actualizar el invitado
    const invitee = await prisma.invitee.update({
      where: { id },
      data,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
            location: true,
            status: true
          }
        },
        checkins: {
          select: {
            id: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return successResponse(invitee, 'Invitado actualizado exitosamente')

  } catch (error) {
    console.error('Error al actualizar invitado:', error)
    return internalServerErrorResponse()
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const id = params.id
    if (!id) {
      return errorResponse('INVALID_ID', 'ID de invitado requerido', 400)
    }

    // Verificar que el invitado existe
    const existingInvitee = await prisma.invitee.findUnique({
      where: { id },
      include: {
        checkins: true
      }
    })

    if (!existingInvitee) {
      return notFoundResponse('Invitado')
    }

    // No permitir eliminar si ya se registró la asistencia
    if (existingInvitee.checkins.length > 0) {
      return errorResponse('CONFLICT', 'No se puede eliminar un invitado que ya registró su asistencia', 409)
    }

    // Eliminar el invitado
    await prisma.invitee.delete({
      where: { id }
    })

    return successResponse(null, 'Invitado eliminado exitosamente')

  } catch (error) {
    console.error('Error al eliminar invitado:', error)
    return internalServerErrorResponse()
  }
}
