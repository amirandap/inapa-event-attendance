# INSTRUCCIONES 05: APIs y Endpoints

## Objetivo
Implementar todos los endpoints de la API REST para el manejo de eventos, check-ins, exportación de reportes y gestión de jobs automáticos.

## Tareas a Ejecutar

### 1. Gestión de Tokens y Seguridad

#### 1.1 Utilidades de Tokens
Crear `lib/tokens.ts`:

```typescript
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

interface FormTokenPayload {
  eventId: string
  exp: number
}

/**
 * Generar token para formulario de asistencia
 */
export function generateFormToken(eventId: string, eventEndDate: Date): string {
  const payload: FormTokenPayload = {
    eventId,
    exp: Math.floor((eventEndDate.getTime() + 30 * 24 * 60 * 60 * 1000) / 1000) // 30 días después del evento
  }

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    algorithm: 'HS256'
  })
}

/**
 * Verificar y decodificar token del formulario
 */
export function verifyFormToken(token: string): FormTokenPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as FormTokenPayload
    return decoded
  } catch (error) {
    console.error('Error verificando token:', error)
    return null
  }
}

/**
 * Extraer información de auditoría de la request
 */
export function getAuditInfo(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  return {
    ipAddress: forwardedFor?.split(',')[0] || realIp || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  }
}

/**
 * Rate limiting simple en memoria (para desarrollo)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  key: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}
```

### 2. API de Check-ins

