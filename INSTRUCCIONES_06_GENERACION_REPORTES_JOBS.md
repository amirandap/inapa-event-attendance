# INSTRUCCIONES 06: Generación de Reportes, QR y Sistema de Jobs

## Objetivo
Implementar el sistema completo de generación de reportes (PDF/Excel), códigos QR, plantillas de email y el sistema de jobs automáticos para notificaciones programadas.

## Tareas a Ejecutar

### 1. Generación de Códigos QR

#### 1.1 Servicio de QR
**Archivo a crear:** `lib/qr/generate.ts`

**Instrucciones:**
- Instalar dependencia `qrcode` si no está instalada
- Crear clase `QRService` con método `generateQR(url: string)`
- Configurar opciones de QR: tamaño 300x300px, formato PNG, nivel de corrección 'M'
- Retornar el QR como dataURL (base64) para embebido en PDF
- Método adicional `generateQRBuffer()` para obtener Buffer directo
- Incluir logo de INAPA en el centro del QR si es posible
- Manejar errores y validar URLs antes de generar

#### 1.2 Utilidades de QR
**Tareas:**
- Función para validar que la URL del formulario sea válida
- Función para generar URL completa del formulario: `${APP_BASE_URL}/a/${token}`
- Soporte para URLs de desarrollo y producción
- Cache en memoria para QR generados recientemente (evitar regenerar)

### 2. Generación de PDF

#### 2.1 PDF Inicial (con QR)
**Archivo a crear:** `lib/pdf/buildInitial.ts`

**Instrucciones:**
- Usar `@react-pdf/renderer` para crear PDF
- Crear componente React para el PDF inicial que incluya:
  - Header con logo de INAPA
  - Título del evento y detalles (fecha, hora, lugar)
  - Código QR prominente en el centro
  - URL del formulario debajo del QR
  - Instrucciones para el organizador
  - Footer con información de contacto
