import { NextRequest, NextResponse } from 'next/server';
import { googleOAuthService } from '@/lib/auth/google-oauth';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // userId
    const error = url.searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/calendar-auth?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/calendar-auth?error=missing_parameters`
      );
    }

    // Intercambiar código por tokens
    const authData = await googleOAuthService.exchangeCodeForTokens(code, state);

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/calendar-auth?success=true&email=${encodeURIComponent(authData.email)}`
    );

  } catch (error: any) {
    console.error('Error en callback de Google:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/calendar-auth?error=${encodeURIComponent(error.message)}`
    );
  }
}
