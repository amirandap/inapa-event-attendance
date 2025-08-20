import { NextRequest } from 'next/server'
import { errorResponse } from '@/lib/api/responses'

// Middleware básico de autenticación
export function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse('Token de autorización requerido', 401)
  }

  const token = authHeader.substring(7)
  
  // Por ahora, usamos un token simple para autenticación básica
  // En producción, esto debería validar un JWT real
  const validToken = process.env.ADMIN_TOKEN || 'admin-token-123'
  
  if (token !== validToken) {
    return errorResponse('Token de autorización inválido', 401)
  }

  return null // No error, autenticación exitosa
}

// Middleware para validar acceso a eventos públicos
export function validateEventAccess(token: string) {
  // Validar que el token del evento sea válido
  if (!token || token.length < 10) {
    return errorResponse('Token de evento inválido', 400)
  }

  return null // Token válido
}

// Helper para verificar si un endpoint necesita autenticación
export function isProtectedEndpoint(pathname: string): boolean {
  const protectedPaths = [
    '/api/events',
    '/api/organizers',
    '/api/invitees',
    '/api/reports',
    '/api/stats'
  ]

  // Los endpoints de checkin y attendance son públicos
  const publicPaths = [
    '/api/checkins',
    '/api/attendance'
  ]

  // Verificar si es un path público específico
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return false
  }

  // Verificar si es un path protegido
  return protectedPaths.some(path => pathname.startsWith(path))
}

// Helper para obtener información del usuario desde el token
export function getUserFromToken(_token: string) {
  // En una implementación real, esto decodificaría un JWT
  // Por ahora retornamos un usuario admin básico
  return {
    id: '1',
    email: 'admin@inapa.gob.do',
    name: 'Administrador INAPA',
    role: 'admin'
  }
}
