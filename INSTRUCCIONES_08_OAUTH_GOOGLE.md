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

```env
# Variables OAuth requeridas (reemplaza con tus valores reales)
GOOGLE_CLIENT_ID="tu-client-id-oauth.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-client-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-una-clave-secreta-aleatoria-larga"

# Variables del Service Account (mantener las existentes)
GOOGLE_PROJECT_ID="redar-469611"
GOOGLE_CLIENT_EMAIL="inapa-calendar-service@redar-469611.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
GOOGLE_CALENDAR_ID="minutas@inapa.gob.do"
```

### 6. Generar NEXTAUTH_SECRET
Ejecuta uno de estos comandos para generar una clave secreta:

```bash
# Opción 1: OpenSSL
openssl rand -base64 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Verificación Manual de la Configuración

### 1. Verificar Variables de Entorno
Revisa que todas las variables estén presentes en `.env.local`:
- ✅ `GOOGLE_CLIENT_ID` (debe terminar en .apps.googleusercontent.com)
- ✅ `GOOGLE_CLIENT_SECRET` (cadena alfanumérica)
- ✅ `NEXTAUTH_URL` (URL completa de tu aplicación)
- ✅ `NEXTAUTH_SECRET` (cadena aleatoria larga)

### 2. Reiniciar Servidor
```bash
npm run dev
```

### 3. Probar Autenticación
1. Ve a la página que requiere autenticación Google
2. Haz clic en "Conectar Google Calendar" o "Iniciar sesión con Google"
3. Verifica que te redirige a Google (sin error 400)
4. Completa el flujo de autenticación

## Solución de Problemas Comunes

### Error: "redirect_uri_mismatch"
**Causa**: La URI de redirección no coincide con la configurada en Google Console
**Solución**: 
- Verificar que la URI en Google Console sea exactamente: `http://localhost:3000/api/auth/google/callback`
- No usar trailing slashes
- Incluir protocolo (http/https)

### Error: "invalid_client"
**Causa**: Credenciales OAuth incorrectas
**Solución**:
- Verificar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
- Asegurar que el proyecto esté habilitado en Google Cloud Console

### Error: "access_denied"
**Causa**: Usuario canceló la autorización
**Solución**:
- Manejar este caso en la aplicación con un mensaje amigable
- Verificar que los scopes solicitados sean apropiados

### Error: "unauthorized_client"
**Causa**: OAuth Consent Screen no configurado correctamente
**Solución**:
- Completar toda la información requerida en OAuth Consent Screen
- Verificar que la aplicación esté en modo de testing o publicada

## Configuración para Producción

### 1. Actualizar Variables de Entorno
```env
NEXTAUTH_URL="https://tu-dominio-produccion.com"
```

### 2. Actualizar Google Cloud Console
- Agregar URIs de producción a "Authorized redirect URIs"
- Actualizar información en OAuth Consent Screen
- Verificar dominio si es necesario

### 3. Publicar la Aplicación OAuth
1. En Google Cloud Console, ir a "OAuth consent screen"
2. Cambiar de "Testing" a "In production" cuando esté listo
3. Completar proceso de verificación si es requerido

## Consideraciones de Seguridad

### Para Desarrollo
- Usar `http://localhost:3000` está permitido por Google
- Mantener credenciales en `.env.local` (no commitear)

### Para Producción
- Usar HTTPS obligatorio
- Configurar dominio real verificado
- Rotar credenciales periódicamente
- Implementar rate limiting
- Validar tokens en el servidor

## Testing Manual

### 1. Flujo Completo de Autenticación
- ✅ Redirección a Google exitosa
- ✅ Autorización del usuario
- ✅ Redirección de vuelta a la aplicación
- ✅ Tokens guardados correctamente
- ✅ Acceso a recursos protegidos

### 2. Manejo de Errores
- ✅ Usuario cancela autorización
- ✅ Credenciales inválidas
- ✅ Errores de red
- ✅ Tokens expirados

### 3. Persistencia de Sesión
- ✅ Sesión persiste entre recargas
- ✅ Logout funciona correctamente
- ✅ Auto-renovación de tokens

## Estructura Final de Variables de Entorno

```env
# Base de la aplicación
DATABASE_URL="file:./dev.db"
PORT="3000"
APP_BASE_URL="http://localhost:3000"
JWT_SECRET="tu-jwt-secret"

# OAuth 2.0 para autenticación de usuarios
GOOGLE_CLIENT_ID="123456789-abcdef.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-tu-client-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-nextauth-secret-generado"

# Service Account para operaciones automáticas
GOOGLE_PROJECT_ID="redar-469611"
GOOGLE_CLIENT_EMAIL="inapa-calendar-service@redar-469611.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
GOOGLE_CALENDAR_ID="minutas@inapa.gob.do"

# Email
GMAIL_SENDER="minutas@inapa.gob.do"

# Configuraciones adicionales...
NODE_ENV="development"
```

## Checklist de Verificación

- [ ] OAuth 2.0 Client creado en Google Cloud Console
- [ ] OAuth Consent Screen configurado completamente
- [ ] Scopes necesarios agregados
- [ ] URIs de redirección configurados correctamente
- [ ] Variables de entorno agregadas a `.env.local`
- [ ] `NEXTAUTH_SECRET` generado
- [ ] Servidor reiniciado
- [ ] Flujo de autenticación probado manualmente
- [ ] Manejo de errores verificado
- [ ] Documentación de producción preparada

## Próximos Pasos

1. ✅ Completar configuración en Google Cloud Console
2. ✅ Actualizar variables de entorno con valores reales
3. ✅ Probar flujo de autenticación completo
4. ✅ Verificar manejo de errores
5. ✅ Preparar configuración para producción
6. ✅ Documentar proceso para el equipo
