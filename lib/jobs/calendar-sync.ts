import { QstashClient } from '@/lib/qstash';

export const CALENDAR_SYNC_SCHEDULES = {
  // Sincronización incremental cada hora
  HOURLY: {
    cron: '0 * * * *',
    options: { fullSync: false }
  },
  
  // Sincronización completa diaria (en la madrugada)
  DAILY: {
    cron: '0 4 * * *', // 4 AM
    options: { fullSync: true }
  },
  
  // Sincronización completa semanal (domingo en la madrugada)
  WEEKLY: {
    cron: '0 3 * * 0', // Domingo 3 AM
    options: { 
      fullSync: true,
      timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 días atrás
    }
  }
};

/**
 * Configurar jobs de sincronización del calendario
 */
export async function setupCalendarSyncJobs() {
  const qstash = new QstashClient();
  
  // Configurar cada schedule
  for (const [name, config] of Object.entries(CALENDAR_SYNC_SCHEDULES)) {
    try {
      await qstash.createSchedule({
        destination: '/api/jobs/sync-calendar',
        cron: config.cron,
        payload: config.options
      });
      
      console.log(`✅ Job de sincronización ${name} configurado: ${config.cron}`);
      
    } catch (error) {
      console.error(`❌ Error configurando job ${name}:`, error);
    }
  }
}
