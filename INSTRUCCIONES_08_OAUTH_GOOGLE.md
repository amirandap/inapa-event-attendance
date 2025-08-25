# INSTRUCCIONES: Configuración de Google OAuth 2.0

## Problema Actual
El error `redirect_uri=undefined` indica que la configuración de OAuth 2.0 no está completa. Tienes configurado un Service Account, pero para autenticación de usuarios necesitas también un OAuth 2.0 Client.

## Diferencias entre Service Account y OAuth 2.0

### Service Account (lo que ya tienes)
- Para operaciones servidor-servidor
- No requiere intervención del usuario
- Acceso a recursos específicos del proyecto
- Usado para sincronización automática

### OAuth 2.0 Client (lo que necesitas)
- Para autenticación de usuarios finales
- Requiere consentimiento del usuario
- Acceso a recursos del usuario autenticado
- Usado para que usuarios conecten sus calendarios personales

## Pasos para Configurar OAuth 2.0

### 1. Ir a Google Cloud Console
1. Ve a https://console.cloud.google.com/
2. Selecciona tu proyecto: `redar-469611`
3. Ve a "APIs & Services" > "Credentials"

### 2. Crear OAuth 2.0 Client ID
1. Haz clic en "Create Credentials" > "OAuth 2.0 Client ID"
2. Selecciona "Web application"
3. Configura:
   - **Name**: "INAPA Event Attendance - Web Client"
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/api/auth/google/callback`
     - `http://localhost:8080/api/auth/google/callback` (para testing en otro puerto)

### 3. Configurar OAuth Consent Screen
1. Ve a "OAuth consent screen"
2. Selecciona "External" (si no es una organización Google Workspace)
3. Completa:
   - **App name**: "INAPA - Registro de Asistencia"
   - **User support email**: tu email
   - **Developer contact**: tu email
   - **App domain**: http://localhost:3000 (para desarrollo)

### 4. Agregar Scopes Necesarios
En "OAuth consent screen" > "Scopes", agrega:
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

### 5. Actualizar Variables de Entorno
Después de crear el OAuth Client, actualiza `.env.local`:

```bash
# Google OAuth (reemplaza con tus valores reales)
GOOGLE_CLIENT_ID="tu-client-id-oauth.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

### 6. Crear Endpoint de Callback
Crea el archivo `/app/api/auth/google/callback/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { googleOAuthService } from '@/lib/auth/google-oauth';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId
  const error = searchParams.get('error');

  if (error) {
    return redirect('/dashboard/configuracion?error=oauth_denied');
  }

  if (!code || !state) {
    return redirect('/dashboard/configuracion?error=invalid_callback');
  }

  try {
    await googleOAuthService.exchangeCodeForTokens(code, state);
    return redirect('/dashboard/configuracion?success=calendar_connected');
  } catch (error) {
    console.error('Error en OAuth callback:', error);
    return redirect('/dashboard/configuracion?error=oauth_failed');
  }
}
```

### 7. Actualizar CalendarAuthManager
Modifica el componente para usar las URLs correctas:

```typescript
// En components/calendar/CalendarAuthManager.tsx
const handleConnect = async () => {
  try {
    const authUrl = googleOAuthService.generateAuthUrl(userId);
    window.location.href = authUrl; // Redirigir a Google
  } catch (error) {
    console.error('Error generando URL de auth:', error);
  }
};
```

## Testing

### 1. Verificar Configuración
```bash
# Verificar que las variables estén definidas
npm run dev
# Visita: http://localhost:3000/dashboard/configuracion
```

### 2. Flujo de Autenticación
1. Clic en "Conectar Google Calendar"
2. Redirección a Google OAuth
3. Autorización del usuario
4. Redirección de vuelta a la app
5. Tokens guardados en base de datos

### 3. Posibles Errores y Soluciones

#### Error: "redirect_uri_mismatch"
- Verificar que la URI en Google Console coincida exactamente
- Incluir protocolo (http/https)
- No usar trailing slashes

#### Error: "invalid_client"
- Verificar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET
- Asegurar que el proyecto esté habilitado

#### Error: "access_denied"
- Usuario canceló la autorización
- Manejar en el callback con mensaje amigable

## Notas de Seguridad

### Para Desarrollo
- Usar `http://localhost:3000` está bien
- Google permite localhost para desarrollo

### Para Producción
- Usar HTTPS obligatorio
- Configurar dominio real en redirect URIs
- Verificar OAuth Consent Screen para usuarios externos

## Estructura Final de Variables

```bash
# Service Account (operaciones automáticas)
GOOGLE_PROJECT_ID="redar-469611"
GOOGLE_CLIENT_EMAIL="inapa-calendar-service@redar-469611.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
GOOGLE_CALENDAR_ID="minutas@inapa.gob.do"

# OAuth Client (autenticación de usuarios)
GOOGLE_CLIENT_ID="123456789-abcdef.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

# URLs base
APP_BASE_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

## Siguientes Pasos

1. Completar configuración en Google Cloud Console
2. Actualizar variables de entorno con valores reales
3. Crear endpoint de callback
4. Probar flujo de autenticación
5. Implementar manejo de errores
6. Documentar para producción
