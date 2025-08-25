import { NextRequest } from 'next/server';
import { hybridCalendarService } from '@/lib/google/hybrid-calendar';
import { 
  successResponse, 
  errorResponse, 
  handleCors 
} from '@/lib/api/responses';
import { verifyQstashSignature } from '@/lib/middleware/auth';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

export async function POST(request: NextRequest) {
  // Verificar firma de QStash para jobs programados
  const isValidSignature = await verifyQstashSignature(request);
  if (!isValidSignature) {
    return errorResponse(401, 'Unauthorized');
  }

  try {
    const result = await hybridCalendarService.forceSyncEvents();
    return successResponse(result);
  } catch (error: any) {
    console.error('Error en sync-calendar job:', error);
    return errorResponse(500, error.message);
  }
}
