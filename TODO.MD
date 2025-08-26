# 📋 TODO - MVP URGENTE (Solo 3 Tareas Críticas)

## 🎯 **OBJETIVO MVP SIMPLIFICADO**
**3 funcionalidades críticas ÚNICAMENTE**:
1. 🔄 **Sincronización Googl---

**Última actualización**: Agosto 26, 2025  
**Versión**: 3.0 - MVP Ultra Simplificado  
**Estado**: 🚧 URGENTE - Solo 3 tareas críticas  

**🎯 PRÓXIMA ACCIÓN INMEDIATA**: Completar webhook Google Calendarendar → BD** (eventos aparecen automáticamente)
2. 👥 **Vista Organizador** (ver eventos sincronizados + link formulario)
3. 📱 **Formulario Asistencia** (asistentes completan datos + validación cédula)

**META: 3 días para MVP funcional** ⚡

---

## � **TAREAS URGENTES (SOLO ESTAS 3)**

### **DÍA 1: Sincronización**
- [ ] `app/api/webhooks/google/calendar/route.ts` - Webhook funcional completo
- [ ] `lib/google/calendar.ts` - Funciones básicas de Google Calendar API
- [ ] `prisma/schema.prisma` - Agregar modelo Organizer + relaciones

### **DÍA 2: Vista Organizador**  
- [ ] `app/dashboard/eventos/page.tsx` - Lista de eventos con links
- [ ] `app/api/events/[id]/route.ts` - Endpoint obtener evento específico

### **DÍA 3: Formulario Asistencia**
- [ ] `app/eventos/[id]/page.tsx` - Formulario público completo
- [ ] `app/api/attendance/route.ts` - Registro asistencia con validaciones
- [ ] `lib/validations/cedula.ts` - Validación cédulas dominicanas

---

## 🎯 **DEMO MVP (3 minutos)**
1. **Ver evento** en dashboard organizador (viene de Google Calendar)
2. **Copiar link** del formulario de asistencia 
3. **Abrir formulario** en otra ventana/dispositivo
4. **Registrar asistencia** con datos válidos (cédula RD)
5. **Ver asistente** aparecer en dashboard del organizador

---

## ✅ **CRITERIO DE ÉXITO ÚNICO**
**El organizador puede crear evento en Google Calendar y recibir asistencias via formulario web el mismo día**

---

## 📊 **ESQUEMA BD MÍNIMO REQUERIDO**

### **Tabla Organizer (NUEVA)**
- googleUserId (string, único)
- email (string, único) 
- name (string)
- picture (string, opcional)

### **Tabla Event (EXISTENTE)**
- googleEventId (string, único)
- organizerEmail (string) → relación con Organizer.email
- título, fechas, ubicación básica

### **Tabla Checkin (EXISTENTE)** 
- eventId → relación con Event.id
- datos del asistente + cédula validada

---

## � **FUERA DEL MVP (NO HACER AHORA)**

- ❌ Reportes PDF/Excel
- ❌ Emails automáticos  
- ❌ Estadísticas con gráficos
- ❌ Sistema de roles/permisos
- ❌ PWA/offline
- ❌ Tests automatizados
- ❌ Jobs/tareas programadas
- ❌ Templates de email elaborados

---

## �️ **ARCHIVOS CRÍTICOS (SOLO ESTOS)**

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