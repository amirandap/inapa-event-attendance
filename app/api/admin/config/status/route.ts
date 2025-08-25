import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const configStatus = {
      oauth: {
        clientId: !!process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('TU_CLIENT_ID'),
        clientSecret: !!process.env.GOOGLE_CLIENT_SECRET && !process.env.GOOGLE_CLIENT_SECRET.includes('TU_CLIENT_SECRET'),
        redirectUri: !!process.env.GOOGLE_REDIRECT_URI,
        nextAuthUrl: !!process.env.NEXTAUTH_URL,
        nextAuthSecret: !!process.env.NEXTAUTH_SECRET
      },
      serviceAccount: {
        projectId: !!process.env.GOOGLE_PROJECT_ID,
        clientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
        privateKey: !!process.env.GOOGLE_PRIVATE_KEY,
        calendarId: !!process.env.GOOGLE_CALENDAR_ID
      },
      application: {
        port: process.env.PORT || '3000',
        baseUrl: process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
        nodeEnv: process.env.NODE_ENV || 'development'
      }
    };

    const isOAuthReady = Object.values(configStatus.oauth).every(Boolean);
    const isServiceAccountReady = Object.values(configStatus.serviceAccount).every(Boolean);

    return NextResponse.json({
      status: 'success',
      data: {
        ...configStatus,
        summary: {
          oauthReady: isOAuthReady,
          serviceAccountReady: isServiceAccountReady,
          overallReady: isOAuthReady && isServiceAccountReady
        }
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      {
        status: 'error',
        error: 'Error verificando configuración',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