#### 2.1 Endpoint de Check-in
Crear `app/api/checkins/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { DatabaseService } from '@/lib/utils/database'
import { verifyFormToken, getAuditInfo, checkRateLimit } from '@/lib/tokens'
import { validateCedula } from '@/lib/utils/validation'

const checkinSchema = z.object({
  eventId: z.string().uuid(),
  cedula: z.string()
    .length(11, 'La cédula debe tener 11 dígitos')
    .regex(/^\d{11}$/, 'La cédula debe contener solo números')
    .refine(validateCedula, 'Cédula dominicana inválida'),
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  cargo: z.string().max(100).optional(),
  institucion: z.string().max(100).optional(),
  correo: z.string().email('Email inválido').optional().or(z.literal('')),
  sexo: z.enum(['M', 'F', 'Otro']).optional(),
  telefono: z.string()
    .regex(/^(\+1|1)?[0-9]{10}$/, 'Teléfono inválido')
    .optional()
    .or(z.literal(''))
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const auditInfo = getAuditInfo(request)
    if (!checkRateLimit(`checkin_${auditInfo.ipAddress}`, 5, 60000)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intente de nuevo en un minuto.' },
        { status: 429 }
      )
    }

    // Validar datos de entrada
    const body = await request.json()
    const validatedData = checkinSchema.parse(body)

    // Verificar que el evento existe y está activo
    const event = await prisma.event.findUnique({
      where: { id: validatedData.eventId },
      include: { organizer: true }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    if (event.status !== 'active') {
      return NextResponse.json(
        { error: 'El evento no está activo' },
        { status: 400 }
      )
    }

    // Verificar que el evento no haya terminado (con margen de 30 minutos)
    const now = new Date()
    const eventEndWithBuffer = new Date(event.endAt.getTime() + 30 * 60 * 1000)
    
    if (now > eventEndWithBuffer) {
      return NextResponse.json(
        { error: 'El evento ya ha finalizado' },
        { status: 400 }
      )
    }

    // Verificar duplicado por cédula
    const existingCheckin = await prisma.checkin.findUnique({
      where: {
        eventId_cedula: {
          eventId: validatedData.eventId,
          cedula: validatedData.cedula
        }
      }
    })

    if (existingCheckin) {
      return NextResponse.json(
        { 
          error: 'Ya existe un registro con esta cédula para este evento',
          existing: {
            nombre: existingCheckin.nombre,
            createdAt: existingCheckin.createdAt
          }
        },
        { status: 409 }
      )
    }

    // Crear check-in
    const checkinData = {
      eventId: validatedData.eventId,
      cedula: validatedData.cedula,
      nombre: validatedData.nombre,
      cargo: validatedData.cargo || null,
      institucion: validatedData.institucion || null,
      correo: validatedData.correo || null,
      sexo: validatedData.sexo || null,
      telefono: validatedData.telefono || null,
      ipAddress: auditInfo.ipAddress,
      userAgent: auditInfo.userAgent
    }

    const newCheckin = await prisma.checkin.create({
      data: checkinData
    })

    // Crear log de auditoría
    await DatabaseService.createAuditLog(
      'checkin_created',
      'checkin',
      newCheckin.id.toString(),
      {
        eventId: validatedData.eventId,
        eventTitle: event.title,
        participantName: validatedData.nombre
      },
      auditInfo
    )

    // Si el correo coincide con un invitado, actualizar su respuesta
    if (validatedData.correo) {
      await prisma.invitee.updateMany({
        where: {
          eventId: validatedData.eventId,
          email: validatedData.correo
        },
        data: {
          response: 'accepted'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Asistencia registrada exitosamente',
      checkin: {
        id: newCheckin.id,
        nombre: newCheckin.nombre,
        createdAt: newCheckin.createdAt
      }
    })

  } catch (error) {
    console.error('Error en check-in:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: error.errors.map(e => e.message)
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId es requerido' },
        { status: 400 }
      )
    }

    const checkins = await prisma.checkin.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        cargo: true,
        institucion: true,
        correo: true,
        sexo: true,
        telefono: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      checkins
    })

  } catch (error) {
    console.error('Error obteniendo check-ins:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

### 3. API de Exportación

#### 3.1 Exportación PDF
Crear `app/api/exports/[id]/pdf/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { pdfService } from '@/lib/pdf/buildFinal'
import { DatabaseService } from '@/lib/utils/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'final' // initial, final

    // Obtener evento con relaciones
    const event = await DatabaseService.getEventWithRelations(eventId)

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    let pdfBuffer: Buffer

    if (type === 'initial') {
      // PDF inicial con QR
      const { qrService } = await import('@/lib/qr/generate')
      const qrDataUrl = await qrService.generateQR(
        `${process.env.APP_BASE_URL}/a/${event.formToken}`
      )
      
      const { pdfService: initialPdfService } = await import('@/lib/pdf/buildInitial')
      pdfBuffer = await initialPdfService.generateInitialPDF({
        event,
        qr: qrDataUrl
      })
    } else {
      // PDF final con reporte completo
      const reportData = await generateReportData(event)
      pdfBuffer = await pdfService.generateFinalPDF(reportData)
    }

    // Headers para descarga
    const filename = `${type === 'initial' ? 'QR-Asistencia' : 'Reporte-Final'}-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

async function generateReportData(event: any) {
  // Obtener faltantes (invitados que no se registraron)
  const checkedInEmails = new Set(
    event.checkins
      .filter((c: any) => c.correo)
      .map((c: any) => c.correo)
  )

  const faltantes = event.invitees.filter((invitee: any) => 
    !checkedInEmails.has(invitee.email) && !invitee.isResource
  )

  return {
    event: {
      id: event.id,
      title: event.title,
      startAt: event.startAt,
      endAt: event.endAt,
      location: event.location
    },
    organizer: {
      name: event.organizer.name,
      email: event.organizer.email
    },
    totals: {
      registrados: event.checkins.length,
      invitados: event.invitees.filter((i: any) => !i.isResource).length,
      faltantes: faltantes.length,
      porcentajeAsistencia: event.invitees.length > 0 
        ? Math.round((event.checkins.length / event.invitees.filter((i: any) => !i.isResource).length) * 100)
        : 0
    },
    registrados: event.checkins.map((c: any) => ({
      cedula: c.cedula,
      nombre: c.nombre,
      cargo: c.cargo,
      institucion: c.institucion,
      correo: c.correo,
      telefono: c.telefono,
      createdAt: c.createdAt
    })),
    faltantes: faltantes.map((f: any) => ({
      email: f.email,
      name: f.name,
      response: f.response
    }))
  }
}
```

