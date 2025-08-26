# INSTRUCCIONES 07: Mejoras en la Sincronización con Google Calendar

## Contexto
Actualmente, la sincronización con Google Calendar se realiza de manera básica cuando se solicitan eventos. Es necesario implementar un sistema más robusto que garantice la consistencia de los datos y mejor manejo de errores.

## Cambios en Base de Datos

### 1. Actualizar Schema de Prisma
```prisma
model Event {
  // ... campos existentes ...
  
  // Nuevos campos para control de sincronización
  googleICalUID    String?    @unique  // ID único global de iCal
  recurringEventId String?    // ID del evento recurrente padre
  etag            String?     // ETag de Google Calendar para detectar cambios
  lastSyncAt      DateTime?   // Última sincronización exitosa
  sourceCreatedAt DateTime?   // Fecha de creación en Google Calendar
  sourceUpdatedAt DateTime?   // Última actualización en Google Calendar
  sequence        Int        @default(0)  // Número de versión del evento
  meetingId       String?    // ID de Google Meet si existe
  conferenceData  Json?      // Datos de la conferencia virtual
  source          String     @default("manual")  // google_calendar, ical, manual
  syncStatus      String     @default("pending_sync") // synced, pending_sync, sync_failed, local_only
  syncError       String?    // Mensaje de error de sincronización
  syncRetries     Int       @default(0) // Número de intentos de sincronización
}
```

### 2. Aplicar Migración
```bash
npx prisma migrate dev --name add_sync_fields
```

## Sistema de Jobs Programados

### 1. Configurar QStash
- Instalar dependencias:
  ```bash
  npm install @upstash/qstash
  ```
- Configurar variables de entorno:
  ```env
  QSTASH_CURRENT_SIGNING_KEY=tu_key_aqui
  QSTASH_NEXT_SIGNING_KEY=tu_next_key_aqui
  QSTASH_URL=https://qstash.upstash.io/v2/publish
  ```

### 2. Implementar Jobs de Sincronización
1. Crear endpoint `/api/jobs/sync-calendar`
2. Implementar tres niveles de sincronización:
   - **Incremental (cada hora)**:
     - Solo eventos actualizados
     - Ventana de tiempo: próximas 2 semanas
   - **Completa (diaria)**:
     - Todos los eventos
     - Ventana de tiempo: próximos 3 meses
   - **Limpieza (semanal)**:
     - Verificación de consistencia
     - Eliminación de eventos obsoletos
     - Reintento de eventos fallidos

## Mejoras en la Lógica de Sincronización

### 1. Identificación de Eventos
- Usar múltiples identificadores:
  - `googleEventId`
  - `googleICalUID`
  - `recurringEventId`
- Implementar sistema de versiones con `sequence` y `etag`

### 2. Procesamiento en Lotes
```typescript
// Ejemplo de implementación
const batchSize = 50;
for (let i = 0; i < events.length; i += batchSize) {
  const batch = events.slice(i, i + batchSize);
  await processEventBatch(batch);
}
```

### 3. Sistema de Reintentos
- Implementar lógica exponencial de reintentos
- Máximo 3 intentos por evento
- Marcar como `sync_failed` después de los intentos

## Sistema de Monitoreo

### 1. Panel de Estado
Crear endpoint `/api/admin/sync-status` que retorne:
- Última sincronización exitosa
- Eventos pendientes de sincronizar
- Eventos con errores
- Estado general del sistema

### 2. Logs y Auditoría
Registrar en `AuditLog`:
- Intentos de sincronización
- Errores específicos
- Cambios de estado

## Optimizaciones de Rendimiento

### 1. Índices de Base de Datos
```sql
-- Agregar índices para mejor rendimiento
CREATE INDEX idx_events_sync_status ON events(sync_status);
CREATE INDEX idx_events_last_sync ON events(last_sync_at);
CREATE INDEX idx_events_source_updated ON events(source_updated_at);
```

### 2. Caché de Respuestas
- Implementar caché de eventos frecuentes
- TTL de 5 minutos para eventos próximos
- Invalidar caché en actualizaciones

## Pasos de Implementación Recomendados

1. Realizar backup de la base de datos
2. Aplicar cambios en el schema de Prisma
3. Implementar nuevos tipos y enums
4. Actualizar HybridCalendarService
5. Configurar jobs programados
6. Implementar sistema de monitoreo
7. Realizar pruebas de carga
8. Migrar eventos existentes

## Consideraciones de Seguridad

1. Verificar firmas de QStash en jobs
2. Implementar rate limiting en endpoints
3. Validar permisos en operaciones admin
4. Encriptar datos sensibles de conferencias

## Documentación Necesaria

1. Diagrama de flujo de sincronización
2. Documentación de endpoints nuevos
3. Guía de troubleshooting
4. Procedimientos de recuperación

## Testing

### 1. Pruebas Unitarias
- Sincronización incremental
- Manejo de conflictos
- Sistema de reintentos

### 2. Pruebas de Integración
- Jobs programados
- Sincronización completa
- Monitoreo y alertas

### 3. Pruebas de Carga
- Sincronización de 1000+ eventos
- Concurrencia de actualizaciones
- Comportamiento del caché

## Rollback Plan

1. Backup de la base de datos antes de cambios
2. Scripts de reversión de migraciones
3. Versión anterior del código en standby
4. Procedimiento de restauración documentado

## Métricas a Monitorear

1. Tiempo de sincronización
2. Tasa de éxito/error
3. Uso de recursos
4. Latencia de API

## Siguientes Pasos

1. Revisión del diseño propuesto
2. Estimación de tiempo de implementación
3. Priorización de cambios
4. Planificación de despliegue
