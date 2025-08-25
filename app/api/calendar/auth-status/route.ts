import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthService } from '@/lib/auth/google-oauth';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'userEmail es requerido' },
        { status: 400 }
      );
    }

    const status = await googleOAuthService.getAuthStatus(userEmail);

    return NextResponse.json({
      success: true,
      status
    });

  } catch (error: any) {
    console.error('Error obteniendo estado de auth:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'userEmail es requerido' },
        { status: 400 }
      );
    }

    await googleOAuthService.revokeAccess(userEmail);

    return NextResponse.json({
      success: true,
      message: 'Acceso revocado exitosamente'
    });

  } catch (error: any) {
    console.error('Error revocando acceso:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
