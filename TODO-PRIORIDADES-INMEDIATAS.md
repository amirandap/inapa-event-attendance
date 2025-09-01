# 🚨 TODO - PRIORIDADES INMEDIATAS

**Fecha**: Septiembre 1, 2025  
**Estado**: 🔥 URGENTE - Problemas críticos del frontend  

---

## 🔴 **PRIORIDAD 1: WEBHOOK GOOGLE CALENDAR** 
**⏰ Tiempo estimado**: 2-3 días

### **Problema**: 
Webhook solo registra logs, no procesa eventos reales automáticamente.

### **Archivos a completar**:
```bash
app/api/webhooks/google/calendar/route.ts
```

### **Funciones VACÍAS a implementar**:

#### 🔧 **processCalendarEventChange()** - LÍNEAS 137-161
```typescript
async function processCalendarEventChange(resourceUri?: string | null, channelId?: string | null) {
  // TODO: 1. Extraer eventId de resourceUri
  // TODO: 2. Obtener evento desde Google Calendar API  
  // TODO: 3. Buscar evento en BD por googleEventId
  // TODO: 4. Actualizar datos si hay cambios (fecha, título, ubicación)
  // TODO: 5. Sincronizar asistentes automáticamente
  // TODO: 6. Notificar cambios importantes a usuarios
  // TODO: 7. Reagendar jobs si cambió la fecha/hora
}
```

#### 🔧 **processCalendarEventDeletion()** - LÍNEAS 167-191
```typescript
async function processCalendarEventDeletion(resourceUri?: string | null, channelId?: string | null) {
  // TODO: 1. Extraer eventId de resourceUri
  // TODO: 2. Buscar evento en BD por googleEventId
  // TODO: 3. Marcar evento como 'cancelled'
  // TODO: 4. Enviar emails de cancelación a invitados
  // TODO: 5. Cancelar todos los jobs pendientes
  // TODO: 6. Registrar auditoría de cancelación
}
```

### **Impacto**: 
- ✅ **Con esto**: Sistema 100% automático, cambios en Google Calendar se reflejan inmediatamente
- ❌ **Sin esto**: Requiere sincronización manual constante

---

## 🔴 **PRIORIDAD 2: GENERACIÓN DE PDF FUNCIONAL**
**⏰ Tiempo estimado**: 1-2 días

### **Problema**: 
Botón "Descargar PDF" en frontend muestra "en desarrollo" en lugar de generar archivo.

### **Archivos FALTANTES a crear**:

#### 📄 **Endpoint de PDF** - NO EXISTE
```bash
app/api/exports/[id]/pdf/route.ts  # ❌ CREAR
```

```typescript
// GET /api/exports/[eventId]/pdf?type=initial|final
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'final';
  const eventId = params.id;

  try {
    let pdfBuffer: Buffer;
    
    if (type === 'initial') {
      // PDF con QR code
      pdfBuffer = await generateInitialPDF(eventId);
    } else {
      // PDF reporte completo 
      pdfBuffer = await generateFinalPDF(eventId);
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    const filename = `${type === 'initial' ? 'QR-Asistencia' : 'Reporte-Final'}-${event?.title}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 });
  }
}
```

#### 📄 **Mejoras al generador PDF actual**
```bash
lib/pdf/generator.ts  # ⚠️ MEJORAR EXISTENTE
```

**Problemas actuales**:
- PDF muy básico, sin formato profesional
- No incluye QR codes
- No diferencia entre PDF inicial vs final
- Falta logo INAPA y diseño institucional

**Mejoras requeridas**:
```typescript
// AGREGAR:
export async function generateInitialPDF(eventId: string): Promise<Buffer> {
  // PDF con QR code prominente
  // Instrucciones para organizador
  // Diseño profesional con logo INAPA
}

