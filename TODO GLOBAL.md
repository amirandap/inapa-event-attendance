# 📋 TODO - Tareas Pendientes

## 🔴 **CRÍTICO PARA PRODUCCIÓN** (15-20 días estimados)

### 📧 Sistema de Correos
- [ ] **Gmail Service Real**: Implementar `lib/google/gmail.ts` con envío real (no simulado)
- [ ] **Templates Profesionales**: Crear templates responsive con `react-email`
  - [ ] Template inicial con QR (`lib/email/templates/initial.tsx`)
  - [ ] Template pre-cierre (`lib/email/templates/preClose.tsx`)  
  - [ ] Template final (`lib/email/templates/final.tsx`)
- [ ] **Sistema de Jobs**: Integrar Upstash QStash para emails programados
- [ ] **Adjuntos**: Soporte para PDFs y Excel en emails

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