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
      return errorResponse('INVALID_ID', 'ID de check-in requerido', 400)
    }

    const checkin = await prisma.checkin.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            location: true,
            startAt: true,
            endAt: true
          }
        }
      }
    })

    if (!checkin) {
      return notFoundResponse('Check-in')
    }

    return successResponse(checkin)
  } catch (error) {
    console.error('Error al obtener check-in:', error)
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
      return errorResponse('INVALID_ID', 'ID de check-in requerido', 400)
    }

    const body = await getRequestBody(request)
    
    // Para actualización, solo permitimos actualizar ciertos campos
    const updateData: { 
      nombre?: string
      cargo?: string 
      institucion?: string
      correo?: string
      sexo?: string
      telefono?: string
    } = {}
    
    if (body.nombre !== undefined) updateData.nombre = body.nombre
    if (body.cargo !== undefined) updateData.cargo = body.cargo
    if (body.institucion !== undefined) updateData.institucion = body.institucion
    if (body.correo !== undefined) updateData.correo = body.correo
    if (body.sexo !== undefined) updateData.sexo = body.sexo
    if (body.telefono !== undefined) updateData.telefono = body.telefono

    // Verificar que el check-in existe
    const existingCheckin = await prisma.checkin.findUnique({
      where: { id }
    })

    if (!existingCheckin) {
      return notFoundResponse('Check-in')
    }

    // Actualizar check-in
    const updatedCheckin = await prisma.checkin.update({
      where: { id },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            location: true,
            startAt: true,
            endAt: true
          }
        }
      }
    })

    return successResponse(updatedCheckin, 'Check-in actualizado exitosamente')
  } catch (error) {
    console.error('Error al actualizar check-in:', error)
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
      return errorResponse('INVALID_ID', 'ID de check-in requerido', 400)
    }

    // Verificar que el check-in existe
    const existingCheckin = await prisma.checkin.findUnique({
      where: { id }
    })

    if (!existingCheckin) {
      return notFoundResponse('Check-in')
    }

    // Eliminar check-in
    await prisma.checkin.delete({
      where: { id }
    })

    return successResponse(null, 'Check-in eliminado exitosamente')
  } catch (error) {
    console.error('Error al eliminar check-in:', error)
    return internalServerErrorResponse()
  }
}
