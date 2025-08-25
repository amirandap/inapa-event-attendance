import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthService } from '@/lib/auth/google-oauth';

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail } = await request.json();

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'userId y userEmail son requeridos' },
        { status: 400 }
      );
    }

    // Generar URL de autorización
    const authUrl = googleOAuthService.generateAuthUrl(userId);

    return NextResponse.json({
      success: true,
      authUrl,
      message: 'Redirige al usuario a esta URL para autorizar acceso al calendario'
    });

  } catch (error: any) {
    console.error('Error generando URL de autorización:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
