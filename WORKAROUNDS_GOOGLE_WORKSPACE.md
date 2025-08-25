# Workaround: Delegación de Calendario Google Workspace

## 🎯 Problema
El calendario `minutas@inapa.gob.do` en Google Workspace gubernamental no permite:
- ❌ Links iCal secretos
- ❌ Acceso directo de API sin delegación
- ❌ Permisos de aplicación externa

## ✅ Solución 1: Delegación de Calendario

### Paso 1: Configurar Delegación
```bash
# En Google Workspace Admin Console
1. Ir a "Aplicaciones" > "Google Workspace" > "Calendar"
2. Buscar "Delegación de calendario"
3. Agregar delega_calendar@inapa.gob.do como delegado de minutas@inapa.gob.do
```

### Paso 2: Crear Cuenta de Servicio Delegada
```javascript
// lib/google/calendar-delegate.ts
import { google } from 'googleapis';

class DelegatedCalendarService {
  private auth: any;
  
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_DELEGATE_EMAIL,
        private_key: process.env.GOOGLE_DELEGATE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      // Delegar autoridad a minutas@inapa.gob.do
      subject: 'minutas@inapa.gob.do'
    });
  }
  
  async getEvents() {
    const calendar = google.calendar({ version: 'v3', auth: this.auth });
    
    const response = await calendar.events.list({
      calendarId: 'minutas@inapa.gob.do',
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    return response.data.items;
  }
}
```

## ✅ Solución 2: OAuth 2.0 con Refresh Token

### Implementación OAuth Manual
```javascript
// lib/google/oauth-calendar.ts
import { google } from 'googleapis';

class OAuthCalendarService {
  private oauth2Client: any;
  
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    // Token permanente (refresh token)
    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
  }
  
  async getEvents() {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    return await calendar.events.list({
      calendarId: 'minutas@inapa.gob.do',
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });
  }
}
```

## ✅ Solución 3: Proxy Calendar

### Crear Calendario Proxy
```javascript
// Crear calendario secundario que sincronice con minutas@inapa.gob.do
class CalendarProxyService {
  async syncToProxy() {
    // 1. Obtener eventos de minutas@inapa.gob.do (manualmente o con permisos)
    // 2. Copiar a calendario proxy público
    // 3. Generar iCal desde calendario proxy
    
    const proxyCalendar = 'minutas-proxy@inapa.gob.do';
    
    // Sync manual o automatizado cada X minutos
    await this.copyEventsToProxy(originalEvents, proxyCalendar);
  }
}
```

## ✅ Solución 4: Manual Data Entry + Webhook

### Sistema Híbrido
```javascript
// Sistema donde INAPA ingresa eventos manualmente
// pero se sincroniza automáticamente
class HybridCalendarService {
  // 1. Interface web para crear eventos
  // 2. Auto-sync con Google Calendar cuando sea posible
  // 3. Fallback a base de datos local
  
  async createEvent(eventData) {
    try {
      // Intentar crear en Google Calendar
      await this.createInGoogleCalendar(eventData);
    } catch (error) {
      // Fallback: guardar solo en DB
      await this.saveToDatabase(eventData);
    }
  }
}
```

## ✅ Solución 5: Scheduled Sync Job

### Sincronización Programada
```javascript
// Cron job que sincroniza periódicamente
import cron from 'node-cron';

class ScheduledSyncService {
  constructor() {
    // Cada 15 minutos
    cron.schedule('*/15 * * * *', () => {
      this.syncCalendarEvents();
    });
  }
  
  async syncCalendarEvents() {
    try {
      // Intentar obtener eventos de Google
      const events = await this.fetchFromGoogle();
      await this.updateLocalDatabase(events);
    } catch (error) {
      // Log error pero continuar con datos locales
      console.warn('Google Calendar sync failed, using local data');
    }
  }
}
```

---

## 🎯 Recomendación Principal

**Opción 1 (Delegación) + Opción 5 (Sync Job)** es la combinación más robusta:

1. **Setup inicial**: Configurar delegación en Google Workspace
2. **Sync automático**: Job cada 15 minutos para obtener eventos
3. **Fallback**: Base de datos local siempre disponible
4. **Interface**: UI para crear/editar eventos cuando Google falle

¿Cuál de estas opciones te parece más viable para tu organización?