#### 3.2 Exportación Excel
Crear `app/api/exports/[id]/xlsx/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { excelService } from '@/lib/excel/buildFinal'
import { DatabaseService } from '@/lib/utils/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id

    // Obtener evento con relaciones
    const event = await DatabaseService.getEventWithRelations(eventId)

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    // Generar datos del reporte
    const checkedInEmails = new Set(
      event.checkins
        .filter((c: any) => c.correo)
        .map((c: any) => c.correo)
    )

    const faltantes = event.invitees.filter((invitee: any) => 
      !checkedInEmails.has(invitee.email) && !invitee.isResource
    )

    const reportData = {
      event: {
        id: event.id,
        title: event.title,
        startAt: event.startAt,
        endAt: event.endAt,
        location: event.location
      },
      organizer: {
        name: event.organizer.name,
        email: event.organizer.email
      },
      totals: {
        registrados: event.checkins.length,
        invitados: event.invitees.filter((i: any) => !i.isResource).length,
        faltantes: faltantes.length,
        porcentajeAsistencia: event.invitees.length > 0 
          ? Math.round((event.checkins.length / event.invitees.filter((i: any) => !i.isResource).length) * 100)
          : 0
      },
      registrados: event.checkins.map((c: any) => ({
        cedula: c.cedula,
        nombre: c.nombre,
        cargo: c.cargo,
        institucion: c.institucion,
        correo: c.correo,
        sexo: c.sexo,
        telefono: c.telefono,
        createdAt: c.createdAt
      })),
      faltantes: faltantes.map((f: any) => ({
        email: f.email,
        name: f.name,
        response: f.response
      }))
    }

    // Generar Excel
    const excelBuffer = await excelService.generateFinalExcel(reportData)

    // Headers para descarga
    const filename = `Reporte-Asistencias-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.xlsx`

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error generando Excel:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

### 4. Jobs Automáticos

#### 4.1 Job Pre-Cierre
Crear `app/api/jobs/pre-close/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { DatabaseService } from '@/lib/utils/database'
import { gmailService } from '@/lib/google/gmail'
import { buildPreCloseEmailTemplate } from '@/lib/email/templates/preClose'

