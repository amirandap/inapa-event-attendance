# 🚨 TODO - PRIORIDADES INMEDIATAS - **ACTUALIZADO**

**Fecha**: Septiembre 5, 2025  
**Estado**: 🎉 **AVANCES SIGNIFICATIVOS** - Actualizado post commits  

---

## ✅ **COMPLETADO EN LOS ÚLTIMOS COMMITS** 

### **✅ PRIORIDAD 1: WEBHOOK GOOGLE CALENDAR** - **IMPLEMENTADO** ✅
**📅 Completado**: Commit `707a208` - "Se modifico el webhook para manejar todos los cambios"

**✅ Funciones implementadas**:
- ✅ `processCalendarEventChange()` → Ahora llama a `calendarService.syncSingleEventById()`
- ✅ `processCalendarEventDeletion()` → Ahora llama a `calendarService.cancelEventByGoogleId()`
- ✅ **Nuevo servicio**: `lib/services/calendar.ts` con lógica completa
- ✅ **Función**: `syncSingleEventById()` - Sincroniza eventos automáticamente
- ✅ **Función**: `cancelEventByGoogleId()` - Cancela eventos eliminados
- ✅ **Función**: `extractEventIdFromUri()` - Extrae ID de Google

**🎯 Resultado**: Sistema 100% automático. Cambios en Google Calendar se reflejan inmediatamente.

### **✅ PRIORIDAD 2: GENERACIÓN DE PDF FUNCIONAL** - **IMPLEMENTADO** ✅
**📅 Completado**: Commits `27d2093` + `cd46b16` - "Reportes PDF" + "QR URLs correctos"

**✅ Archivos creados/mejorados**:
- ✅ **Endpoint**: `app/api/exports/[id]/pdf/route.ts` - **FUNCIONAL COMPLETO**
- ✅ **Generador**: `lib/pdf/generator.ts` - **TOTALMENTE REESCRITO** (440+ líneas)
- ✅ **Frontend**: `components/events/MeetingSummary.tsx` - **BOTÓN FUNCIONAL**
- ✅ **Fonts**: Agregadas fuentes Helvetica profesionales
- ✅ **Logo**: `public/images/inapa-logo.png` para PDFs
- ✅ **QR**: URLs corregidas para funcionar correctamente

**✅ Funciones implementadas**:
- ✅ `generateInitialPDF()` - PDF con QR code prominente
- ✅ `generateFinalPDF()` - Reporte completo multi-página
- ✅ Diseño profesional con logo INAPA
- ✅ Headers, footers, paginación automática
- ✅ Tablas de asistentes y faltantes

**🎯 Resultado**: Botón "Descargar PDF" ahora genera archivos reales profesionales.

---

## 🔴 **PENDIENTE - PRIORIDADES RESTANTES**

### **🔴 PRIORIDAD 3: AUTOMATIZACIÓN DE EMAILS** - PENDIENTE ⚠️
**⏰ Tiempo estimado**: 2-3 horas

**Problema crítico**: 
Los jobs de email están programados pero **NO SE EJECUTAN AUTOMÁTICAMENTE**. Se crean en la BD pero no hay cron jobs que los disparen.

**Archivos a crear/modificar**:
```bash
lib/qstash.ts                    # ❌ CREAR - Cliente para cron jobs
lib/jobs/email-scheduler.ts      # ❌ CREAR - Lógica de programación
app/api/cron/email-jobs/route.ts # ❌ CREAR - Endpoint para cron
```

**Funcionalidad faltante**:
- ❌ Cron job que ejecute emails 1 hora antes del evento
- ❌ Cron job que ejecute emails 15 minutos antes de finalizar  
- ❌ UI para configurar tiempos (actualmente hardcoded)
- ❌ Settings persistentes en BD para intervalos de tiempo

**Problema técnico**:
```typescript
// ESTO FUNCIONA: Crear job manual
POST /api/jobs/pre-close { eventId: "123", hoursBeforeEvent: 1 }

// ESTO NO FUNCIONA: Ejecución automática
// No hay sistema que ejecute PUT /api/jobs/pre-close automáticamente
```

