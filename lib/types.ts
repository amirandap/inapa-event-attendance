// Tipos básicos de Prisma (se importarán después de generar el cliente)
export interface EventType {
  id: string
  googleEventId: string
  title: string
  description?: string | null
  location?: string | null
  startAt: Date
  endAt: Date
  formToken: string
  status: string
  organizerId: number
  createdAt: Date
  updatedAt: Date
}

export interface OrganizerType {
  id: number
  email: string
  name?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface InviteeType {
  id: number
  eventId: string
  email: string
  name?: string | null
  response?: string | null
  isResource: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CheckinType {
  id: number
  eventId: string
  cedula: string
  nombre: string
  cargo?: string | null
  institucion?: string | null
  correo?: string | null
  sexo?: string | null
  telefono?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface EmailJobType {
  id: number
  eventId: string
  kind: string
  scheduledAt: Date
  sentAt?: Date | null
  status: string
  errorMsg?: string | null
  retryCount: number
  createdAt: Date
  updatedAt: Date
}

// Tipos compuestos
export type EventWithRelations = EventType & {
  organizer: OrganizerType
  invitees: InviteeType[]
  checkins: CheckinType[]
  emailJobs: EmailJobType[]
}

export type EventWithCounts = EventType & {
  organizer: OrganizerType
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