export async function generateFinalPDF(eventId: string): Promise<Buffer> {
  // Reporte completo multi-página
  // Estadísticas con gráficos
  // Lista completa de asistentes
  // Lista de faltantes por estado
}
```

### **Frontend a actualizar**:
```bash
components/events/MeetingSummary.tsx  # LÍNEA 102-105
```

**Cambiar**:
```typescript
const handleDownloadPDF = () => {
  alert('Función de descarga PDF en desarrollo')  // ❌ QUITAR
}
```

**Por**:
```typescript
const handleDownloadPDF = async () => {
  try {
    const response = await fetch(`/api/exports/${event.id}/pdf?type=final`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte-${event.title}.pdf`;
    a.click();
  } catch (error) {
    alert('Error al generar PDF');
  }
}
```

---

## 🔴 **PRIORIDAD 3: EMAILS SIN ADJUNTOS PDF**
**⏰ Tiempo estimado**: 1 día

### **Problema**: 
Emails se envían pero sin adjuntos PDF, aunque el sistema de reportes funciona.

### **Archivo a revisar**:
```bash
lib/services/reports.ts  # ⚠️ VERIFICAR INTEGRACIÓN
```

**Verificar en `sendAttendanceReport()`**:
- ✅ SMTP Service funciona
- ✅ Excel se adjunta correctamente  
- ❌ **Falta**: Generar PDF y adjuntarlo también

**Agregar PDF a email**:
```typescript
// En sendAttendanceReport() - LÍNEA ~68
const { buffer: excelBuffer, filename: excelFilename } = await this.generateEventAttendanceReport(eventId);

// AGREGAR ESTO:
const pdfBuffer = await generateFinalPDF(eventId);
const pdfFilename = `reporte-${event.title}.pdf`;

await smtpService.sendEmail(
  recipients,
  `Reporte de Asistencia - ${event.title}`,
  emailContent,
  [
    // Excel existente
    {
      filename: excelFilename,
      content: excelBuffer,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    // AGREGAR PDF:
    {
      filename: pdfFilename,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }
  ]
);
```

---

## 🟡 **PRIORIDAD 4: TEMPLATES DE EMAIL PROFESIONALES**
**⏰ Tiempo estimado**: 2 días

### **Problema**: 
Emails usan contenido HTML básico en lugar de templates profesionales.

### **Directorio FALTANTE a crear**:
```bash
lib/email/templates/  # ❌ NO EXISTE
```

### **Templates a crear**:

#### 📧 **Template Inicial** 
```bash
lib/email/templates/initial.tsx
```
- Email con QR code del evento
- Instrucciones para organizador  
- Diseño con logo INAPA
- Compatible con Outlook, Gmail, Apple Mail

#### 📧 **Template Pre-Cierre**
```bash
lib/email/templates/preClose.tsx  
```
- Enviado 15 min antes del cierre
- Estadísticas en tiempo real
- Lista de registrados y faltantes
- Diseño urgente (colores naranjas)

#### 📧 **Template Final**
```bash
lib/email/templates/final.tsx
```
- Reporte final completo
- Estadísticas con porcentajes
- Agradecimiento al organizador
- Mención de adjuntos (PDF + Excel)

### **Tecnología recomendada**:
```bash
npm install react-email @react-email/components
```

### **Estructura de template**:
```typescript
import { Html, Head, Body, Container, Section, Text, Button } from '@react-email/components';

export function InitialEmailTemplate({ event, qrUrl, formUrl }: {
  event: { title: string; startAt: Date; location: string };
  qrUrl: string;
  formUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif' }}>
        <Container>
          {/* Logo INAPA */}
          <Section>
            <Text style={{ fontSize: '24px', color: '#1e40af' }}>
              INAPA - Sistema de Asistencias
            </Text>
          </Section>
          
          {/* Contenido del evento */}
          <Section>
            <Text>Su evento "{event.title}" ha sido configurado.</Text>
            <Text>Formulario: {formUrl}</Text>
          </Section>
          
          {/* QR Code */}
          <Section>
            <img src={qrUrl} alt="QR Code" style={{ maxWidth: '200px' }} />
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

---

## 📊 **RESUMEN DE IMPACTO**

| Prioridad | Problema | Impacto Frontend | Tiempo |
|-----------|----------|------------------|---------|
| 1 | Webhook vacío | Sistema no es automático | 2-3 días |
| 2 | PDF no funciona | Botón muestra "en desarrollo" | 1-2 días |
| 3 | Email sin PDF | Emails incompletos | 1 día |
| 4 | Templates básicos | Emails no profesionales | 2 días |

**TOTAL ESTIMADO**: 6-8 días para resolver todos los problemas críticos del frontend.

---

## 🎯 **PLAN DE EJECUCIÓN RECOMENDADO**

### **DÍA 1-2**: Webhook funcional
- Implementar `processCalendarEventChange()`
- Implementar `processCalendarEventDeletion()`
- Testing con eventos reales de Google Calendar

### **DÍA 3**: PDF funcional  
- Crear endpoint `/api/exports/[id]/pdf/route.ts`
- Mejorar `lib/pdf/generator.ts`
- Actualizar frontend para descargar PDFs reales

### **DÍA 4**: Emails con PDF
- Integrar PDF en `lib/services/reports.ts`
- Testing de emails con ambos adjuntos

### **DÍA 5-6**: Templates profesionales
- Crear templates con `react-email`
- Reemplazar HTML básico con templates
- Testing en diferentes clientes de email

---

## ✅ **CRITERIOS DE ÉXITO**

### **Webhook (Prioridad 1)**:
- ✅ Crear evento en Google Calendar → Aparece automáticamente en sistema
- ✅ Cambiar fecha en Google Calendar → Se actualiza automáticamente  
- ✅ Cancelar evento en Google Calendar → Se marca como cancelado

### **PDF (Prioridad 2)**:
- ✅ Botón "Descargar PDF" genera archivo real
- ✅ PDF incluye QR code y diseño profesional
- ✅ Descarga funciona en todos los navegadores

### **Email + PDF (Prioridad 3)**:
- ✅ Emails incluyen adjunto PDF + Excel
- ✅ Adjuntos se abren correctamente
- ✅ No hay errores en el envío

### **Templates (Prioridad 4)**:
- ✅ Emails tienen diseño profesional con logo INAPA  
- ✅ Compatible con Outlook, Gmail, Apple Mail
- ✅ Responsive en móviles y escritorio

---

**¿Apruebas este plan de prioridades inmediatas?** 🚀
