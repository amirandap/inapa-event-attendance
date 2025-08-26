# DOCUMENTACIÓN DE DESARROLLO - Sistema de Asistencias INAPA

## Tabla de Contenidos
1. [Funcionalidad de Envío de Correos](#funcionalidad-de-envío-de-correos)
2. [Actualización de Eventos con Cambios de Fecha](#actualización-de-eventos-con-cambios-de-fecha)
3. [Generación de Reportes PDF y Excel](#generación-de-reportes-pdf-y-excel)
4. [TODO: Lista de Tareas Pendientes](#todo-lista-de-tareas-pendientes)

---

## Funcionalidad de Envío de Correos

### Arquitectura General

El sistema de correos está diseñado con múltiples capas:

```
API Endpoint → Validación → Procesamiento → Gmail Service → Templates → Auditoría
```

### Componentes Principales

#### 1. Endpoint Principal `/api/mail/send`

**Archivo:** `app/api/mail/send/route.ts`

**Funcionalidad:**
- Recibe solicitudes de envío de correos
- Valida datos de entrada
- Procesa diferentes tipos de destinatarios
- Registra jobs de email en la base de datos
- Simula envío (pendiente integración real con Gmail)

**Parámetros de Entrada:**
```typescript
{
  eventId: string,              // UUID del evento (requerido)
  type: 'manual' | 'invitation' | 'reminder' | 'thank_you', // Tipo de email
  recipients: 'all' | 'pending' | 'attended' | 'custom', // Destinatarios
  subject?: string,             // Asunto personalizado
  message?: string,             // Mensaje personalizado
  template?: string,            // Template predefinido
  customRecipients?: string[]   // Lista personalizada (si recipients='custom')
}
```

**Tipos de Destinatarios:**
- `all`: Todos los invitados del evento
- `pending`: Invitados que no han confirmado asistencia
- `attended`: Solo quienes ya se registraron
- `custom`: Lista personalizada de emails

**Templates Disponibles:**
- `invitation`: Email de invitación con detalles del evento
- `reminder`: Recordatorio para asistentes confirmados
- `thank_you`: Agradecimiento post-evento

#### 2. Service Layer - Gmail Integration

**Archivo Planificado:** `lib/google/gmail.ts`

**Estado:** ⚠️ **PENDIENTE DE IMPLEMENTACIÓN**

**Funcionalidades Requeridas:**
```typescript
interface GmailService {
  sendEmail(options: EmailOptions): Promise<boolean>
  sendEmailWithAttachments(options: EmailOptionsWithAttachments): Promise<boolean>
  validateConfiguration(): Promise<boolean>
}

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

interface EmailOptionsWithAttachments extends EmailOptions {
  attachments: {
    filename: string
    content: Buffer
    contentType: string
  }[]
}
```

#### 3. Templates de Email

**Directorio:** `lib/email/templates/`

**Estado:** ⚠️ **PENDIENTE DE IMPLEMENTACIÓN**

**Templates Requeridos:**

##### Template Inicial (`initial.ts`)
- Email enviado al organizador cuando se crea un evento
- Incluye QR code como adjunto PDF
- Instrucciones para uso del formulario
- Diseño profesional con logo INAPA

##### Template Pre-Cierre (`preClose.ts`)
- Enviado 15 minutos antes del cierre del evento
- Estadísticas en tiempo real
- Lista de registrados y faltantes
- Enlace rápido al formulario

##### Template Final (`final.ts`)
- Reporte completo post-evento
- Adjuntos: PDF y Excel del reporte
- Estadísticas finales con porcentajes
- Agradecimiento y próximos pasos

#### 4. Sistema de Jobs

**Estado:** ⚠️ **PARCIALMENTE IMPLEMENTADO**

**Tabla de Base de Datos:**
```sql
-- EmailJob
id: int (PK)
eventId: string (FK)
kind: 'initial' | 'pre_close' | 'final' | 'manual'
scheduledAt: DateTime
sentAt: DateTime?
status: 'pending' | 'sent' | 'failed'
retryCount: int
errorMsg: string?
```

**Funcionalidades:**
- Jobs automáticos programados por webhooks de Google Calendar
- Jobs manuales desde el dashboard
- Sistema de reintentos para envíos fallidos
- Auditoría completa de todos los envíos

### Flujo de Trabajo Típico

#### Evento Nuevo (Webhook de Google Calendar)
1. Webhook recibe notificación de nuevo evento
2. Se crea registro en base de datos
3. Se genera token de formulario único
4. Se crea QR code del formulario
5. Se genera PDF inicial con QR
6. Se programa job de email inicial
7. Se programan jobs de pre-cierre y final

#### Envío Manual desde Dashboard
1. Usuario selecciona evento y tipo de email
2. API valida permisos y datos
3. Se determina lista de destinatarios
4. Se crea job en base de datos
5. Se procesa envío inmediatamente
6. Se registra auditoría del proceso

### Configuración Requerida

**Variables de Entorno:**
```env
# Gmail API (OAuth2)
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GMAIL_SENDER=

# URLs para templates
APP_BASE_URL=https://tu-dominio.com
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com
```

---

## Actualización de Eventos con Cambios de Fecha

### Arquitectura del Sistema

```
Google Calendar → Webhook → Event Processing → Database Update → Notification System
```

### Componentes Principales

#### 1. Webhook de Google Calendar

**Archivo:** `app/api/webhooks/google/calendar/route.ts`

**Estado:** ✅ **IMPLEMENTADO BÁSICO**

**Funcionalidades Actuales:**
- Recibe notificaciones de Google Calendar
- Distingue entre diferentes tipos de cambios:
  - `sync`: Sincronización inicial
  - `exists`: Evento modificado o creado
  - `not_exists`: Evento eliminado
- Registra auditoría de todos los webhooks

**Funcionalidades Pendientes:**
- Procesamiento real de cambios de eventos
- Actualización de datos en base de datos
- Notificaciones a usuarios afectados

#### 2. Sincronización de Eventos

**Archivo:** `lib/utils/database.ts`

**Función:** `upsertEventFromGoogle()`

**Estado:** ✅ **IMPLEMENTADO**

```typescript
static async upsertEventFromGoogle(
  googleEvent: GoogleCalendarEvent,
  organizerId: number
) {
  // Busca evento existente por googleEventId
  // Si existe: actualiza datos
  // Si no existe: crea nuevo registro
  // Maneja campos: title, description, location, startAt, endAt, status
}
```

#### 3. Endpoint de Sincronización Manual

**Archivo:** `app/api/events/sync/route.ts`

**Estado:** ⚠️ **PARCIALMENTE IMPLEMENTADO**

**Funcionalidades:**
- Sincronización de evento específico por googleEventId
- Sincronización completa de eventos recientes
- Validación de configuración de Google APIs

### Flujos de Actualización

#### Cambio de Fecha Detectado por Webhook

**Flujo Actual:**
1. Google Calendar envía webhook con estado `exists`
2. Sistema registra el webhook en auditoría
3. ⚠️ **PENDIENTE:** Obtener detalles del evento desde Google API
4. ⚠️ **PENDIENTE:** Comparar fechas con evento local
5. ⚠️ **PENDIENTE:** Actualizar base de datos si hay cambios
6. ⚠️ **PENDIENTE:** Notificar a usuarios afectados

**Implementación Requerida:**

```typescript
// En processCalendarEventChange()
async function processCalendarEventChange(resourceUri: string, channelId: string) {
  try {
    // 1. Extraer eventId de resourceUri
    const googleEventId = extractEventIdFromUri(resourceUri)
    
    // 2. Obtener evento desde Google Calendar API
    const googleEvent = await googleCalendarService.getEvent(googleEventId)
    
    // 3. Buscar evento local
    const localEvent = await prisma.event.findUnique({
      where: { googleEventId },
      include: { invitees: true, checkins: true }
    })
    
    if (!localEvent || !googleEvent) return
    
    // 4. Detectar cambios significativos
    const hasDateChange = 
      localEvent.startAt.getTime() !== new Date(googleEvent.start.dateTime).getTime() ||
      localEvent.endAt.getTime() !== new Date(googleEvent.end.dateTime).getTime()
    
    const hasLocationChange = localEvent.location !== googleEvent.location
    const hasTitleChange = localEvent.title !== googleEvent.summary
    
    if (!hasDateChange && !hasLocationChange && !hasTitleChange) {
      return // No hay cambios relevantes
    }
    
    // 5. Actualizar evento en base de datos
    await DatabaseService.upsertEventFromGoogle(googleEvent, localEvent.organizerId)
    
    // 6. Enviar notificaciones si hay cambios importantes
    if (hasDateChange || hasLocationChange) {
      await sendEventUpdateNotifications(localEvent.id, {
        dateChange: hasDateChange,
        locationChange: hasLocationChange,
        oldStartAt: localEvent.startAt,
        newStartAt: new Date(googleEvent.start.dateTime),
        oldLocation: localEvent.location,
        newLocation: googleEvent.location
      })
    }
    
    // 7. Reagendar jobs si cambió la fecha
    if (hasDateChange) {
      await rescheduleEventJobs(localEvent.id, googleEvent)
    }
    
  } catch (error) {
    console.error('Error procesando cambio de evento:', error)
    throw error
  }
}
```

#### Reagendado de Jobs Automáticos

**Funcionalidad Requerida:**
```typescript
async function rescheduleEventJobs(eventId: string, googleEvent: GoogleCalendarEvent) {
  // 1. Cancelar jobs existentes
  await prisma.emailJob.updateMany({
    where: { 
      eventId,
      status: 'pending'
    },
    data: { status: 'cancelled' }
  })
  
  // 2. Crear nuevos jobs con fechas actualizadas
  const newEndTime = new Date(googleEvent.end.dateTime)
  
  // Job pre-cierre: 15 minutos antes del nuevo final
  await prisma.emailJob.create({
    data: {
      eventId,
      kind: 'pre_close',
      scheduledAt: new Date(newEndTime.getTime() - 15 * 60 * 1000),
      status: 'pending'
    }
  })
  
  // Job final: 15 minutos después del nuevo final
  await prisma.emailJob.create({
    data: {
      eventId,
      kind: 'final',
      scheduledAt: new Date(newEndTime.getTime() + 15 * 60 * 1000),
      status: 'pending'
    }
  })
}
```

#### Notificaciones a Usuarios

**Tipos de Notificaciones:**
1. **Cambio de Fecha:** Email a todos los invitados confirmados
2. **Cambio de Ubicación:** Email a todos los invitados confirmados
3. **Cancelación:** Email a todos los invitados + cambio de status

**Template de Email para Cambios:**
```typescript
// lib/email/templates/eventUpdate.ts
export function buildEventUpdateTemplate(
  event: Event,
  changes: {
    dateChange?: boolean
    locationChange?: boolean
    oldStartAt?: Date
    newStartAt?: Date
    oldLocation?: string
    newLocation?: string
  }
) {
  // Template responsive con:
  // - Logo INAPA
  // - Título del evento
  // - Resumen de cambios con antes/después
  // - Nuevos detalles del evento
  // - Opción para confirmar/cancelar asistencia
  // - Información de contacto
}
```

### API de Actualización Manual

**Endpoint:** `PUT /api/events/[id]`

**Estado:** ✅ **IMPLEMENTADO**

**Funcionalidades:**
- Actualización manual de eventos desde dashboard
- Validación de datos de entrada
- Actualización de fechas con conversión correcta a Date
- Include de datos relacionados en respuesta

**Mejoras Requeridas:**
- Detección automática de cambios significativos
- Envío de notificaciones cuando se cambian fechas manualmente
- Validación de conflictos de horarios

---

## Generación de Reportes PDF y Excel

### Arquitectura del Sistema

```
Dashboard → API Request → Data Processing → Report Generation → File Download
                                              ↓
                                    [PDF Service] [Excel Service]
```

### Componentes Principales

#### 1. API de Reportes

**Archivo:** `app/api/reports/route.ts`

**Estado:** ✅ **IMPLEMENTADO BÁSICO**

**Funcionalidades Actuales:**
- Consultas de reportes por tipo
- Filtros por fecha y evento
- Soporte para múltiples formatos (JSON, CSV, Excel)
- Reportes de: eventos, check-ins, invitados, asistencia, instituciones

**Formatos Soportados:**
- `json`: Datos estructurados (implementado)
- `csv`: ⚠️ **Pendiente implementación**
- `excel`: ⚠️ **Pendiente implementación**

#### 2. API de Exportación

**Archivos Planificados:**
- `app/api/exports/[id]/pdf/route.ts`
- `app/api/exports/[id]/xlsx/route.ts`

**Estado:** ⚠️ **PENDIENTE DE IMPLEMENTACIÓN**

### Servicios de Generación

#### 1. Servicio PDF

**Archivo:** `lib/pdf/buildFinal.ts`

**Estado:** ⚠️ **PENDIENTE DE IMPLEMENTACIÓN**

**Dependencias Requeridas:**
```bash
npm install @react-pdf/renderer
```

**Estructura del Servicio:**
```typescript
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'

export class PDFService {
  // PDF Inicial con QR
  static async generateInitialPDF(data: {
    event: Event
    qr: string // base64 dataURL
  }): Promise<Buffer>
  
  // PDF Final con reporte completo
  static async generateFinalPDF(reportData: ReportData): Promise<Buffer>
}

interface ReportData {
  event: {
    id: string
    title: string
    startAt: Date
    endAt: Date
    location: string
  }
  organizer: {
    name: string
    email: string
  }
  totals: {
    registrados: number
    invitados: number
    faltantes: number
    porcentajeAsistencia: number
  }
  registrados: Array<{
    cedula: string
    nombre: string
    cargo: string
    institucion: string
    correo: string
    telefono: string
    createdAt: Date
  }>
  faltantes: Array<{
    email: string
    name: string
    response: string
  }>
}
```

**Características del PDF Final:**
- **Página 1:** Resumen ejecutivo con estadísticas
- **Página 2+:** Lista detallada de registrados con paginación automática
- **Página Final:** Lista de faltantes por estado de respuesta
- **Diseño:** Logo INAPA, colores institucionales, headers/footers
- **Formato:** Carta (letter), orientación portrait

#### 2. Servicio Excel

**Archivo:** `lib/excel/buildFinal.ts`

**Estado:** ⚠️ **PENDIENTE DE IMPLEMENTACIÓN**

**Dependencias Requeridas:**
```bash
npm install exceljs
```

**Estructura del Servicio:**
```typescript
import * as ExcelJS from 'exceljs'

export class ExcelService {
  static async generateFinalExcel(reportData: ReportData): Promise<Buffer>
}
```

**Estructura del Excel:**

##### Hoja 1: "Resumen"
- Información del evento (A1:B10)
- Tabla de estadísticas con formato (A12:B16)
- Gráfico de asistencia (si es posible)

##### Hoja 2: "Registrados"
- Headers: Cédula, Nombre, Cargo, Institución, Email, Sexo, Teléfono, Fecha/Hora Registro
- Datos con formato de tabla
- Filtros automáticos habilitados
- Formato condicional para registros recientes

##### Hoja 3: "Faltantes"
- Headers: Email, Nombre, Estado de Respuesta
- Código de colores por estado:
  - Verde: Confirmado pero no asistió
  - Amarillo: Sin respuesta
  - Rojo: Declinó

**Configuraciones Excel:**
- Auto-ajuste de columnas
- Protección contra edición accidental
- Metadatos: autor, título, descripción
- Formato profesional con logo INAPA

#### 3. Servicio QR

**Archivo:** `lib/qr/generate.ts`

**Estado:** ⚠️ **PENDIENTE DE IMPLEMENTACIÓN**

**Dependencias Requeridas:**
```bash
npm install qrcode
```

**Funcionalidades:**
```typescript
export class QRService {
  static async generateQR(url: string): Promise<string> // base64 dataURL
  static async generateQRBuffer(url: string): Promise<Buffer>
  static validateURL(url: string): boolean
}
```

**Configuración QR:**
- Tamaño: 300x300px
- Formato: PNG
- Nivel de corrección: 'M' (Medium)
- Incluir logo INAPA en el centro (opcional)

### APIs de Descarga

#### 1. Descarga PDF

**Endpoint:** `GET /api/exports/[id]/pdf?type=initial|final`

**Implementación Requerida:**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'final'
  
  // Obtener evento con relaciones
  const event = await DatabaseService.getEventWithRelations(eventId)
  
  let pdfBuffer: Buffer
  
  if (type === 'initial') {
    // PDF inicial con QR
    const qrDataUrl = await QRService.generateQR(
      `${process.env.APP_BASE_URL}/a/${event.formToken}`
    )
    pdfBuffer = await PDFService.generateInitialPDF({ event, qr: qrDataUrl })
  } else {
    // PDF final con reporte
    const reportData = await generateReportData(event)
    pdfBuffer = await PDFService.generateFinalPDF(reportData)
  }
  
  const filename = `${type === 'initial' ? 'QR-Asistencia' : 'Reporte-Final'}-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    },
  })
}
```

#### 2. Descarga Excel

**Endpoint:** `GET /api/exports/[id]/xlsx`

**Implementación Requerida:**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id
  
  // Obtener evento con relaciones
  const event = await DatabaseService.getEventWithRelations(eventId)
  const reportData = await generateReportData(event)
  
  // Generar Excel
  const excelBuffer = await ExcelService.generateFinalExcel(reportData)
  
  const filename = `Reporte-Asistencias-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.xlsx`
  
  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': excelBuffer.length.toString(),
    },
  })
}
```

### Integración con Dashboard

#### Botones de Descarga

**Ubicación:** `app/dashboard/reportes/page.tsx`

**Funcionalidades:**
- Lista de eventos con estadísticas
- Botones para descargar PDF/Excel por evento
- Preview de reportes antes de descargar
- Filtros por fecha y organizador

#### Componente de Reporte

```typescript
// components/reports/ReportActions.tsx
interface ReportActionsProps {
  eventId: string
  eventTitle: string
}

