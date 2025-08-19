# INSTRUCCIONES 02: Base de Datos y Modelos Prisma

## Objetivo
Configurar la base de datos PostgreSQL con Prisma ORM y crear todos los modelos necesarios para el sistema de registro de asistencias.

## Tareas a Ejecutar

### 1. Configuración Inicial de Prisma

```bash
# Inicializar Prisma
npx prisma init

# Generar cliente
npx prisma generate
```

### 2. Esquema de Base de Datos

Reemplazar el contenido de `prisma/schema.prisma`:

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organizer {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relaciones
  events    Event[]
  
  @@map("organizers")
}

model Event {
  id            String   @id @default(uuid())
  googleEventId String   @unique
  title         String
  description   String?
  location      String?
  startAt       DateTime
  endAt         DateTime
  formToken     String   @unique
  status        String   @default("active") // active, cancelled, completed
  organizerId   Int
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relaciones
  organizer     Organizer @relation(fields: [organizerId], references: [id], onDelete: Cascade)
  invitees      Invitee[]
  checkins      Checkin[]
  emailJobs     EmailJob[]
  
  @@map("events")
}

model Invitee {
  id        Int     @id @default(autoincrement())
  eventId   String
  email     String
  name      String?
  response  String? // accepted, declined, needsAction, tentative
  isResource Boolean @default(false) // para filtrar salas/recursos
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relaciones
  event     Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@unique([eventId, email])
  @@map("invitees")
}

model Checkin {
  id          Int      @id @default(autoincrement())
  eventId     String
  cedula      String
  nombre      String
  cargo       String?
  institucion String?
  correo      String?
  sexo        String?  // M, F, Otro
  telefono    String?
  ipAddress   String?  // para auditoría
  userAgent   String?  // para auditoría
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@unique([eventId, cedula])
  @@map("checkins")
}

model EmailJob {
  id          Int      @id @default(autoincrement())
  eventId     String
  kind        String   // created, pre_close, final
  scheduledAt DateTime
  sentAt      DateTime?
  status      String   @default("pending") // pending, sent, failed
  errorMsg    String?
  retryCount  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@map("email_jobs")
}

model AuditLog {
  id          Int      @id @default(autoincrement())
  action      String   // webhook_received, checkin_created, email_sent, etc.
  entityType  String   // event, checkin, email_job
  entityId    String?
  details     Json?    // datos adicionales en JSON
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  
  @@map("audit_logs")
}

model SystemConfig {
  id    Int    @id @default(autoincrement())
  key   String @unique
  value String
  description String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("system_config")
}
```

### 3. Cliente de Prisma

Crear `lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 4. Tipos TypeScript Personalizados

Crear `lib/types.ts`:

```typescript
import { Event, Organizer, Invitee, Checkin, EmailJob } from '@prisma/client'

// Tipos compuestos
export type EventWithRelations = Event & {
  organizer: Organizer
  invitees: Invitee[]
  checkins: Checkin[]
  emailJobs: EmailJob[]
}

export type EventWithCounts = Event & {
  organizer: Organizer
  _count: {
    invitees: number
    checkins: number
  }
}

// Tipos para formularios
export interface CheckinFormData {
  cedula: string
  nombre: string
  cargo?: string
  institucion?: string
  correo?: string
  sexo?: 'M' | 'F' | 'Otro'
  telefono?: string
}

export interface EventFormData {
  title: string
  description?: string
  location?: string
  startAt: Date
  endAt: Date
  organizerEmail: string
}

// Tipos para reportes
export interface FinalReport {
  event: {
    id: string
    title: string
    startAt: Date
    endAt: Date
    location?: string
  }
  organizer: {
    name?: string
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
    cargo?: string
    institucion?: string
    correo?: string
    telefono?: string
    createdAt: Date
  }>
  faltantes: Array<{
    email: string
    name?: string
    response?: string
  }>
}

// Tipos para Google Calendar
export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime: string
    timeZone?: string
  }
  end: {
    dateTime: string
    timeZone?: string
  }
  organizer: {
    email: string
    displayName?: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: string
    resource?: boolean
  }>
  status: string
}

// Tipos para Jobs
export interface JobPayload {
  eventId: string
  type: 'pre_close' | 'final'
}

// Tipos para validación de cédula dominicana
export interface CedulaValidation {
  isValid: boolean
  formatted?: string
  error?: string
}

// Enums
export enum EventStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export enum InviteeResponse {
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  NEEDS_ACTION = 'needsAction',
  TENTATIVE = 'tentative'
}

export enum EmailJobKind {
  CREATED = 'created',
  PRE_CLOSE = 'pre_close',
  FINAL = 'final'
}

export enum EmailJobStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed'
}

export enum Gender {
  MALE = 'M',
  FEMALE = 'F',
  OTHER = 'Otro'
}
```

### 5. Utilidades de Base de Datos

Crear `lib/utils/database.ts`:

```typescript
import { prisma } from '@/lib/db'
import { GoogleCalendarEvent, EventWithRelations } from '@/lib/types'

export class DatabaseService {
  // Organizers
  static async upsertOrganizer(email: string, name?: string) {
    return await prisma.organizer.upsert({
      where: { email },
      update: { name },
      create: { email, name }
    })
  }

  // Events
  static async upsertEventFromGoogle(
    googleEvent: GoogleCalendarEvent,
    organizerId: number
  ) {
    const existingEvent = await prisma.event.findUnique({
      where: { googleEventId: googleEvent.id }
    })

    const eventData = {
      title: googleEvent.summary,
      description: googleEvent.description,
      location: googleEvent.location,
      startAt: new Date(googleEvent.start.dateTime),
      endAt: new Date(googleEvent.end.dateTime),
      status: googleEvent.status === 'cancelled' ? 'cancelled' : 'active',
      organizerId
    }

    if (existingEvent) {
      return await prisma.event.update({
        where: { id: existingEvent.id },
        data: eventData
      })
    } else {
      return await prisma.event.create({
        data: {
          ...eventData,
          googleEventId: googleEvent.id,
          formToken: '' // Se actualizará después de generar el token
        }
      })
    }
  }

  // Invitees
  static async upsertInvitees(eventId: string, attendees: GoogleCalendarEvent['attendees']) {
    if (!attendees) return

    // Borrar invitados existentes
    await prisma.invitee.deleteMany({
      where: { eventId }
    })

    // Crear nuevos invitados
    const inviteesToCreate = attendees
      .filter(attendee => !attendee.resource) // Filtrar recursos/salas
      .map(attendee => ({
        eventId,
        email: attendee.email,
        name: attendee.displayName,
        response: attendee.responseStatus,
        isResource: attendee.resource || false
      }))

    if (inviteesToCreate.length > 0) {
      await prisma.invitee.createMany({
        data: inviteesToCreate,
        skipDuplicates: true
      })
    }
  }

  // Checkins
  static async createCheckin(eventId: string, data: any, auditData?: any) {
    return await prisma.checkin.create({
      data: {
        eventId,
        ...data,
        ipAddress: auditData?.ipAddress,
        userAgent: auditData?.userAgent
      }
    })
  }

  // Email Jobs
  static async scheduleEmailJob(
    eventId: string,
    kind: string,
    scheduledAt: Date
  ) {
    return await prisma.emailJob.create({
      data: {
        eventId,
        kind,
        scheduledAt
      }
    })
  }

  // Audit Logs
  static async createAuditLog(
    action: string,
    entityType: string,
    entityId?: string,
    details?: any,
    auditData?: any
  ) {
    return await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        details,
        ipAddress: auditData?.ipAddress,
        userAgent: auditData?.userAgent
      }
    })
  }

  // Consultas complejas
  static async getEventWithRelations(eventId: string): Promise<EventWithRelations | null> {
    return await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: true,
        invitees: true,
        checkins: true,
        emailJobs: true
      }
    })
  }

  static async getEventByToken(formToken: string) {
    return await prisma.event.findUnique({
      where: { formToken },
      include: {
        organizer: true
      }
    })
  }

  static async getEventsWithCounts(organizerEmail?: string) {
    const whereClause = organizerEmail 
      ? { organizer: { email: organizerEmail } }
      : {}

    return await prisma.event.findMany({
      where: whereClause,
      include: {
        organizer: true,
        _count: {
          select: {
            invitees: true,
            checkins: true
          }
        }
      },
      orderBy: { startAt: 'desc' }
    })
  }
}
```

### 6. Migraciones

```bash
# Crear y ejecutar primera migración
npx prisma migrate dev --name init

# Generar cliente actualizado
npx prisma generate
```

### 7. Seeds (datos iniciales)

Crear `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Crear configuraciones del sistema
  await prisma.systemConfig.upsert({
    where: { key: 'email_template_footer' },
    update: {},
    create: {
      key: 'email_template_footer',
      value: 'Instituto Nacional de Aguas Potables y Alcantarillados (INAPA)',
      description: 'Pie de página para plantillas de email'
    }
  })

  await prisma.systemConfig.upsert({
    where: { key: 'app_name' },
    update: {},
    create: {
      key: 'app_name',
      value: 'Sistema de Registro de Asistencias - INAPA',
      description: 'Nombre de la aplicación'
    }
  })

  await prisma.systemConfig.upsert({
    where: { key: 'max_checkins_per_event' },
    update: {},
    create: {
      key: 'max_checkins_per_event',
      value: '500',
      description: 'Número máximo de registros por evento'
    }
  })

  console.log('Seed completado')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
```

Añadir script en `package.json`:

```json
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "npx prisma migrate reset",
    "db:push": "npx prisma db push",
    "db:studio": "npx prisma studio"
  }
}
```

### 8. Ejecutar Seeds

```bash
# Instalar tsx para ejecutar TypeScript
npm install -D tsx

# Ejecutar seeds
npm run db:seed
```

## Entregables

✅ Esquema de Prisma configurado con todos los modelos  
✅ Cliente de Prisma configurado  
✅ Tipos TypeScript personalizados definidos  
✅ Servicios de base de datos implementados  
✅ Migraciones ejecutadas  
✅ Seeds con datos iniciales  

## Comandos Útiles

```bash
# Ver base de datos en navegador
npm run db:studio

# Resetear base de datos
npm run db:reset

# Aplicar cambios sin migración
npm run db:push

# Generar cliente después de cambios
npx prisma generate
```

## Siguiente Paso
Continuar con **INSTRUCCIONES_03_INTEGRACION_GOOGLE.md** para configurar las APIs de Google Calendar y Gmail.
