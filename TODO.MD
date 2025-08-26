# 📋 TODO - Sincronización Google Calendar MVP

## 🎯 **OBJETIVO ACTUALIZADO**
Sistema funcional que permita:
1. 🔄 **Sincronización automática** de eventos desde Google Calendar
2. 📱 **Formulario de asistencia** completamente funcional 
3. 👥 **Dashboard organizador** para ver eventos y estadísticas
4. ✅ **Registro de asistencias** con validación de cédulas dominicanas

**META: Sistema funcional en 7 días con enfoque Google Calendar** 🚀

---

## 🔴 **FASE 1: SINCRONIZACIÓN GOOGLE CALENDAR** (3-4 días)

### **Día 1-2: Webhook y Procesamiento de Eventos**
- [ ] **Completar Webhook Google Calendar**
  - **Descripción**: Implementar procesamiento real de eventos en webhook endpoint
  - **Criterios de Aceptación**:
    * Webhook recibe notificaciones de Google Calendar correctamente
    * Procesa eventos creados, actualizados y eliminados
    * Maneja errores de red y datos inválidos apropiadamente
    * Logs detallados para debugging de sincronización

- [ ] **Sincronización a Base de Datos**
  - **Descripción**: Convertir eventos de Google Calendar a modelo local
  - **Criterios de Aceptación**:
    * Mapea correctamente todos los campos requeridos
    * Evita duplicados usando googleEventId único
    * Actualiza eventos existentes cuando cambian en Google
    * Mantiene integridad referencial en BD

### **Día 2-3: Biblioteca Google Calendar**
- [ ] **Servicio Google Calendar API**
  - **Descripción**: Completar biblioteca para interactuar con Google Calendar
  - **Criterios de Aceptación**:
    * Obtiene eventos de calendario específico con filtros de fecha
    * Busca evento individual por ID
    * Lista calendarios disponibles del usuario
    * Configura watch/webhook para notificaciones automáticas

- [ ] **Sincronización Manual de Eventos**
  - **Descripción**: Endpoint para sincronizar eventos bajo demanda
  - **Criterios de Aceptación**:
    * Sincroniza todos los eventos de un rango de fechas
    * Respuesta incluye cantidad de eventos procesados
    * Maneja calendarios grandes sin timeout
    * Permite re-sincronización de eventos específicos

### **Día 3-4: Base de Datos y Validación**
- [ ] **Esquema Final de Eventos**
  - **Descripción**: Asegurar modelo de BD completo para eventos
  - **Criterios de Aceptación**:
    * Incluye todos los campos necesarios de Google Calendar
    * googleEventId es único y requerido
    * Campos de fecha/hora manejan zonas horarias correctamente
    * Relaciones con tabla de asistencias funcionan correctamente

- [ ] **Testing de Sincronización**
  - **Descripción**: Probar sincronización con calendario real de INAPA
  - **Criterios de Aceptación**:
    * Eventos de prueba se sincronizan en menos de 30 segundos
    * Cambios en Google Calendar se reflejan en BD local
    * No se crean duplicados en múltiples sincronizaciones
    * Maneja eventos recurrentes apropiadamente

---

## 🟡 **FASE 2: FORMULARIO DE ASISTENCIA** (2-3 días)

### **Día 4-5: Formulario Completamente Funcional**
- [ ] **Validación de Cédulas Dominicanas**
  - **Descripción**: Implementar validación robusta de cédulas RD
  - **Criterios de Aceptación**:
    * Valida formato de 11 dígitos con algoritmo estándar
    * Rechaza cédulas inválidas con mensaje claro
    * Acepta entrada con o sin guiones/espacios
    * Previene envío de formulario con cédula inválida

- [ ] **UX/UI del Formulario**
  - **Descripción**: Mejorar experiencia de usuario del formulario
  - **Criterios de Aceptación**:
    * Formulario es completamente responsive (móvil/desktop)
    * Validaciones en tiempo real mientras usuario escribe
    * Mensajes de error claros y específicos
    * Confirmación visual inmediata al registrar asistencia

- [ ] **Prevención de Duplicados**
  - **Descripción**: Evitar registros duplicados de asistencia
  - **Criterios de Aceptación**:
    * No permite registrar misma cédula dos veces por evento
    * Mensaje claro si persona ya está registrada
    * Opción para actualizar datos si ya existe registro
    * Validación tanto frontend como backend

