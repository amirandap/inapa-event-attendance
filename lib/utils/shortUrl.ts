/**
 * Utilidades para generar y gestionar URLs cortas
 */

import { prisma } from '@/lib/prisma'

// Caracteres para códigos cortos (evitando confusión entre 0, O, I, l, etc.)
const CHARACTERS = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/**
 * Genera un código aleatorio de 6 caracteres
 */
export function generateShortCode(): string {
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length))
  }
  return result
}

/**
 * Verifica si un código corto ya existe en la base de datos
 */
export async function isShortCodeUnique(shortCode: string): Promise<boolean> {
  const existing = await prisma.shortUrl.findUnique({
    where: { shortCode }
  })
  return !existing
}

/**
 * Genera un código corto único
 */
export async function generateUniqueShortCode(): Promise<string> {
  let shortCode: string
  let attempts = 0
  const maxAttempts = 10

  do {
    shortCode = generateShortCode()
    attempts++

    if (attempts > maxAttempts) {
      throw new Error('No se pudo generar un código único después de múltiples intentos')
    }
  } while (!(await isShortCodeUnique(shortCode)))

  return shortCode
}

/**
 * Crea una URL corta para un evento
 */
export async function createShortUrl(eventId: string, fullUrl: string): Promise<string> {
  // Verificar si ya existe una URL corta para este evento
  const existing = await prisma.shortUrl.findFirst({
    where: { eventId }
  })

  if (existing) {
    return existing.shortCode
  }

  const shortCode = await generateUniqueShortCode()

  await prisma.shortUrl.create({
    data: {
      shortCode,
      eventId,
      fullUrl
    }
  })

  return shortCode
}

/**
 * Obtiene la URL completa a partir de un código corto
 */
export async function getFullUrl(shortCode: string): Promise<string | null> {
  const shortUrl = await prisma.shortUrl.findUnique({
    where: { shortCode }
  })

  if (shortUrl) {
    // Incrementar contador de clicks
    await prisma.shortUrl.update({
      where: { shortCode },
      data: { clicks: { increment: 1 } }
    })
    
    return shortUrl.fullUrl
  }

  return null
}

/**
 * Crea URL corta para el formulario de asistencia de un evento
 */
export async function createAttendanceShortUrl(eventId: string, formToken: string, baseUrl?: string): Promise<{
  shortCode: string
  shortUrl: string
  fullUrl: string
}> {
  const url = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3030')
  const fullUrl = `${url}/a/${formToken}`
  
  const shortCode = await createShortUrl(eventId, fullUrl)
  const shortUrl = `${url}/s/${shortCode}`

  return {
    shortCode,
    shortUrl,
    fullUrl
  }
}

/**
 * Obtiene estadísticas de una URL corta
 */
export async function getShortUrlStats(shortCode: string) {
  return await prisma.shortUrl.findUnique({
    where: { shortCode },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startAt: true,
          endAt: true
        }
      }
    }
  })
}
