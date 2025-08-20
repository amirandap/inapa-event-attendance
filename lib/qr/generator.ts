/**
 * Utilidades para generación de códigos QR
 */

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

export function generateAttendanceQRCode(formToken: string, baseUrl?: string) {
  const url = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3030')
  const attendanceUrl = `${url}/a/${formToken}`
  
  return {
    url: attendanceUrl,
    qrCodeUrl: generateQRCodeUrl(attendanceUrl, { size: 300 })
  }
}

export interface QRCodeData {
  eventId: string
  formToken: string
  attendanceUrl: string
  qrCodeUrl: string
}

export function generateEventQRData(eventId: string, formToken: string, baseUrl?: string): QRCodeData {
  const url = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3030')
  const attendanceUrl = `${url}/a/${formToken}`
  
  return {
    eventId,
    formToken,
    attendanceUrl,
    qrCodeUrl: generateQRCodeUrl(attendanceUrl, { size: 300 })
  }
}