### **Día 5-6: Integración Dashboard-Formulario**
- [ ] **Links Dinámicos para Eventos**
  - **Descripción**: Generar URLs únicas para cada evento
  - **Criterios de Aceptación**:
    * Cada evento tiene URL única basada en ID
    * URLs son fáciles de compartir y recordar
    * Eventos inactivos muestran mensaje apropiado
    * Redirección automática si evento no existe

- [ ] **Estados de Eventos**
  - **Descripción**: Manejar diferentes estados de eventos
  - **Criterios de Aceptación**:
    * Eventos futuros: formulario activo y funcional
    * Eventos en curso: formulario activo con indicador de tiempo
    * Eventos pasados: formulario deshabilitado con mensaje
    * Eventos cancelados: mensaje claro de cancelación

---

## 🟢 **FASE 3: DASHBOARD ORGANIZADOR** (1-2 días)

### **Día 6-7: Vista de Organizador**
- [ ] **Lista de Eventos Sincronizados**
  - **Descripción**: Dashboard muestra eventos desde Google Calendar
  - **Criterios de Aceptación**:
    * Lista todos los eventos del organizador
    * Muestra información básica (título, fecha, ubicación)
    * Indica estado actual de cada evento
    * Permite acceso rápido a detalles de evento

- [ ] **Estadísticas de Asistencia**
  - **Descripción**: Contadores y métricas por evento
  - **Criterios de Aceptación**:
    * Muestra total de asistentes registrados
    * Porcentaje de asistencia vs invitados esperados
    * Actualización en tiempo real al registrarse nuevos asistentes
    * Filtros por fecha y estado de evento

- [ ] **Gestión de Asistentes**
  - **Descripción**: Ver y administrar lista de asistentes
  - **Criterios de Aceptación**:
    * Lista completa de asistentes por evento
    * Información detallada de cada asistente
    * Capacidad de exportar lista básica
    * Búsqueda y filtrado de asistentes

---

## 🛠️ **IMPLEMENTACIÓN TÉCNICA CRÍTICA**

### **1. Webhook Google Calendar (PRIORIDAD #1)**
**Archivo**: `app/api/webhooks/google/calendar/route.ts`
**Responsabilidad**: Recibir y procesar notificaciones de cambios en Google Calendar
**Funciones requeridas**: Manejar eventos creados, actualizados y eliminados

### **2. Sincronización de Eventos**
**Archivo**: `lib/google/calendar.ts`
**Responsabilidad**: Interactuar con Google Calendar API y sincronizar a BD local
**Funciones requeridas**: Obtener eventos, mapear datos, evitar duplicados

### **3. Formulario de Asistencia**
**Archivo**: `components/forms/AttendanceForm.tsx`
**Responsabilidad**: Capturar datos de asistentes con validaciones
**Funciones requeridas**: Validar cédulas RD, prevenir duplicados, confirmar registro

---

## 📋 **ARCHIVOS CRÍTICOS A COMPLETAR**

### **APIs Principales - Tareas**
- [ ] `app/api/webhooks/google/calendar/route.ts` - Implementar procesamiento completo de webhook
- [ ] `app/api/events/sync/route.ts` - Completar sincronización manual de eventos
- [ ] `app/api/events/[id]/route.ts` - Endpoint para obtener evento específico  
- [ ] `app/api/attendance/route.ts` - Mejorar registro de asistencias con validaciones
- [ ] `app/api/events/[id]/attendees/route.ts` - Crear endpoint para lista de asistentes

### **Páginas Principales - Tareas**
- [ ] `app/eventos/[id]/page.tsx` - Completar formulario de asistencia público
- [ ] `app/dashboard/eventos/page.tsx` - Crear lista de eventos para organizador
- [ ] `app/dashboard/eventos/[id]/page.tsx` - Página de detalle de evento con asistentes

### **Librerías de Negocio - Tareas**
- [ ] `lib/google/calendar.ts` - Implementar todas las funciones de Google Calendar API
- [ ] `lib/validations/cedula.ts` - Crear validación robusta de cédulas dominicanas
- [ ] `lib/db/events.ts` - Funciones de base de datos para eventos
- [ ] `lib/db/attendance.ts` - Funciones de base de datos para asistencias

---

## 🎯 **CRITERIOS DE ÉXITO ACTUALIZADO**

