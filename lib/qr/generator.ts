/**
 * Utilidades para generación de códigos QR
 */

import { createAttendanceShortUrl } from '@/lib/utils/shortUrl'

// Por ahora usaremos una API externa para generar QR codes
// En el futuro se puede implementar con una librería como qrcode

export function generateQRCodeUrl(data: string, options?: {
  size?: number
  format?: 'png' | 'svg'
  errorCorrection?: 'L' | 'M' | 'Q' | 'H'
}) {
  const defaultOptions = {
    size: 200,
    format: 'png' as const,
    errorCorrection: 'M' as const,
    ...options
  }

  // Usar API de QR Server (gratuita)
  const params = new URLSearchParams({
    data: encodeURIComponent(data),
    size: `${defaultOptions.size}x${defaultOptions.size}`,
    format: defaultOptions.format,
    ecc: defaultOptions.errorCorrection
  })

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`
}

export async function generateAttendanceQRCode(eventId: string, formToken: string, baseUrl?: string) {
  try {
    const { shortCode, shortUrl, fullUrl } = await createAttendanceShortUrl(eventId, formToken, baseUrl)
    
    return {
      shortCode,
      shortUrl,
      fullUrl,
      qrCodeUrl: generateQRCodeUrl(shortUrl, { size: 300 })
    }
  } catch (error) {
    // Fallback a URL completa si falla la URL corta
    console.warn('Error creating short URL, using full URL as fallback:', error)
    const url = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3030')
    const attendanceUrl = `${url}/a/${formToken}`
    
    return {
      shortCode: null,
      shortUrl: attendanceUrl,
      fullUrl: attendanceUrl,
      qrCodeUrl: generateQRCodeUrl(attendanceUrl, { size: 300 })
    }
  }
}

export interface QRCodeData {
  eventId: string
  formToken: string
  shortCode: string | null
  shortUrl: string
  fullUrl: string
  qrCodeUrl: string
}

export async function generateEventQRData(eventId: string, formToken: string, baseUrl?: string): Promise<QRCodeData> {
  const qrData = await generateAttendanceQRCode(eventId, formToken, baseUrl)
  
  return {
    eventId,
    formToken,
    shortCode: qrData.shortCode,
    shortUrl: qrData.shortUrl,
    fullUrl: qrData.fullUrl,
    qrCodeUrl: qrData.qrCodeUrl
  }
}
