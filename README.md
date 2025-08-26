# Sistema de Registro Digital de Asistencias - INAPA

Sistema web para el registro automático de asistencias en reuniones del Instituto Nacional de Aguas Potables y Alcantarillados (INAPA) de República Dominicana.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes + Prisma ORM
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **Integraciones**: Google Calendar API + Gmail API
- **Jobs**: Upstash QStash
- **Reportes**: @react-pdf/renderer + exceljs
- **Autenticación**: JWT + Tokens de formulario

## 🏗️ Estado del Proyecto

### ✅ Completado (Fase 4 - Componentes UI)
- [x] Proyecto Next.js 14 inicializado
- [x] TypeScript configurado
- [x] Tailwind CSS + shadcn/ui configurado
- [x] Estructura de directorios creada
- [x] Variables de entorno configuradas
- [x] Base de datos SQLite para desarrollo
- [x] Dependencias instaladas
- [x] Prisma ORM configurado
- [x] Esquemas de base de datos creados (7 modelos)
- [x] Migraciones iniciales ejecutadas
- [x] Seeds de datos iniciales
- [x] Servicios de base de datos implementados
- [x] Tipos TypeScript personalizados
- [x] Layouts público y dashboard
- [x] Componentes de dashboard (sidebar, header)
- [x] Formulario de asistencia completo
- [x] Componentes de eventos
- [x] Validaciones y utilidades
- [x] Interfaz responsive y accesible

### 🔧 En Progreso
- [ ] Endpoints de API REST
- [ ] Integración con Google APIs
- [ ] Sistema de generación de reportes
- [ ] Jobs automáticos y notificaciones

## 🤝 Contribución

Lee nuestra [Guía de Contribución](./CONTRIBUTING.md) para entender cómo participar en el desarrollo del proyecto.

## 📋 Roadmap

Consulta nuestro [TODO.md](./TODO.md) para ver las tareas pendientes y el roadmap del proyecto.

## 📚 Documentación

```
├── app/                          # Next.js App Router
│   ├── (public)/                 # Rutas públicas
│   ├── a/[token]/               # Formularios de asistencia
│   ├── dashboard/               # Panel administrativo
│   ├── eventos/[id]/            # Detalles de eventos
│   └── api/                     # API endpoints
├── components/                   # Componentes React
│   ├── ui/                      # shadcn/ui components
│   ├── forms/                   # Formularios
│   ├── events/                  # Componentes de eventos
│   └── dashboard/               # Componentes del dashboard
├── lib/                         # Utilidades y servicios
│   ├── google/                  # Google APIs
│   ├── pdf/                     # Generación PDF
│   ├── excel/                   # Generación Excel
│   ├── qr/                      # Códigos QR
│   ├── jobs/                    # Sistema de jobs
│   └── email/                   # Templates de email
└── prisma/                      # Base de datos y migraciones
```

## 🛠️ Desarrollo

### Requisitos
- Node.js 18+
- npm

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/amirandap/inapa-event-attendance.git
cd inapa-event-attendance

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con las configuraciones necesarias

# Ejecutar en modo desarrollo
npm run dev
```

### Comandos Útiles

```bash
# Desarrollo
npm run dev                    # Servidor de desarrollo
npm run build                  # Build de producción
npm run start                  # Servidor de producción

# Base de Datos
npm run db:studio             # Interfaz visual de BD
npm run db:push               # Aplicar cambios sin migración
npm run db:reset              # Resetear BD completamente
npm run db:seed               # Ejecutar seeds

# Linting
npm run lint                  # ESLint
```

## � Documentación

Para instrucciones detalladas de desarrollo, configuración y APIs, consulta la documentación organizada en:

**[📖 Documentación Completa](./docs/README.md)**

### Inicio Rápido
- [Configuración Inicial](./docs/setup/01-configuracion-inicial.md)
- [Base de Datos](./docs/setup/02-base-datos-prisma.md)
- [Integración Google](./docs/setup/03-integracion-google.md)

### Para Desarrolladores
- [Documentación de Desarrollo](./docs/development/documentacion-desarrollo.md)
- [APIs y Endpoints](./docs/api/05-apis-endpoints.md)
- [UI y Componentes](./docs/development/04-ui-componentes.md)

## 🎯 Funcionalidades Principales

### Para Organizadores
- Recepción automática de invitaciones de calendario
- Generación automática de QR y formularios de asistencia
- Reportes en tiempo real de asistencias
- Notificaciones antes del cierre del evento
- Reportes finales en PDF y Excel

### Para Participantes
- Registro rápido mediante formulario web o QR
- Validación de cédula dominicana
- Confirmación inmediata de registro

### Automatizaciones
- Sincronización con Google Calendar
- Envío automático de reportes
- Generación de códigos QR
- Notificaciones programadas

## 🌐 Páginas Disponibles

### Páginas Públicas
- **`/`** - Página principal con estado del proyecto
- **`/a/[token]`** - Formulario de registro de asistencia

### Dashboard Administrativo
- **`/dashboard`** - Panel principal con estadísticas
- **`/dashboard/eventos`** - Gestión de eventos (pendiente)
- **`/dashboard/asistencias`** - Reportes de asistencias (pendiente)
- **`/dashboard/reportes`** - Generación de reportes (pendiente)

### Herramientas de Desarrollo
- **Prisma Studio:** http://localhost:5556 - Interfaz de base de datos
- **Dev Server:** http://localhost:3000 - Servidor de desarrollo

## 🔧 Configuración de Producción

### Base de Datos
```bash
# Migrar de SQLite a PostgreSQL
# 1. Configurar PostgreSQL
# 2. Actualizar DATABASE_URL en .env
# 3. Ejecutar migraciones
npm run db:push
```

### Variables de Entorno de Producción
```env
DATABASE_URL="postgresql://..."
GOOGLE_PROJECT_ID="proyecto-inapa"
GOOGLE_CLIENT_EMAIL="..."
GOOGLE_PRIVATE_KEY="..."
QSTASH_CURRENT_SIGNING_KEY="..."
# Ver .env.local para lista completa
```

## 📝 Licencia

Proyecto propietario del Instituto Nacional de Aguas Potables y Alcantarillados (INAPA) - República Dominicana.

## 🤝 Contribución

Este es un proyecto interno de INAPA. Para contribuciones o modificaciones, contactar al equipo de desarrollo de INAPA.

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema, contactar:
- Email: minutas@inapa.gob.do
- Departamento de TI - INAPA
