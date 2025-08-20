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
import { createOrganizerSchema } from '@/lib/api/validations'

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
      return errorResponse('INVALID_ID', 'ID de organizador requerido', 400)
    }

    const organizer = await prisma.organizer.findUnique({
      where: { id: parseInt(id) },
      include: {
        events: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
            location: true,
            status: true,
            _count: {
              select: {
                invitees: true,
                checkins: true
              }
            }
          },
          orderBy: {
            startAt: 'desc'
          }
        },
        _count: {
          select: {
            events: true
          }
        }
      }
    })

    if (!organizer) {
      return notFoundResponse('Organizador')
    }

    return successResponse(organizer)
  } catch (error) {
    console.error('Error al obtener organizador:', error)
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
      return errorResponse('INVALID_ID', 'ID de organizador requerido', 400)
    }

    const body = await getRequestBody(request)
    
    // Validar datos del body
    const validationResult = createOrganizerSchema.safeParse(body)
    if (!validationResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Datos inválidos',
        400
      )
    }

    const organizerData = validationResult.data

    // Verificar que el organizador existe
    const existingOrganizer = await prisma.organizer.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingOrganizer) {
      return notFoundResponse('Organizador')
    }

    // Verificar que no existe otro organizador con el mismo email
    if (organizerData.email !== existingOrganizer.email) {
      const duplicateOrganizer = await prisma.organizer.findFirst({
        where: {
          email: organizerData.email,
          id: { not: parseInt(id) }
        }
      })

      if (duplicateOrganizer) {
        return errorResponse('CONFLICT', 'Ya existe un organizador con este email', 409)
      }
    }

    // Actualizar organizador
    const updatedOrganizer = await prisma.organizer.update({
      where: { id: parseInt(id) },
      data: organizerData,
      include: {
        events: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
            location: true,
            status: true,
            _count: {
              select: {
                invitees: true,
                checkins: true
              }
            }
          },
          orderBy: {
            startAt: 'desc'
          }
        },
        _count: {
          select: {
            events: true
          }
        }
      }
    })

    return successResponse(updatedOrganizer, 'Organizador actualizado exitosamente')
  } catch (error) {
    console.error('Error al actualizar organizador:', error)
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
      return errorResponse('INVALID_ID', 'ID de organizador requerido', 400)
    }

    // Verificar que el organizador existe
    const existingOrganizer = await prisma.organizer.findUnique({
      where: { id: parseInt(id) },
      include: {
        events: true
      }
    })

    if (!existingOrganizer) {
      return notFoundResponse('Organizador')
    }

    // No permitir eliminar si tiene eventos asociados
    if (existingOrganizer.events.length > 0) {
      return errorResponse(
        'CONFLICT', 
        'No se puede eliminar un organizador que tiene eventos asociados', 
        409
      )
    }

    // Eliminar organizador
    await prisma.organizer.delete({
      where: { id: parseInt(id) }
    })

    return successResponse(null, 'Organizador eliminado exitosamente')
  } catch (error) {
    console.error('Error al eliminar organizador:', error)
    return internalServerErrorResponse()
  }
}
