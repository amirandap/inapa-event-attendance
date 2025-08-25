import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import { gmailService } from '@/lib/google/gmail'

export class ReportsService {
  /**
   * Genera un reporte Excel de asistencia para un evento específico
   */
  async generateEventAttendanceReport(eventId: string) {
    // Obtener evento y sus check-ins
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        checkins: true,
        organizer: true
      }
    })

    if (!event) {
      throw new Error('Evento no encontrado')
    }

    // Preparar datos para el Excel
    const checkinData = event.checkins.map(checkin => ({
      'Fecha': checkin.createdAt.toLocaleString(),
      'Cédula': checkin.cedula,
      'Nombre': checkin.nombre,
      'Cargo': checkin.cargo || '',
      'Institución': checkin.institucion || '',
      'Correo': checkin.correo || '',
      'Teléfono': checkin.telefono || '',
      'Sexo': checkin.sexo || ''
    }))

    // Crear workbook y worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(checkinData)

    // Añadir worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia')

    // Generar buffer del Excel
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return {
      buffer: excelBuffer,
      filename: `asistencia_${event.title}_${new Date().toISOString().split('T')[0]}.xlsx`,
      event,
    }
  }

  /**
   * Genera y envía un reporte de asistencia por correo
   */
  async sendAttendanceReport(eventId: string, recipients: string[]) {
    try {
      const { buffer, filename, event } = await this.generateEventAttendanceReport(eventId)

      // Preparar el contenido del correo
      const emailContent = `
        <h2>Reporte de Asistencia - ${event.title}</h2>
        <p>Adjunto encontrará el reporte de asistencia del evento.</p>
        <p><strong>Fecha del evento:</strong> ${event.startAt.toLocaleDateString()}</p>
        <p><strong>Total de asistentes:</strong> ${event.checkins.length}</p>
      `

      // Enviar correo con el Excel adjunto
      await gmailService.sendEmail({
        to: recipients,
        subject: `Reporte de Asistencia - ${event.title}`,
        html: emailContent,
        attachments: [{
          filename,
          content: buffer,
          encoding: 'base64'
        }]
      })

      // Registrar el envío en el log de auditoría
      await prisma.auditLog.create({
        data: {
          action: 'report_sent',
          entityType: 'event',
          entityId: event.id,
          details: {
            eventTitle: event.title,
            recipients,
            reportType: 'attendance_excel'
          }
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error enviando reporte:', error)
      throw error
    }
  }

  /**
   * Genera reporte de estadísticas generales
   */
  async generateStatsReport() {
    // Obtener estadísticas generales
    const [totalEvents, totalCheckins, checkinsByGender, topEvents] = await Promise.all([
      prisma.event.count(),
      prisma.checkin.count(),
      prisma.checkin.groupBy({
        by: ['sexo'],
        _count: true
      }),
      prisma.event.findMany({
        take: 10,
        include: {
          _count: {
            select: { checkins: true }
          }
        },
        orderBy: {
          checkins: {
            _count: 'desc'
          }
        }
      })
    ])

    // Preparar datos para el Excel
    const statsData = {
      general: [{
        'Métrica': 'Total de Eventos',
        'Valor': totalEvents
      }, {
        'Métrica': 'Total de Asistencias',
        'Valor': totalCheckins
      }],
      genero: checkinsByGender.map(stat => ({
        'Género': stat.sexo || 'No especificado',
        'Cantidad': stat._count
      })),
      eventos: topEvents.map(event => ({
        'Evento': event.title,
        'Fecha': event.startAt.toLocaleDateString(),
        'Asistentes': event._count.checkins
      }))
    }

    // Crear workbook
    const wb = XLSX.utils.book_new()

    // Añadir hojas
    const wsGeneral = XLSX.utils.json_to_sheet(statsData.general)
    const wsGenero = XLSX.utils.json_to_sheet(statsData.genero)
    const wsEventos = XLSX.utils.json_to_sheet(statsData.eventos)

    XLSX.utils.book_append_sheet(wb, wsGeneral, 'Estadísticas Generales')
    XLSX.utils.book_append_sheet(wb, wsGenero, 'Asistencia por Género')
    XLSX.utils.book_append_sheet(wb, wsEventos, 'Top 10 Eventos')

    // Generar buffer del Excel
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return {
      buffer: excelBuffer,
      filename: `estadisticas_generales_${new Date().toISOString().split('T')[0]}.xlsx`
    }
  }

  /**
   * Envía reporte de estadísticas generales por correo
   */
  async sendStatsReport(recipients: string[]) {
    try {
      const { buffer, filename } = await this.generateStatsReport()

      // Preparar el contenido del correo
      const emailContent = `
        <h2>Reporte de Estadísticas Generales</h2>
        <p>Adjunto encontrará el reporte de estadísticas generales del sistema.</p>
      `

      // Enviar correo con el Excel adjunto
      await gmailService.sendEmail({
        to: recipients,
        subject: 'Reporte de Estadísticas Generales',
        html: emailContent,
        attachments: [{
          filename,
          content: buffer,
          encoding: 'base64'
        }]
      })

      // Registrar el envío en el log de auditoría
      await prisma.auditLog.create({
        data: {
          action: 'report_sent',
          entityType: 'system',
          details: {
            reportType: 'general_stats',
            recipients
          }
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error enviando reporte de estadísticas:', error)
      throw error
    }
  }
}

export const reportsService = new ReportsService()
