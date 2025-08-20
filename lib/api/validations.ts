import { z } from 'zod'
import { validateCedula } from '@/lib/utils/validation'

// Validación personalizada de cédula dominicana
const cedulaSchema = z.string().refine(
  (value) => validateCedula(value),
  {
    message: 'Cédula dominicana inválida'
  }
)

// Schemas para Eventos
export const createEventSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'El título es muy largo'),
  description: z.string().optional(),
  location: z.string().min(1, 'La ubicación es requerida').max(200, 'La ubicación es muy larga'),
  startAt: z.string().refine((date) => !isNaN(Date.parse(date)), 'Fecha de inicio inválida'),
  endAt: z.string().refine((date) => !isNaN(Date.parse(date)), 'Fecha de fin inválida'),
  organizerId: z.number().int().positive('ID de organizador inválido'),
  googleEventId: z.string().optional()
}).refine(
  (data) => new Date(data.startAt) < new Date(data.endAt),
  {
    message: 'La fecha de inicio debe ser anterior a la fecha de fin',
    path: ['endAt']
  }
)

export const updateEventSchema = createEventSchema.partial().extend({
  id: z.string().uuid('ID de evento inválido')
})

export const eventStatusSchema = z.object({
  id: z.string().uuid('ID de evento inválido'),
  status: z.enum(['active', 'cancelled', 'completed'], {
    message: 'Estado de evento inválido'
  })
})

// Schemas para Check-ins
export const createCheckinSchema = z.object({
  eventId: z.string().uuid('ID de evento inválido'),
  cedula: cedulaSchema,
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  cargo: z.string().max(100, 'El cargo es muy largo').optional(),
  institucion: z.string().max(100, 'La institución es muy larga').optional(),
  correo: z.string().email('Email inválido').optional().or(z.literal('')),
  sexo: z.enum(['M', 'F', 'Otro'], {
    message: 'Sexo debe ser M, F o Otro'
  }).optional(),
  telefono: z.string().max(20, 'El teléfono es muy largo').optional()
})

export const getCheckinSchema = z.object({
  eventId: z.string().uuid('ID de evento inválido').optional(),
  cedula: cedulaSchema.optional(),
  page: z.number().int().positive('Página debe ser un número positivo').optional(),
  limit: z.number().int().positive('Límite debe ser un número positivo').max(100, 'Límite máximo es 100').optional()
})

// Schemas para Invitados
export const createInviteeSchema = z.object({
  eventId: z.string().uuid('ID de evento inválido'),
  cedula: cedulaSchema,
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  email: z.string().email('Email inválido'),
  cargo: z.string().max(100, 'El cargo es muy largo').optional(),
  institucion: z.string().max(100, 'La institución es muy larga').optional(),
  sexo: z.enum(['M', 'F', 'Otro'], {
    message: 'Sexo debe ser M, F o Otro'
  }).optional(),
  telefono: z.string().max(20, 'El teléfono es muy largo').optional()
})

export const updateInviteeResponseSchema = z.object({
  id: z.number().int().positive('ID de invitado inválido'),
  response: z.enum(['accepted', 'declined', 'needsAction', 'tentative'], {
    message: 'Respuesta de invitación inválida'
  })
})

export const bulkInviteSchema = z.object({
  eventId: z.string().uuid('ID de evento inválido'),
  invitees: z.array(z.object({
    cedula: cedulaSchema,
    nombre: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
    email: z.string().email('Email inválido'),
    cargo: z.string().max(100, 'El cargo es muy largo').optional(),
    institucion: z.string().max(100, 'La institución es muy larga').optional(),
    sexo: z.enum(['M', 'F', 'Otro']).optional(),
    telefono: z.string().max(20, 'El teléfono es muy largo').optional()
  })).min(1, 'Debe incluir al menos un invitado').max(100, 'Máximo 100 invitados por lote')
})

// Schemas para Organizadores
export const createOrganizerSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo')
})

export const updateOrganizerSchema = createOrganizerSchema.partial().extend({
  id: z.number().int().positive('ID de organizador inválido')
})

// Schemas para Estadísticas y Reportes
export const statsQuerySchema = z.object({
  eventId: z.string().uuid('ID de evento inválido').optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Fecha de inicio inválida').optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Fecha de fin inválida').optional(),
  organizerId: z.number().int().positive('ID de organizador inválido').optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate)
    }
    return true
  },
  {
    message: 'La fecha de inicio debe ser anterior o igual a la fecha de fin',
    path: ['endDate']
  }
)

export const reportQuerySchema = z.object({
  eventId: z.string().uuid('ID de evento inválido').optional(),
  format: z.enum(['pdf', 'excel', 'csv'], {
    message: 'Formato de reporte inválido'
  }).default('pdf'),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Fecha de inicio inválida').optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Fecha de fin inválida').optional(),
  includeStats: z.boolean().default(true)
})

// Schemas para Configuración del Sistema
export const updateConfigSchema = z.object({
  key: z.string().min(1, 'La clave es requerida'),
  value: z.string().min(1, 'El valor es requerido'),
  description: z.string().optional()
})

// Schemas para Jobs de Email
export const createEmailJobSchema = z.object({
  eventId: z.string().uuid('ID de evento inválido'),
  kind: z.enum(['created', 'pre_close', 'final'], {
    message: 'Tipo de job de email inválido'
  }),
  scheduledAt: z.string().refine((date) => !isNaN(Date.parse(date)), 'Fecha de programación inválida')
})

// Schemas para Logs de Auditoría
export const auditLogSchema = z.object({
  action: z.string().min(1, 'La acción es requerida'),
  entityType: z.string().min(1, 'El tipo de entidad es requerido'),
  entityId: z.string().optional(),
  details: z.any().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
})

// Schema para paginación
export const paginationSchema = z.object({
  page: z.number().int().positive('Página debe ser un número positivo').default(1),
  limit: z.number().int().positive('Límite debe ser un número positivo').max(100, 'Límite máximo es 100').default(10),
  orderBy: z.string().optional(),
  orderDirection: z.enum(['asc', 'desc']).default('desc')
})

// Schema para filtros de búsqueda
export const searchSchema = z.object({
  q: z.string().min(1, 'Término de búsqueda es requerido').optional(),
  status: z.string().optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Fecha de inicio inválida').optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Fecha de fin inválida').optional()
})

// Tipos inferidos
export type CreateEventData = z.infer<typeof createEventSchema>
export type UpdateEventData = z.infer<typeof updateEventSchema>
export type CreateCheckinData = z.infer<typeof createCheckinSchema>
export type CreateInviteeData = z.infer<typeof createInviteeSchema>
export type CreateOrganizerData = z.infer<typeof createOrganizerSchema>
export type StatsQueryData = z.infer<typeof statsQuerySchema>
export type ReportQueryData = z.infer<typeof reportQuerySchema>
export type PaginationData = z.infer<typeof paginationSchema>
export type SearchData = z.infer<typeof searchSchema>
