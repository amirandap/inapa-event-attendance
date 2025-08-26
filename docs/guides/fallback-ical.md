# Documentación: Fallback iCal para Google Calendar

## 📋 Resumen

Implementación de un sistema de fallback robusto que permite obtener eventos de Google Calendar a través de dos métodos:

1. **Método Principal**: Google Calendar API (requiere credenciales de servicio)
2. **Método Fallback**: iCal URL secreta (funciona sin autenticación especial)

## 🚀 Características

### ✅ **Fallback Automático**
- Si la API de Google Calendar falla, automáticamente cambia a iCal
- Transparente para el usuario final
- Logging detallado para troubleshooting

### ✅ **Validación Dual**
- Endpoint para verificar conectividad de ambos métodos
- Reportes de estado detallados
- Identificación proactiva de problemas

### ✅ **Compatibilidad Completa**
- Mismo formato de respuesta para ambos métodos
- Mapeo automático de campos iCal a formato Google
- Soporte para todos los campos principales

## 🛠️ Configuración

### 1. Dependencias

```bash
# Solo necesitamos ical.js para leer el iCal privado
npm install ical.js
```

**¿Por qué ical.js?**
- ✅ **Mantenida por Mozilla** - Estable y confiable  
- ✅ **Actualizada recientemente** (v2.2.1 - Agosto 2025)
- ✅ **TypeScript nativo** con tipos incluidos
- ✅ **Sin dependencias** - más segura y liviana
- ✅ **12.9k proyectos** la usan (incluyendo Nextcloud)
- ✅ **Soporte completo RFC** - iCalendar, jCal, vCard, jCard

### 2. Variables de Entorno

```bash
# Método principal (Google Calendar API)
GOOGLE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
GOOGLE_PROJECT_ID="tu-project-id"
GOOGLE_CALENDAR_ID="calendar-id@group.calendar.google.com"
```

### 2. Obtener URL iCal Secreta

1. Ir a [Google Calendar](https://calendar.google.com)
2. Seleccionar el calendario → **Configuración**
3. Ir a **"Integrar calendario"**
4. Copiar la **"Dirección secreta en formato iCal"**
5. Configurar en el código (ya está hardcodeado por seguridad)

## 📁 Archivos Modificados

### `lib/google/calendar.ts`
```typescript
- ✅ Importa ical.js (Mozilla) en lugar de node-ical
- ✅ Método listEvents() con fallback automático
- ✅ Método listEventsFromICal() usando ICAL.parse()
- ✅ Transformación moderna con ICAL.Event y ICAL.Component
- ✅ Validación dual de conectividad
- ✅ Logging detallado para troubleshooting
```

### `app/api/test/calendar/route.ts`
```typescript
- ✅ GET: Obtener eventos (con fallback automático)
- ✅ POST: Crear eventos (solo API, fallback no puede crear)
- ✅ PUT: Validar conectividad de ambos métodos
```

### `scripts/test-ical-fallback.js`
```javascript
- ✅ Script independiente usando ical.js moderno
- ✅ Parsing con ICAL.parse() y ICAL.Component
- ✅ Estadísticas detalladas
- ✅ Troubleshooting automatizado
```

## 🔧 **Uso de los Endpoints**

### 1. Obtener Eventos (con Fallback)
```bash
curl -X GET "http://localhost:3000/api/test/calendar"
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event123",
      "summary": "Reunión Importante",
      "start": {
        "dateTime": "2025-08-26T10:00:00.000Z",
        "timeZone": "America/Santo_Domingo"
      },
      "organizer": {
        "email": "organizer@email.com",
        "displayName": "John Doe"
      }
    }
  ],
  "message": "Eventos obtenidos exitosamente"
}
```

### 2. Validar Conectividad
```bash
curl -X PUT "http://localhost:3000/api/test/calendar"
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "validation": {
      "api": true,
      "ical": true,
      "message": "✅ API Google Calendar: Mi Calendario\n✅ iCal Fallback: Conectado correctamente\n🎉 Ambos métodos funcionan correctamente"
    },
    "hasAccess": true
  },
  "message": "Validación de conectividad completada"
}
```

### 3. Crear Eventos
```bash
curl -X POST "http://localhost:3000/api/test/calendar" \
  -H "Content-Type: application/json"
```

## 🐛 **Troubleshooting**

### Problema: API Google Calendar falla
```bash
# Ver logs del servidor
⚠️ Google Calendar API falló, usando fallback iCal: Error...
🔄 Obteniendo eventos desde iCal fallback...
✅ 5 eventos obtenidos desde iCal
```

**Solución**: El sistema automáticamente usa el fallback. Verificar:
1. Variables de entorno de Google API
2. Permisos de la cuenta de servicio
3. Validez del Calendar ID

### Problema: Fallback iCal falla
```bash
# Ver logs del servidor
❌ Error obteniendo eventos desde iCal: Error...
```

**Soluciones**:
1. Verificar que la URL iCal sea correcta
2. Confirmar que el calendario sea accesible
3. Comprobar conexión a internet
4. Regenerar URL iCal en Google Calendar

### Script de Diagnóstico
```bash
# Ejecutar prueba completa
node scripts/test-ical-fallback.js

# Resultados esperados:
✅ Archivo descargado (XXX caracteres)
✅ N eventos encontrados
📊 Estadísticas completas
```

## 📊 **Comportamiento del Sistema**

### Flujo Normal
```
1. App solicita eventos
2. Intenta Google Calendar API
3. ✅ Éxito → Retorna eventos
```

### Flujo con Fallback
```
1. App solicita eventos
2. Intenta Google Calendar API
3. ❌ Falla → Log warning
4. Intenta iCal fallback
5. ✅ Éxito → Retorna eventos
6. Log: "eventos obtenidos desde iCal"
```

### Flujo de Error Total
```
1. App solicita eventos
2. Intenta Google Calendar API → ❌ Falla
3. Intenta iCal fallback → ❌ Falla
4. Retorna error: "No se pudieron obtener eventos"
```

## 🔒 **Consideraciones de Seguridad**

### ✅ **Configuración Segura**
- URL iCal privada hardcodeada (no en env vars)
- Tokens secretos no expuestos en logs
- Validación de permisos mantenida

### ⚠️ **Limitaciones del Fallback**
- **Solo lectura**: iCal no puede crear/modificar eventos
- **Sin tiempo real**: Datos pueden tener delay vs API
- **Campos limitados**: Algunos metadatos pueden no estar disponibles

## 📈 **Monitoreo y Alertas**

### Logs a Monitorear
```bash
# Éxito normal
✅ Eventos obtenidos desde Google Calendar API

# Fallback activado
⚠️ Google Calendar API falló, usando fallback iCal
✅ X eventos obtenidos desde iCal

# Error crítico
❌ No se pudieron obtener eventos ni desde API ni desde iCal
```

### Métricas Recomendadas
- Frecuencia de uso del fallback
- Tiempo de respuesta de cada método
- Rate de errores por método
- Disponibilidad general del servicio

## 🚀 **Próximos Pasos**

1. **Configurar alertas** cuando el fallback se active frecuentemente
2. **Implementar cache** para mejorar performance
3. **Añadir retry logic** con exponential backoff
4. **Métricas en dashboard** para monitoreo en tiempo real
5. **Tests automatizados** para ambos métodos

---

*Documentación actualizada: Agosto 25, 2025*  
*Versión: 1.1.0*  
*Estado: Implementado y funcional*