### **Demo de Funcionalidad (5 minutos)**
1. **Crear evento en Google Calendar** → Aparece automáticamente en sistema
2. **Abrir dashboard** → Ver evento sincronizado con datos correctos
3. **Acceder a formulario** via link único del evento
4. **Registrar asistencia** con cédula válida → Confirmación inmediata
5. **Ver en dashboard** → Estadísticas actualizadas en tiempo real

### **Pruebas Técnicas**
- [ ] Webhook procesa eventos de Google Calendar en < 30 segundos
- [ ] Sincronización manual trae eventos en < 10 segundos
- [ ] Formulario valida cédulas dominicanas correctamente
- [ ] Dashboard carga eventos en < 3 segundos
- [ ] Registro de asistencia se guarda en < 2 segundos

---

## 🚫 **FUERA DEL ALCANCE ACTUAL**

### **NO Implementar Ahora**
- ❌ Creación manual de eventos (todo desde Google Calendar)
- ❌ Sistema de autenticación complejo
- ❌ Templates de email elaborados  
- ❌ Reportes PDF/Excel avanzados
- ❌ Dashboard con gráficos complejos
- ❌ PWA y funcionalidad offline

### **Simplificaciones Temporales**
- **Autenticación**: Sin login inicialmente
- **Emails**: Solo confirmaciones básicas
- **Reportes**: Lista simple de asistentes
- **Dashboard**: Estadísticas básicas sin gráficos

---

## 📅 **CRONOGRAMA REVISADO**

| Día | Enfoque Principal | Entregable Clave |
|-----|------------------|------------------|
| 1-2 | Webhook + Procesamiento | ✅ Eventos se sincronizan automáticamente |
| 2-3 | Google Calendar API | ✅ Sincronización manual funciona |
| 3-4 | Base de datos + Testing | ✅ Datos correctos en BD |
| 4-5 | Formulario asistencia | ✅ Registro funciona completamente |
| 5-6 | Dashboard organizador | ✅ Vista de eventos y asistentes |
| 6-7 | Integration + Polish | 🚀 **SISTEMA FUNCIONAL** |

---

## ✅ **YA COMPLETADO (Base Sólida)**

- [x] **Estructura del Proyecto**: Next.js 15 + Prisma + TypeScript ✅
- [x] **Esquema de Base de Datos**: Modelos Event y Checkin definidos ✅
- [x] **UI Components**: shadcn/ui configurado profesionalmente ✅
- [x] **Google Calendar Setup**: API configurada y autenticada ✅
- [x] **Webhook Básico**: Endpoint creado (necesita completar lógica) ✅
- [x] **Formulario Base**: Estructura básica del formulario existe ✅

---

## 📝 **NOTAS DE DESARROLLO**

### **Prioridad Absoluta: Google Calendar**
El sistema debe funcionar **100% sincronizado** con Google Calendar. Los organizadores de INAPA crean eventos en su calendario corporativo y el sistema debe detectarlos automáticamente.

### **Flujo de Trabajo Real**
1. **Organizador INAPA** crea evento en Google Calendar corporativo
2. **Google Calendar** envía webhook al sistema
3. **Sistema** procesa y guarda evento en BD local
4. **Sistema** genera link único para formulario de asistencia
5. **Organizador** comparte link con invitados
6. **Invitados** llenan formulario con datos personales
7. **Organizador** ve estadísticas en dashboard

### **Validación Cédulas RD**
Implementar algoritmo estándar de validación de cédulas dominicanas (dígito verificador) para asegurar datos de calidad.

---

**Última actualización**: Agosto 26, 2025  
**Versión**: 2.0 - Google Calendar First  
**Estado**: � En desarrollo - Sincronización en progreso

---

## 🔴 **FASE 1: MVP CORE** (3-4 días)

### **Día 1-2: Sistema de Emails Básico**
- [ ] **Gmail Service Funcional**: Implementar envío real en `lib/google/gmail.ts`
  ```typescript
  // Funciones mínimas:
  sendEmail(to, subject, html)
  sendEmailWithAttachment(to, subject, html, attachment)
  ```
- [ ] **Template Básico**: Un solo template responsive para todos los emails
- [ ] **Test de Envío**: Verificar que lleguen emails a Gmail/Outlook