- Estilo: colores institucionales de INAPA (azul #1e40af)
- Tamaño: carta (letter), orientación portrait
- Método `generateInitialPDF(eventData, qrDataUrl)` que retorne Buffer

#### 2.2 PDF Final (reporte completo)
**Archivo a crear:** `lib/pdf/buildFinal.ts`

**Instrucciones:**
- Crear PDF de reporte completo con múltiples páginas
- Página 1: Resumen ejecutivo
  - Datos del evento
  - Estadísticas generales (total registrados, invitados, porcentaje)
  - Gráfico de barras simple (ASCII art o tabla)
- Página 2+: Lista detallada de registrados
  - Tabla con: Nombre, Cédula, Cargo, Institución, Email, Hora de registro
  - Paginación automática si excede una página
- Página final: Lista de faltantes
  - Tabla con invitados que no se registraron
  - Incluir su estado de respuesta al evento
- Diseño profesional con headers y footers
- Método `generateFinalPDF(reportData)` que retorne Buffer

### 3. Generación de Excel

#### 3.1 Servicio de Excel
**Archivo a crear:** `lib/excel/buildFinal.ts`

**Instrucciones:**
- Usar `exceljs` para crear archivo Excel
- Crear workbook con múltiples hojas:
  
**Hoja 1: "Resumen"**
- Información del evento en las primeras filas
- Tabla de estadísticas con totales
- Celdas formateadas con colores y bordes

**Hoja 2: "Registrados"**
- Tabla completa de todos los registrados
- Columnas: Cédula, Nombre, Cargo, Institución, Email, Sexo, Teléfono, Fecha/Hora Registro
- Formato de tabla con filtros automáticos
- Formato condicional para destacar registros recientes

**Hoja 3: "Faltantes"**
- Lista de invitados que no se registraron
- Columnas: Email, Nombre, Estado de Respuesta
- Usar colores para diferenciar estados (Confirmado, Declinó, Sin respuesta)

**Configuraciones adicionales:**
- Auto-ajustar ancho de columnas
- Proteger hojas contra edición accidental
- Agregar metadatos al archivo (autor, título, descripción)
- Método `generateFinalExcel(reportData)` que retorne Buffer

### 4. Plantillas de Email

#### 4.1 Template Email Inicial
**Archivo a crear:** `lib/email/templates/initial.ts`

**Instrucciones:**
- Usar `react-email` para crear template responsive
- Incluir:
  - Header con logo INAPA
  - Saludo personalizado al organizador
  - Detalles del evento
  - Botón prominente para acceder al formulario
  - Instrucciones sobre el QR adjunto
  - Información de contacto para soporte
- Estilo: colores institucionales, diseño profesional
- Compatible con Outlook, Gmail, Apple Mail
- Función `buildInitialEmailTemplate(eventData, formUrl)`

#### 4.2 Template Email Pre-Cierre
**Archivo a crear:** `lib/email/templates/preClose.ts`

**Instrucciones:**
- Template para email enviado 15 minutos antes del cierre
- Incluir:
  - Recordatorio de que el evento está por terminar
  - Estadísticas actuales (X registrados de Y invitados)
  - Lista de registrados hasta el momento
  - Lista de faltantes (invitados confirmados que no se han registrado)
  - Enlace rápido al formulario por si necesitan registrar a alguien más
- Diseño urgente pero profesional (usar colores naranjas para urgencia)
- Función `buildPreCloseEmailTemplate(reportData)`

#### 4.3 Template Email Final
**Archivo a crear:** `lib/email/templates/final.ts`

**Instrucciones:**
- Template para reporte final completo
- Incluir:
  - Resumen ejecutivo del evento
  - Estadísticas finales con porcentajes
  - Mención de archivos adjuntos (PDF y Excel)
  - Agradecimiento al organizador
  - Próximos pasos o recomendaciones
- Diseño final y celebratorio
- Función `buildFinalEmailTemplate(reportData)`

#### 4.4 Utilidades de Email
**Archivo a crear:** `lib/email/utils.ts`

**Instrucciones:**
- Funciones helper para formateo de fechas en español
- Función para generar estadísticas en formato texto
- Validador de emails
- Función para construir URLs absolutas
- Sanitizador de texto para prevenir inyecciones

### 5. Sistema de Jobs (Upstash QStash)

#### 5.1 Scheduler de Jobs
**Archivo a crear:** `lib/jobs/scheduler.ts`

**Instrucciones:**
- Instalar `@upstash/qstash` si no está instalado
- Crear clase `JobScheduler` con métodos:
  - `schedulePreCloseJob(eventId, scheduledAt)`: programar job 15 min antes del cierre
  - `scheduleFinalJob(eventId, scheduledAt)`: programar job 15 min después del cierre
  - `cancelJobs(eventId)`: cancelar jobs de un evento
  - `rescheduleJobs(eventId, newStartAt, newEndAt)`: reprogramar por cambios en el evento
- Configurar headers de autenticación para QStash
- Manejar errores de programación y logging
- Guardar referencia de jobs en base de datos para tracking

#### 5.2 Manejo de Jobs
**Instrucciones adicionales:**
- Implementar reintentos automáticos en caso de falla (máximo 3 intentos)
- Logging detallado de ejecución de jobs
- Verificación de que el evento sigue activo antes de enviar emails
- Manejo de timezone (República Dominicana - UTC-4)
- Cleanup de jobs completados (eliminar después de 30 días)

### 6. Alternativa: Sistema de Jobs con BullMQ

#### 6.1 Worker Node Separado (Opción B)
**Para implementar si no se usa QStash:**

**Instrucciones:**
- Crear servicio separado con `BullMQ` y `Redis`
- Configurar worker que escuche colas: `pre-close-jobs` y `final-jobs`
- Implementar la misma lógica de envío de emails que los endpoints de QStash
- Configurar retry automático y dead letter queue
- Monitoreo de salud del worker
- Deploy independiente del worker (Railway, Cloud Run, etc.)

### 7. Validaciones y Reglas de Negocio

#### 7.1 Validaciones de Reporte
**Instrucciones:**
- Validar que el evento existe antes de generar reportes
- Verificar permisos del organizador para exportar
- Filtrar recursos/salas de la lista de faltantes
- Calcular porcentajes con redondeo correcto
- Manejar eventos sin invitados o sin registrados
- Validar fechas y timezones correctamente

#### 7.2 Optimizaciones
**Instrucciones:**
- Cache de reportes generados (evitar regenerar PDF/Excel inmediatamente)
- Compresión de archivos grandes
- Límites de tamaño para exportaciones (máximo 5000 registros)
- Timeouts apropiados para generación de reportes
- Logging de performance para identificar cuellos de botella

### 8. Testing y Debugging

#### 8.1 Testing de Generación
**Instrucciones para crear tests:**
- Test unitario para generación de QR con URLs válidas e inválidas
- Test de generación de PDF con datos mínimos y datos completos
- Test de generación de Excel con diferentes tamaños de datos
- Test de templates de email con diferentes configuraciones
- Mock de servicios externos (QStash, Gmail) para testing

#### 8.2 Debugging Utils
**Archivo a crear:** `lib/utils/debug.ts`

**Instrucciones:**
- Función para guardar archivos generados localmente durante desarrollo
- Logger configurado para diferentes niveles (debug, info, error)
- Función para validar estructura de datos de reportes
- Utilidades para medir tiempo de ejecución
- Función para generar datos de prueba (eventos y registros falsos)

### 9. Configuración de Variables

#### 9.1 Variables de Entorno Adicionales
**Agregar a `.env.local`:**

```
# QStash (Upstash)
QSTASH_CURRENT_SIGNING_KEY=your_qstash_key
QSTASH_NEXT_SIGNING_KEY=your_next_key  
QSTASH_URL=https://qstash.upstash.io

# Redis (opcional, para cache)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Configuración de reportes
MAX_EXPORT_RECORDS=5000
REPORT_CACHE_TTL=300
PDF_TIMEOUT_MS=30000
EXCEL_TIMEOUT_MS=45000

# URLs de callback para jobs
PRE_CLOSE_CALLBACK_URL=${APP_BASE_URL}/api/jobs/pre-close
FINAL_CALLBACK_URL=${APP_BASE_URL}/api/jobs/final
```

### 10. Monitoreo y Logs

#### 10.1 Sistema de Logs
**Archivo a crear:** `lib/utils/logger.ts`

**Instrucciones:**
- Configurar logger estructurado (usar `winston` o similar)
- Niveles: error, warn, info, debug
- Formato JSON para logs en producción
- Logs específicos para:
  - Generación de reportes (tiempo, tamaño de archivo)
  - Ejecución de jobs (éxito/fallo, tiempo de ejecución)
  - Envío de emails (destinatario, asunto, estado)
  - Errores de integración (Google APIs, QStash)
- Rotación de logs automática

#### 10.2 Métricas
**Instrucciones:**
- Contar reportes generados por día
- Tiempo promedio de generación por tipo de reporte
- Tasa de éxito de jobs automáticos
- Errores más comunes por categoría
- Almacenar métricas en base de datos para dashboard futuro

## Entregables Esperados

✅ Servicio de generación de QR funcional  
✅ Generación de PDF inicial y final  
✅ Generación de Excel con múltiples hojas  
✅ Plantillas de email responsive y profesionales  
✅ Sistema de jobs con QStash configurado  
✅ Validaciones y reglas de negocio implementadas  
✅ Sistema de logging y monitoreo  
✅ Tests básicos para componentes críticos  
✅ Documentación de configuración  

## Comandos de Testing

```bash
# Generar QR de prueba
npm run test:qr

# Generar PDF de prueba
npm run test:pdf

# Generar Excel de prueba  
npm run test:excel

# Enviar email de prueba
npm run test:email

# Programar job de prueba
npm run test:job
```

## Notas Importantes

- **Rendimiento**: Los reportes deben generarse en menos de 30 segundos para eventos con hasta 500 registros
- **Calidad**: Los PDF deben ser legibles en impresión y pantalla
- **Compatibilidad**: Excel debe abrir correctamente en Microsoft Excel 2016+
- **Accesibilidad**: Templates de email deben ser accesibles para lectores de pantalla
- **Seguridad**: No incluir información sensible en logs
- **Escalabilidad**: Considerar cache y optimizaciones para eventos grandes

## Siguiente Paso
Continuar con la implementación de páginas y rutas del sistema según la estructura definida en las instrucciones anteriores.
