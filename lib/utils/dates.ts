import { format, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formatear fecha con formato específico
 */
export function formatDate(date: Date | string, pattern: string = 'PP'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    if (!isValid(dateObj)) {
      return 'Fecha inválida'
    }
    
    return format(dateObj, pattern, { locale: es })
  } catch (error) {
    console.error('Error formateando fecha:', error)
    return 'Fecha inválida'
  }
}

/**
 * Obtener diferencia en minutos entre dos fechas
 */
export function getMinutesDifference(date1: Date, date2: Date): number {
  return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60))
}

/**
 * Verificar si un evento está activo
 */
export function isEventActive(startAt: Date, endAt: Date): boolean {
  const now = new Date()
  return now >= startAt && now <= endAt
}

/**
 * Verificar si un evento está próximo (próximas 24 horas)
 */
export function isEventSoon(startAt: Date): boolean {
  const now = new Date()
  const hoursUntilEvent = (startAt.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursUntilEvent > 0 && hoursUntilEvent <= 24
}