### **Día 2-3: Generación de QR y PDFs Básicos** 
- [ ] **QR Generator**: Implementar generación de códigos QR
- [ ] **PDF Simple**: Crear PDF básico con QR para eventos
- [ ] **Integrar con Emails**: Adjuntar PDF automáticamente

### **Día 3-4: Dashboard Funcional Básico**
- [ ] **CRUD Eventos**: Crear/editar/eliminar eventos desde dashboard
- [ ] **Envío Manual**: Botón para enviar QR por email
- [ ] **Vista de Asistencias**: Lista simple de registrados por evento

### 🔄 Sincronización Google Calendar
- [ ] **Procesamiento Real**: Completar `processCalendarEventChange()` en webhook
- [ ] **Actualización de Eventos**: Manejar cambios de fecha/hora/ubicación
- [ ] **Eventos Cancelados**: Procesar cancelaciones y notificar usuarios
- [ ] **Sincronización Manual**: Mejorar endpoint `/api/events/sync`

### 📊 Generación de Reportes
- [ ] **PDFs**: Implementar generación de reportes PDF (`lib/pdf/`)
  - [ ] Reporte inicial con QR
  - [ ] Reporte pre-cierre con estadísticas
  - [ ] Reporte final completo
- [ ] **Excel**: Exportación a Excel (`lib/excel/`)
- [ ] **Endpoints**: Crear `/api/exports/[id]/pdf` y `/api/exports/[id]/excel`

## 🟡 **PRIORIDAD ALTA**

### 🔐 Autenticación y Seguridad
- [ ] **Login Administradores**: Crear sistema de login (`app/login/`)
- [ ] **Middleware**: Proteger rutas del dashboard (`middleware.ts`)
- [ ] **Roles**: Sistema de permisos (Super Admin, Organizador, Visualizador)
- [ ] **Rate Limiting**: Protección contra abuso de APIs

### 🎯 Dashboard Funcional
- [ ] **CRUD Eventos**: Funcionalidad backend para gestión de eventos
- [ ] **Estadísticas Tiempo Real**: Dashboard con datos actualizados
- [ ] **Gestión Asistencias**: CRUD completo de asistencias
- [ ] **Configuración**: Panel para organizadores

## 🟢 **MEJORAS Y OPTIMIZACIÓN**

### 🧪 Testing
- [ ] **Tests Unitarios**: Jest + React Testing Library (80% cobertura)
- [ ] **Tests Integración**: Flujos end-to-end completos
- [ ] **Tests Carga**: Soporte para 100+ usuarios simultáneos

### � UX/UI
- [ ] **Mobile Responsive**: Optimizar formularios para móvil
- [ ] **PWA**: Convertir en Progressive Web App
- [ ] **Offline Support**: Funcionalidad básica offline

### 🔧 DevOps y Producción
- [ ] **CI/CD Pipeline**: GitHub Actions para deploy automático
- [ ] **Monitoreo**: Logs estructurados y métricas
- [ ] **Backup Automático**: Estrategia de respaldo de datos
- [ ] **Documentación Admin**: Guías para administradores

## ✅ **COMPLETADO**

- [x] **Documentación**: Organizar folder de documentación ✅
- [x] **Estructura Base**: Proyecto Next.js con Prisma ✅
- [x] **Formulario Asistencia**: Funcionalidad básica ✅
- [x] **API Emails**: Endpoint básico `/api/mail/send` ✅
- [x] **Webhook Google**: Endpoint básico (solo logs) ✅

---

## 📊 **ESTADO GENERAL**

| Módulo | Estado | Días Est. |
|--------|--------|-----------|
| 📧 Correos | 40% | 3-4 días |
| 🔄 Sincronización | 30% | 2-3 días |
| 📊 Reportes | 0% | 4-5 días |
| 🔐 Autenticación | 10% | 2-3 días |
| 🎯 Dashboard | 20% | 3-4 días |

**TOTAL: 15-20 días para producción**

## 📝 **Notas de Desarrollo**

Para nuevas tareas, usar el formato:
```markdown
- [ ] **Categoría**: Descripción de la tarea
```

Ver documentación detallada en: [docs/production/funcionalidades-faltantes.md](./docs/production/funcionalidades-faltantes.md)

## 🏷️ **Etiquetas**

- **� Crítico**: Bloqueante para producción
- **� Alta**: Importante para funcionalidad completa  
- **� Media**: Mejoras y optimización
- **✅ Completado**: Tareas finalizadas