### **🔴 PRIORIDAD 4: EMAILS SIN ADJUNTOS PDF** - PENDIENTE ⚠️
**⏰ Tiempo estimado**: 1 día

**Problema**: 
SMTP funciona, Excel se adjunta, pero emails aún no incluyen PDF.

**Archivo a modificar**:
```bash
lib/services/reports.ts  # LÍNEA ~68
```

**Cambio requerido**:
```typescript
// LÍNEA 68 - EN sendAttendanceReport()
// CAMBIAR:
await smtpService.sendEmail(
  recipients,
  `Reporte de Asistencia - ${event.title}`,
  emailContent,
  [{
    filename,
    content: buffer, // Solo Excel
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }]
);

// POR:
import { generateFinalPDF } from '@/lib/pdf/generator'; // AGREGAR IMPORT

// Generar PDF también
const pdfBuffer = await generateFinalPDF(eventId);
const pdfFilename = `reporte-${event.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;

await smtpService.sendEmail(
  recipients,
  `Reporte de Asistencia - ${event.title}`,
  emailContent,
  [
    // Excel existente
    {
      filename,
      content: buffer,
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

### **🟡 PRIORIDAD 5: TEMPLATES DE EMAIL PROFESIONALES** - PENDIENTE
**⏰ Tiempo estimado**: 2 días

**Directorio FALTANTE**:
```bash
lib/email/templates/  # ❌ AÚN NO EXISTE
```

**Templates a crear**:

#### 📧 **Template Inicial** 
```bash
lib/email/templates/initial.tsx  # ❌ CREAR
```

#### 📧 **Template Pre-Cierre**
```bash
lib/email/templates/preClose.tsx  # ❌ CREAR
```

#### 📧 **Template Final**
```bash
lib/email/templates/final.tsx  # ❌ CREAR
```

**Tecnología recomendada**:
```bash
npm install react-email @react-email/components
```

### **🟠 PRIORIDAD 6: ACTUALIZAR VERSIONES DE NODE.JS Y DEPENDENCIAS** - CRÍTICO ⚠️
**⏰ Tiempo estimado**: 1 hora

**Problema actual**:
```bash
Current Node.js: v18.20.8
Required Node.js: ^20.19.0 || ^22.13.0 || ^23.5.0 || >=24.0.0
```

**Paquetes incompatibles**:
- `@faker-js/faker@10.0.0` - Requiere Node ≥20
- `@isaacs/balanced-match@4.0.1` - Requiere Node ≥20  
- `@isaacs/brace-expansion@5.0.0` - Requiere Node ≥20
- `jackspeak@4.1.1` - Requiere Node ≥20
- `lru-cache@11.1.0` - Requiere Node ≥20
- `path-scurry@2.0.0` - Requiere Node ≥20
- `glob@11.0.3` - Requiere Node ≥20
- `minimatch@10.0.3` - Requiere Node ≥20

**Paquetes deprecated a actualizar**:
- `inflight@1.0.6` → Usar `lru-cache`
- `lodash.isequal@4.5.0` → Usar `require('node:util').isDeepStrictEqual`
- `rimraf@2.7.1` → Actualizar a v4+
- `mailcomposer@4.0.2` → Encontrar alternativa mantenida
- `glob@7.2.3` → Actualizar a v9+
- `buildmail@4.0.1` → Encontrar alternativa mantenida
- `dommatrix@1.0.3` → Usar `@thednp/dommatrix`
- `fstream@1.0.12` → Usar alternativa moderna
- `node-domexception@1.0.0` → Usar `platform's native DOMException`

**Acciones requeridas**:
1. **Actualizar Node.js**: `nvm install 20.19.0 && nvm use 20.19.0`
2. **Actualizar package.json**: Especificar engines mínimos
3. **Revisar dependencias**: Eliminar paquetes deprecated
4. **Testing completo**: Verificar que todo funcione con Node 20+

---

## 📊 **RESUMEN DE PROGRESO ACTUALIZADO**

| Prioridad | Estado Anterior | Estado Actual | Progreso |
|-----------|----------------|---------------|----------|
| 1. Webhook | ❌ Funciones vacías | ✅ **COMPLETADO** | +100% ✅ |
| 2. PDF | ❌ Botón "en desarrollo" | ✅ **COMPLETADO** | +100% ✅ |
| 3. Email Auto | ❌ Sin automatización | ⚠️ **PENDIENTE** | 0% |
| 4. Email+PDF | ❌ Sin PDF en emails | ⚠️ **PENDIENTE** | 0% |
| 5. Templates | ❌ HTML básico | ❌ **PENDIENTE** | 0% |
| 6. Node.js | ❌ v18.20.8 obsoleto | ❌ **CRÍTICO** | 0% |

**🎉 PROGRESO TOTAL: 50% → 100% en las prioridades críticas 1-2**
**⚠️ BLOQUEO TÉCNICO: Node.js debe actualizarse antes de continuar**

---

## 🔄 **NUEVAS FUNCIONALIDADES AGREGADAS**

### **🆕 Fonts Profesionales**
- ✅ `public/fonts/Helvetica.ttf`
- ✅ `public/fonts/Helvetica-Bold.ttf` 
- ✅ `public/fonts/LiberationSans-*.ttf`

### **🆕 Logo INAPA**
- ✅ `public/images/inapa-logo.png`
- ✅ `public/images/inapa-logo.jpeg`

### **🆕 Servicio Calendar Completo**
- ✅ `lib/services/calendar.ts` (134 líneas)
- ✅ Autenticación con Service Account
- ✅ Extracción de Event ID desde URI
- ✅ Sincronización automática bi-direccional
- ✅ Manejo de cancelaciones

### **🆕 PDF Generator Profesional**
- ✅ 486 líneas de código (vs 29 anteriores)
- ✅ Diseño multi-página
- ✅ QR codes con URLs correctas  
- ✅ Tablas de asistentes y faltantes
- ✅ Headers y footers institucionales
- ✅ Manejo de paginación automática

---

## 🎯 **PLAN EJECUTIVO ACTUALIZADO**

### **HOY - DÍA 1**: Actualizar Node.js ⚠️ **CRÍTICO**
- Actualizar Node.js a v20.19.0 o superior
- Corregir dependencias incompatibles y deprecated
- Testing básico de funcionalidad
- **Resultado**: Ambiente de desarrollo estable

### **DÍA 2**: Automatización de emails ⚠️
- Crear `lib/qstash.ts` o alternativa de cron jobs
- Implementar ejecución automática de email jobs
- **Resultado**: Emails se envían automáticamente

### **DÍA 3**: Email con PDF ⚠️
- Agregar PDF a `lib/services/reports.ts`
- Testing de emails con doble adjunto
- **Resultado**: Emails completos con Excel + PDF

### **DÍA 4-5**: Templates profesionales
- Setup `react-email`
- Crear 3 templates con logo INAPA
- Integrar templates en servicios
- **Resultado**: Emails con diseño institucional

**🚀 TIEMPO TOTAL RESTANTE: 5 días máximo**

---

## ✅ **CRITERIOS DE ÉXITO ACTUALIZADOS**

### **✅ YA LOGRADO**:
- ✅ Crear evento en Google Calendar → Aparece automáticamente
- ✅ Cambiar fecha en Google Calendar → Se actualiza automáticamente  
- ✅ Cancelar evento en Google Calendar → Se marca como cancelado
- ✅ Botón "Descargar PDF" genera archivo real profesional
- ✅ PDF incluye QR code, logo INAPA y diseño institucional
- ✅ Descarga funciona en todos los navegadores

### **⚠️ POR LOGRAR**:
- ⚠️ **CRÍTICO**: Actualizar Node.js a v20+ para compatibilidad
- ⚠️ Automatización real de emails (cron jobs)
- ⚠️ Emails incluyen adjunto PDF + Excel
- ⚠️ Emails tienen diseño profesional con logo INAPA  
- ⚠️ Compatible con Outlook, Gmail, Apple Mail

---

**🎉 EXCELENTE PROGRESO! 2 de 4 prioridades críticas ya completadas al 100%** 🚀
