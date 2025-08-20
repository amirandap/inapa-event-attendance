# Sistema de Asistencia a Eventos INAPA

## Descripción

Sistema completo de gestión de asistencia a eventos para el Instituto Nacional de Aguas Potables y Alcantarillados (INAPA). Incluye dashboard administrativo, formularios públicos de registro, y generación de reportes.

## Características Principales

### Dashboard Administrativo
- ✅ Gestión completa de eventos (CRUD)
- ✅ Gestión de organizadores
- ✅ Lista de invitados por evento
- ✅ Registro y seguimiento de asistencias
- ✅ Panel de estadísticas y métricas
- ✅ Generación de reportes (PDF, Excel, CSV)

### Formulario Público
- ✅ Registro de asistencia con validación de cédula
- ✅ Acceso mediante token único por evento
- ✅ Validación en tiempo real
- ✅ Confirmación de registro

### API REST Completa
- ✅ `/api/events` - Gestión de eventos
- ✅ `/api/organizers` - Gestión de organizadores
- ✅ `/api/invitees` - Gestión de invitados
- ✅ `/api/checkins` - Registro de asistencias
- ✅ `/api/attendance/[token]` - Acceso público a eventos
- ✅ `/api/stats` - Estadísticas y métricas
- ✅ `/api/reports` - Generación de reportes

## Tecnologías Utilizadas

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: SQLite (desarrollo), PostgreSQL (producción)
- **Validación**: Zod
- **UI Components**: Componentes personalizados con Tailwind

## Estructura del Proyecto

```
/
├── app/
│   ├── page.tsx                    # Dashboard principal
│   ├── events/                     # Páginas de eventos
│   ├── attendance/                 # Formulario público
│   └── api/                        # API endpoints
│       ├── events/
│       ├── organizers/
│       ├── invitees/
│       ├── checkins/
│       ├── attendance/
│       ├── stats/
│       └── reports/
├── components/                     # Componentes reutilizables
│   ├── dashboard/
│   ├── events/
│   ├── forms/
│   └── ui/
├── lib/
│   ├── api/                        # Utilidades de API
│   ├── middleware/                 # Middlewares
│   └── prisma.ts                   # Cliente Prisma
├── prisma/
│   ├── schema.prisma              # Esquema de base de datos
│   └── seed.ts                    # Datos de prueba
└── public/                        # Archivos estáticos
```

## Base de Datos

### Modelo de Datos

```prisma
model Event {
  id          String   @id @default(cuid())
  title       String
  description String?
  location    String
  startAt     DateTime
  endAt       DateTime
  formToken   String   @unique
  status      String   @default("active")
  organizerId Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  organizer   Organizer @relation(fields: [organizerId], references: [id])
  invitees    Invitee[]
  checkins    Checkin[]
}

model Organizer {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  events Event[]
}

model Invitee {
  id          String   @id @default(cuid())
  eventId     String
  cedula      String
  nombre      String
  email       String
  cargo       String?
  institucion String?
  sexo        String?
  telefono    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  event    Event     @relation(fields: [eventId], references: [id])
  checkins Checkin[]
  
  @@unique([eventId, cedula])
}

model Checkin {
  id          String   @id @default(cuid())
  eventId     String
  inviteeId   String?
  cedula      String
  nombre      String
  cargo       String?
  institucion String?
  correo      String?
  sexo        String?
  telefono    String?
  createdAt   DateTime @default(now())
  
  event   Event    @relation(fields: [eventId], references: [id])
  invitee Invitee? @relation(fields: [inviteeId], references: [id])
}
```

## APIs Disponibles

### Eventos (`/api/events`)
- `GET` - Listar eventos con filtros y paginación
- `POST` - Crear nuevo evento
- `PUT /:id` - Actualizar evento
- `DELETE /:id` - Eliminar evento

### Organizadores (`/api/organizers`)
- `GET` - Listar organizadores
- `POST` - Crear organizador
- `PUT /:id` - Actualizar organizador
- `DELETE /:id` - Eliminar organizador

### Invitados (`/api/invitees`)
- `GET` - Listar invitados con filtros
- `POST` - Agregar invitado
- `PUT /:id` - Actualizar invitado
- `DELETE /:id` - Eliminar invitado

### Asistencias (`/api/checkins`)
- `GET` - Listar registros de asistencia
- `POST` - Registrar asistencia

### Acceso Público (`/api/attendance/:token`)
- `GET` - Obtener información del evento por token

### Estadísticas (`/api/stats`)
- `GET` - Métricas del dashboard

### Reportes (`/api/reports`)
- `GET` - Generar reportes con filtros
  - `?type=attendance&eventId=xxx` - Reporte de asistencia por evento
  - `?type=events&startDate=xxx&endDate=xxx` - Reporte de eventos por período
  - `?type=statistics` - Reporte de estadísticas generales

## Instalación y Configuración

```bash
# Instalar dependencias
npm install

# Configurar base de datos
npx prisma generate
npx prisma db push

# Poblar con datos de prueba
npx prisma db seed

# Ejecutar en desarrollo
npm run dev
```

## Variables de Entorno

```env
DATABASE_URL="file:./dev.db"
ADMIN_TOKEN="admin-token-123"
```

## Próximas Mejoras

- [ ] Autenticación JWT completa
- [ ] Exportación de reportes en PDF/Excel
- [ ] Notificaciones por email
- [ ] Integración con sistemas externos
- [ ] Dashboard de métricas avanzadas
- [ ] Gestión de permisos granular

## Estado del Desarrollo

✅ **Completado**: APIs REST completas, Dashboard administrativo, Formulario público
🔄 **En progreso**: Sistema de autenticación, Exportación de reportes
📋 **Pendiente**: Notificaciones, Integración con sistemas externos