export function ReportActions({ eventId, eventTitle }: ReportActionsProps) {
  const downloadPDF = async (type: 'initial' | 'final') => {
    const response = await fetch(`/api/exports/${eventId}/pdf?type=${type}`)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type === 'initial' ? 'QR' : 'Reporte'}-${eventTitle}.pdf`
    a.click()
  }
  
  const downloadExcel = async () => {
    const response = await fetch(`/api/exports/${eventId}/xlsx`)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Reporte-${eventTitle}.xlsx`
    a.click()
  }
  
  return (
    <div className="flex gap-2">
      <Button onClick={() => downloadPDF('initial')}>
        📄 Descargar QR
      </Button>
      <Button onClick={() => downloadPDF('final')}>
        📊 Reporte PDF
      </Button>
      <Button onClick={downloadExcel}>
        📈 Reporte Excel
      </Button>
    </div>
  )
}
```

### Optimizaciones y Consideraciones

#### Performance
- Cache de reportes generados (15 minutos)
- Límite de 5000 registros por exportación
- Compresión de archivos grandes
- Timeouts apropiados (30 segundos máximo)

#### Seguridad
- Validación de permisos por evento
- Sanitización de nombres de archivo
- Validación de parámetros de entrada
- Rate limiting en endpoints de descarga

#### Monitoring
- Logging de tiempo de generación
- Métricas de tamaño de archivos
- Alertas por errores en generación
- Auditoría de descargas por usuario

---

## TODO: Lista de Tareas Pendientes

### 🔴 Alta Prioridad

#### Sistema de Correos
- [ ] **Implementar GmailService completo**
  - [ ] Configuración OAuth2 con Google
  - [ ] Métodos sendEmail() y sendEmailWithAttachments()
  - [ ] Manejo de errores y reintentos
  - [ ] Rate limiting y cuotas

- [ ] **Crear templates de email**
  - [ ] Template inicial con QR (`lib/email/templates/initial.ts`)
  - [ ] Template pre-cierre (`lib/email/templates/preClose.ts`)
  - [ ] Template final (`lib/email/templates/final.ts`)
  - [ ] Template de actualización de eventos (`lib/email/templates/eventUpdate.ts`)

- [ ] **Sistema de Jobs automáticos**
  - [ ] Integración con scheduler (Upstash QStash o BullMQ)
  - [ ] Procesamiento de jobs pendientes
  - [ ] Sistema de reintentos para fallos
  - [ ] Monitoreo y alertas

#### Actualización de Eventos
- [ ] **Completar webhook de Google Calendar**
  - [ ] Procesamiento real de cambios de eventos
  - [ ] Detección de cambios significativos (fecha, ubicación)
  - [ ] Notificaciones automáticas a usuarios
  - [ ] Reagendado de jobs automáticos

- [ ] **API de sincronización mejorada**
  - [ ] Endpoint `/api/events/sync` completo
  - [ ] Sincronización batch de eventos
  - [ ] Manejo de conflictos y duplicados
  - [ ] Logging detallado de sincronizaciones

#### Generación de Reportes
- [ ] **Implementar servicios de generación**
  - [ ] PDFService completo (`lib/pdf/buildFinal.ts`)
  - [ ] ExcelService completo (`lib/excel/buildFinal.ts`)
  - [ ] QRService (`lib/qr/generate.ts`)

- [ ] **APIs de exportación**
  - [ ] `/api/exports/[id]/pdf` endpoint
  - [ ] `/api/exports/[id]/xlsx` endpoint
  - [ ] Manejo de errores y timeouts
  - [ ] Cache de reportes generados

### 🟡 Prioridad Media

#### Mejoras de Correos
- [ ] **Templates responsive**
  - [ ] Compatibilidad con Outlook, Gmail, Apple Mail
  - [ ] Modo oscuro y claro
  - [ ] Optimización para móviles
  - [ ] Testing en diferentes clientes

- [ ] **Personalización avanzada**
  - [ ] Campos dinámicos en templates
  - [ ] Firma personalizable por organizador
  - [ ] Adjuntos opcionales
  - [ ] Programación de envíos

#### Dashboard y UI
- [ ] **Página de reportes mejorada**
  - [ ] Preview de reportes antes de descargar
  - [ ] Filtros avanzados por fecha/organizador
  - [ ] Estadísticas en tiempo real
  - [ ] Exportación programada

- [ ] **Monitoreo de emails**
  - [ ] Dashboard de jobs de email
  - [ ] Estadísticas de entregas
  - [ ] Logs de errores detallados
  - [ ] Configuración de notificaciones

#### Performance y Escalabilidad
- [ ] **Optimizaciones de base de datos**
  - [ ] Índices optimizados para reportes
  - [ ] Paginación en consultas grandes
  - [ ] Cache de consultas frecuentes
  - [ ] Archivado de eventos antiguos

- [ ] **Cache y CDN**
  - [ ] Cache de reportes generados
  - [ ] CDN para assets estáticos
  - [ ] Compresión de respuestas
  - [ ] Cache de templates compilados

### 🟢 Prioridad Baja

#### Features Adicionales
- [ ] **Notificaciones push**
  - [ ] Service workers para PWA
  - [ ] Notificaciones de browser
  - [ ] Integración con móviles
  - [ ] Configuración por usuario

- [ ] **Analytics avanzados**
  - [ ] Métricas de asistencia por tipo de evento
  - [ ] Análisis de patrones de asistencia
  - [ ] Reportes de engagement
  - [ ] Dashboard ejecutivo

- [ ] **Integración con otros servicios**
  - [ ] Zoom/Teams para eventos virtuales
  - [ ] WhatsApp Business API
  - [ ] SMS notifications
  - [ ] Slack/Discord webhooks

#### Documentación y Testing
- [ ] **Testing comprehensivo**
  - [ ] Unit tests para servicios críticos
  - [ ] Integration tests para APIs
  - [ ] E2E tests para flujos principales
  - [ ] Performance tests para reportes

- [ ] **Documentación técnica**
  - [ ] API documentation (OpenAPI/Swagger)
  - [ ] Deployment guides
  - [ ] Troubleshooting guides
  - [ ] Architecture decision records

### 🔧 Configuración y DevOps

#### Variables de Entorno Requeridas
```env
# Gmail API
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GMAIL_SENDER=noreply@inapa.gob.do

