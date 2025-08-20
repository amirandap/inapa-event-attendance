import { NextRequest, NextResponse } from 'next/server'
import { getFullUrl } from '@/lib/utils/shortUrl'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const shortCode = params.code

    if (!shortCode || shortCode.length !== 6) {
      return NextResponse.json(
        { error: 'Código inválido' },
        { status: 400 }
      )
    }

    const fullUrl = await getFullUrl(shortCode)

    if (!fullUrl) {
      return NextResponse.json(
        { error: 'Código no encontrado' },
        { status: 404 }
      )
    }

    // Redirigir a la URL completa
    return NextResponse.redirect(fullUrl)

  } catch (error) {
    console.error('Error al procesar URL corta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