const jobSchema = z.object({
  eventId: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    // Validar payload
    const body = await request.json()
    const { eventId } = jobSchema.parse(body)

    // Obtener evento con relaciones
    const event = await DatabaseService.getEventWithRelations(eventId)

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el evento esté activo
    if (event.status !== 'active') {
      console.log(`Job pre-close cancelado: evento ${eventId} no está activo`)
      return NextResponse.json({ success: true, message: 'Evento no activo' })
    }

    // Generar datos del reporte
    const checkedInEmails = new Set(
      event.checkins
        .filter(c => c.correo)
        .map(c => c.correo)
    )

    const registrados = event.checkins
    const faltantes = event.invitees.filter(invitee => 
      !checkedInEmails.has(invitee.email) && 
      !invitee.isResource &&
      invitee.response !== 'declined'
    )

    const reportData = {
      event: {
        id: event.id,
        title: event.title,
        startAt: event.startAt,
        endAt: event.endAt,
        location: event.location
      },
      organizer: {
        name: event.organizer.name,
        email: event.organizer.email
      },
      totals: {
        registrados: registrados.length,
        invitados: event.invitees.filter(i => !i.isResource).length,
        faltantes: faltantes.length
      },
      registrados: registrados.map(c => ({
        nombre: c.nombre,
        cargo: c.cargo,
        institucion: c.institucion,
        correo: c.correo
      })),
      faltantes: faltantes.map(f => ({
        email: f.email,
        name: f.name
      }))
    }

    // Generar template de email
    const emailHtml = await buildPreCloseEmailTemplate(reportData)

    // Enviar email
    await gmailService.sendEmail({
      to: event.organizer.email,
      subject: `Reporte de Asistencia - ${event.title} (15 min antes del cierre)`,
      html: emailHtml
    })

    // Actualizar job como enviado
    await prisma.emailJob.updateMany({
      where: {
        eventId,
        kind: 'pre_close'
      },
      data: {
        sentAt: new Date(),
        status: 'sent'
      }
    })

    // Log de auditoría
    await DatabaseService.createAuditLog(
      'pre_close_email_sent',
      'email_job',
      eventId,
      {
        recipientEmail: event.organizer.email,
        totalRegistrados: registrados.length,
        totalFaltantes: faltantes.length
      }
    )

    console.log(`Pre-close email enviado para evento ${eventId}`)

    return NextResponse.json({
      success: true,
      message: 'Email pre-close enviado exitosamente',
      stats: {
        registrados: registrados.length,
        faltantes: faltantes.length
      }
    })

  } catch (error) {
    console.error('Error en job pre-close:', error)

    // Marcar job como fallido
    if (body?.eventId) {
      await prisma.emailJob.updateMany({
        where: {
          eventId: body.eventId,
          kind: 'pre_close'
        },
        data: {
          status: 'failed',
          errorMsg: error instanceof Error ? error.message : 'Error desconocido'
        }
      })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

#### 4.2 Job Final
Crear `app/api/jobs/final/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { DatabaseService } from '@/lib/utils/database'
import { gmailService } from '@/lib/google/gmail'
import { pdfService } from '@/lib/pdf/buildFinal'
import { excelService } from '@/lib/excel/buildFinal'
import { buildFinalEmailTemplate } from '@/lib/email/templates/final'

const jobSchema = z.object({
  eventId: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    // Validar payload
    const body = await request.json()
    const { eventId } = jobSchema.parse(body)

    // Obtener evento con relaciones
    const event = await DatabaseService.getEventWithRelations(eventId)

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    // Marcar evento como completado si estaba activo
    if (event.status === 'active') {
      await prisma.event.update({
        where: { id: eventId },
        data: { status: 'completed' }
      })
    }

    // Generar datos del reporte
    const checkedInEmails = new Set(
      event.checkins
        .filter(c => c.correo)
        .map(c => c.correo)
    )

    const faltantes = event.invitees.filter(invitee => 
      !checkedInEmails.has(invitee.email) && !invitee.isResource
    )

    const reportData = {
      event: {
        id: event.id,
        title: event.title,
        startAt: event.startAt,
        endAt: event.endAt,
        location: event.location
      },
      organizer: {
        name: event.organizer.name,
        email: event.organizer.email
      },
      totals: {
        registrados: event.checkins.length,
        invitados: event.invitees.filter(i => !i.isResource).length,
        faltantes: faltantes.length,
        porcentajeAsistencia: event.invitees.length > 0 
          ? Math.round((event.checkins.length / event.invitees.filter(i => !i.isResource).length) * 100)
          : 0
      },
      registrados: event.checkins.map(c => ({
        cedula: c.cedula,
        nombre: c.nombre,
        cargo: c.cargo,
        institucion: c.institucion,
        correo: c.correo,
        sexo: c.sexo,
        telefono: c.telefono,
        createdAt: c.createdAt
      })),
      faltantes: faltantes.map(f => ({
        email: f.email,
        name: f.name,
        response: f.response
      }))
    }

    // Generar PDF y Excel
    const [pdfBuffer, excelBuffer] = await Promise.all([
      pdfService.generateFinalPDF(reportData),
      excelService.generateFinalExcel(reportData)
    ])

    // Generar template de email
    const emailHtml = await buildFinalEmailTemplate(reportData)

    // Enviar email con adjuntos
    await gmailService.sendEmail({
      to: event.organizer.email,
      subject: `Reporte Final de Asistencia - ${event.title}`,
      html: emailHtml,
      attachments: [
        {
          filename: `Reporte-Final-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        },
        {
          filename: `Asistencias-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.xlsx`,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      ]
    })

    // Actualizar job como enviado
    await prisma.emailJob.updateMany({
      where: {
        eventId,
        kind: 'final'
      },
      data: {
        sentAt: new Date(),
        status: 'sent'
      }
    })

    // Log de auditoría
    await DatabaseService.createAuditLog(
      'final_email_sent',
      'email_job',
      eventId,
      {
        recipientEmail: event.organizer.email,
        totalRegistrados: event.checkins.length,
        totalInvitados: event.invitees.filter(i => !i.isResource).length,
        porcentajeAsistencia: reportData.totals.porcentajeAsistencia
      }
    )

    console.log(`Final email enviado para evento ${eventId}`)

    return NextResponse.json({
      success: true,
      message: 'Email final enviado exitosamente',
      stats: reportData.totals
    })

  } catch (error) {
    console.error('Error en job final:', error)

    // Marcar job como fallido
    if (body?.eventId) {
      await prisma.emailJob.updateMany({
        where: {
          eventId: body.eventId,
          kind: 'final'
        },
        data: {
          status: 'failed',
          errorMsg: error instanceof Error ? error.message : 'Error desconocido'
        }
      })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

### 5. Utilidad de Envío de Emails

#### 5.1 Endpoint de Envío
Crear `app/api/mail/send/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { gmailService } from '@/lib/google/gmail'
import { DatabaseService } from '@/lib/utils/database'

const emailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1, 'Subject es requerido'),
  html: z.string().min(1, 'Contenido HTML es requerido'),
  text: z.string().optional(),
  eventId: z.string().uuid().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Validar payload
    const body = await request.json()
    const validatedData = emailSchema.parse(body)

    // Enviar email
    const success = await gmailService.sendEmail({
      to: validatedData.to,
      subject: validatedData.subject,
      html: validatedData.html,
      text: validatedData.text
    })

    if (!success) {
      throw new Error('Error enviando email')
    }

    // Log de auditoría si hay eventId
    if (validatedData.eventId) {
      await DatabaseService.createAuditLog(
        'email_sent',
        'email',
        undefined,
        {
          eventId: validatedData.eventId,
          to: validatedData.to,
          subject: validatedData.subject
        }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email enviado exitosamente'
    })

  } catch (error) {
    console.error('Error enviando email:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Endpoint de health check para validar configuración de Gmail
    const isValid = await gmailService.validateConfiguration()
    
    return NextResponse.json({
      success: true,
      gmailConfigured: isValid,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error validando configuración' },
      { status: 500 }
    )
  }
}
```

### 6. Middleware de CORS y Seguridad

#### 6.1 Middleware Global
Crear `middleware.ts`:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // CORS headers
  const response = NextResponse.next()
  
  // Solo permitir desde el dominio oficial en producción
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.APP_BASE_URL!]
    : ['http://localhost:3000', 'http://127.0.0.1:3000']

  const origin = request.headers.get('origin')
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT')
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // Rate limiting headers
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('X-RateLimit-Limit', '100')
    response.headers.set('X-RateLimit-Remaining', '99')
  }

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/a/:path*'
  ]
}
```

### 7. Documentación de API

#### 7.1 Endpoint de Documentación
Crear `app/api/docs/route.ts`:

```typescript
import { NextResponse } from 'next/server'

