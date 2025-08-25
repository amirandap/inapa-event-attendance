import { prisma } from '@/lib/prisma';
import { EventSyncStatus } from '@/lib/google/types';

interface SyncState {
  lastSuccessfulSync: Date | null;
  pendingSyncs: number;
  failedSyncs: number;
  totalEvents: number;
  lastError: string | null;
  status: 'healthy' | 'warning' | 'error';
}

export async function getCalendarSyncState(): Promise<SyncState> {
  const [
    lastSync,
    pendingSyncs,
    failedSyncs,
    totalEvents,
    lastError
  ] = await Promise.all([
    // Última sincronización exitosa
    prisma.systemConfig.findUnique({
      where: { key: 'last_calendar_sync' },
      select: { value: true }
    }),
    
    // Eventos pendientes de sincronizar
    prisma.event.count({
      where: { syncStatus: EventSyncStatus.PENDING_SYNC }
    }),
    
    // Eventos con error de sincronización
    prisma.event.count({
      where: { syncStatus: EventSyncStatus.SYNC_FAILED }
    }),
    
    // Total de eventos
    prisma.event.count(),
    
    // Último error registrado
    prisma.auditLog.findFirst({
      where: { action: 'SYNC_ERROR' },
      orderBy: { createdAt: 'desc' },
      select: { details: true }
    })
  ]);

  const state: SyncState = {
    lastSuccessfulSync: lastSync ? new Date(lastSync.value) : null,
    pendingSyncs,
    failedSyncs,
    totalEvents,
    lastError: lastError?.details?.error || null,
    status: 'healthy'
  };

  // Determinar estado general
  if (failedSyncs > 0) {
    state.status = 'error';
  } else if (pendingSyncs > 0) {
    state.status = 'warning';
  }

  return state;
}
