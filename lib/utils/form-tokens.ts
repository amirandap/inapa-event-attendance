import { prisma } from '@/lib/prisma';
import { customAlphabet } from 'nanoid';

// Crear alfabeto personalizado para tokens más legibles
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

/**
 * Generar un token único para formularios de eventos
 */
export async function generateUniqueFormToken(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const token = nanoid();
    
    // Verificar que el token no exista
    const existingEvent = await prisma.event.findUnique({
      where: { formToken: token },
      select: { id: true }
    });

    if (!existingEvent) {
      return token;
    }

    attempts++;
  }

  // Fallback: usar timestamp + random
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}${random}`.toUpperCase();
}

/**
 * Validar formato de token
 */
export function isValidFormToken(token: string): boolean {
  return typeof token === 'string' && token.length >= 6 && token.length <= 20;
}