# Google Calendar
GOOGLE_CALENDAR_ID=primary
GOOGLE_WEBHOOK_URL=https://your-domain.com/api/webhooks/google/calendar

# Job Scheduling (Upstash QStash)
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your-qstash-token

# URLs
APP_BASE_URL=https://your-domain.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Database
DATABASE_URL=your-database-url
```

#### Dependencias a Instalar
```bash
# Email y PDF
npm install @react-pdf/renderer react-email

# Excel
npm install exceljs

# QR Codes
npm install qrcode @types/qrcode

# Google APIs
npm install googleapis

# Job Queue (opcional - alternativa a QStash)
npm install bullmq ioredis

# Utilities
npm install date-fns lodash @types/lodash
```

#### Comandos de Testing
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

---

### 📋 Notas para Implementación

#### Orden de Desarrollo Recomendado

1. **Fase 1: Infraestructura Base**
   - QRService básico
   - PDFService inicial (PDF simple)
   - GmailService con envío básico

2. **Fase 2: Templates y Jobs**
   - Templates de email responsive
   - Sistema de jobs con QStash
   - Webhook processing completo

3. **Fase 3: Reportes Avanzados**
   - ExcelService completo
   - APIs de exportación
   - Cache y optimizaciones

4. **Fase 4: Features Avanzadas**
   - Dashboard mejorado
   - Analytics
   - Testing comprehensivo

#### Consideraciones de Seguridad

- **Rate Limiting:** Límites en endpoints de envío de emails
- **Validación:** Sanitización de inputs y validación de permisos
- **Auditoría:** Logging completo de todas las operaciones
- **Encryption:** Datos sensibles encriptados en base de datos

#### Consideraciones de Performance

- **Timeouts:** 30 segundos máximo para generación de reportes
- **Limits:** 5000 registros máximo por exportación
- **Cache:** 15 minutos para reportes, 1 hora para QRs
- **Compression:** Gzip para archivos grandes

---

*Documentación actualizada: $(date)*
*Versión del sistema: 1.0.0*
*Estado del proyecto: Desarrollo activo*