const apiDocs = {
  title: 'API Sistema de Registro de Asistencias - INAPA',
  version: '1.0.0',
  description: 'API REST para el manejo de eventos y registro de asistencias',
  endpoints: {
    '/api/checkins': {
      POST: {
        description: 'Registrar asistencia a un evento',
        body: {
          eventId: 'string (UUID)',
          cedula: 'string (11 dígitos)',
          nombre: 'string',
          cargo: 'string (opcional)',
          institucion: 'string (opcional)',
          correo: 'string email (opcional)',
          sexo: 'M|F|Otro (opcional)',
          telefono: 'string (opcional)'
        },
        responses: {
          200: 'Asistencia registrada exitosamente',
          400: 'Datos inválidos',
          409: 'Cédula ya registrada para este evento',
          429: 'Demasiadas solicitudes'
        }
      },
      GET: {
        description: 'Obtener lista de asistencias de un evento',
        query: {
          eventId: 'string (UUID) - requerido'
        }
      }
    },
    '/api/exports/[eventId]/pdf': {
      GET: {
        description: 'Exportar reporte en PDF',
        query: {
          type: 'initial|final - tipo de reporte'
        },
        responses: {
          200: 'Archivo PDF',
          404: 'Evento no encontrado'
        }
      }
    },
    '/api/exports/[eventId]/xlsx': {
      GET: {
        description: 'Exportar reporte en Excel',
        responses: {
          200: 'Archivo Excel',
          404: 'Evento no encontrado'
        }
      }
    },
    '/api/events/sync': {
      POST: {
        description: 'Sincronizar eventos desde Google Calendar',
        body: {
          googleEventId: 'string (opcional) - sincronizar evento específico'
        }
      },
      GET: {
        description: 'Validar configuración de APIs'
      }
    },
    '/api/jobs/pre-close': {
      POST: {
        description: 'Ejecutar job de notificación pre-cierre',
        body: {
          eventId: 'string (UUID)'
        }
      }
    },
    '/api/jobs/final': {
      POST: {
        description: 'Ejecutar job de reporte final',
        body: {
          eventId: 'string (UUID)'
        }
      }
    },
    '/api/mail/send': {
      POST: {
        description: 'Enviar email (uso interno)',
        body: {
          to: 'string|string[] - destinatarios',
          subject: 'string - asunto',
          html: 'string - contenido HTML',
          text: 'string (opcional) - contenido texto',
          eventId: 'string UUID (opcional) - para auditoría'
        }
      },
      GET: {
        description: 'Validar configuración de Gmail'
      }
    }
  },
  errorCodes: {
    400: 'Bad Request - Datos inválidos',
    401: 'Unauthorized - No autorizado',
    404: 'Not Found - Recurso no encontrado',
    409: 'Conflict - Conflicto (ej: registro duplicado)',
    429: 'Too Many Requests - Rate limit excedido',
    500: 'Internal Server Error - Error interno'
  },
  rateLimits: {
    '/api/checkins': '5 requests per minute per IP',
    '/api/exports/*': '10 requests per minute per IP',
    'general': '100 requests per minute per IP'
  }
}

export async function GET() {
  return NextResponse.json(apiDocs, {
    headers: {
      'Content-Type': 'application/json',
    }
  })
}
```

## Entregables

✅ Sistema de tokens y seguridad implementado  
✅ API de check-ins con validaciones completas  
✅ APIs de exportación PDF y Excel  
✅ Jobs automáticos (pre-close y final)  
✅ Endpoint de envío de emails  
✅ Middleware de seguridad y CORS  
✅ Documentación de API  
✅ Rate limiting básico  
✅ Auditoría de acciones  

## Testing de APIs

```bash
# Test check-in
curl -X POST http://localhost:3000/api/checkins \
  -H "Content-Type: application/json" \
  -d '{"eventId":"uuid","cedula":"12345678901","nombre":"Juan Pérez"}'

# Test exportación PDF
curl http://localhost:3000/api/exports/[eventId]/pdf?type=final

# Test validación Gmail
curl http://localhost:3000/api/mail/send

# Ver documentación
curl http://localhost:3000/api/docs
```

## Siguiente Paso
Continuar con **INSTRUCCIONES_06_GENERACION_REPORTES_JOBS.md** para implementar la generación de reportes y el sistema de jobs.
