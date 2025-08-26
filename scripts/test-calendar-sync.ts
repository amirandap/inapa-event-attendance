#!/usr/bin/env tsx

/**
 * Script de prueba para la sincronización de eventos de Google Calendar
 */

// Cargar variables de entorno
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { calendarSyncService } from '../lib/services/calendar-sync';
import { prisma } from '../lib/prisma';

const CALENDAR_EMAIL = 'minutas@inapa.gob.do';
const CALENDAR_ID = 'minutas@inapa.gob.do';

async function testCalendarSync() {
  console.log('🔄 Iniciando prueba de sincronización de calendario...\n');

  try {
    // 1. Mostrar estadísticas antes de la sincronización
    console.log('1️⃣ Estadísticas antes de la sincronización:');
    const statsBefore = await calendarSyncService.getSyncStats();
    console.log('📊 Total de eventos en BD:', statsBefore.totalEvents);
    console.log('📅 Eventos de Google Calendar:', statsBefore.googleEvents);
    console.log('💾 Eventos solo locales:', statsBefore.localOnlyEvents);
    console.log('⏰ Última sincronización:', statsBefore.lastSync || 'Nunca');
    console.log('');

    // 2. Ejecutar sincronización
    console.log('2️⃣ Ejecutando sincronización...');
    const syncResult = await calendarSyncService.syncCalendarEvents({
      calendarEmail: CALENDAR_EMAIL,
      calendarId: CALENDAR_ID,
      syncDays: 60, // 60 días hacia atrás y adelante
      organizerId: 1,
      deleteRemovedEvents: false,
      syncAttendees: true
    });

    // 3. Mostrar resultados
    console.log('3️⃣ Resultados de la sincronización:');
    console.log(''.padEnd(50, '='));
    
    if (syncResult.success) {
      console.log('✅ Sincronización exitosa!');
      console.log(`📋 Total de eventos procesados: ${syncResult.totalEvents}`);
      console.log(`✨ Eventos creados: ${syncResult.created}`);
      console.log(`🔄 Eventos actualizados: ${syncResult.updated}`);
      console.log(`🗑️ Eventos eliminados: ${syncResult.deleted}`);
      
      if (syncResult.errors.length > 0) {
        console.log(`⚠️ Errores encontrados: ${syncResult.errors.length}`);
        syncResult.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
    } else {
      console.log('❌ Sincronización falló');
      syncResult.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    console.log('');

    // 4. Mostrar eventos sincronizados
    if (syncResult.syncedEvents.length > 0) {
      console.log('4️⃣ Eventos sincronizados:');
      console.log(''.padEnd(60, '-'));
      
      syncResult.syncedEvents.forEach((event, index) => {
        const actionIcon = {
          'created': '✨',
          'updated': '🔄',
          'deleted': '🗑️',
          'skipped': '⏭️'
        }[event.action] || '❔';
        
        console.log(`${index + 1}. ${actionIcon} ${event.title}`);
        console.log(`   Google ID: ${event.googleEventId}`);
        console.log(`   Local ID: ${event.id}`);
        console.log(`   Acción: ${event.action}`);
        console.log('');
      });
    }

    // 5. Mostrar estadísticas después de la sincronización
    console.log('5️⃣ Estadísticas después de la sincronización:');
    const statsAfter = await calendarSyncService.getSyncStats();
    console.log('📊 Total de eventos en BD:', statsAfter.totalEvents);
    console.log('📅 Eventos de Google Calendar:', statsAfter.googleEvents);
    console.log('💾 Eventos solo locales:', statsAfter.localOnlyEvents);
    console.log('⏰ Última sincronización:', statsAfter.lastSync);
    console.log('');

    // 6. Mostrar comparativa
    console.log('6️⃣ Comparativa:');
    console.log(''.padEnd(40, '='));
    console.log(`📈 Incremento total: +${statsAfter.totalEvents - statsBefore.totalEvents}`);
    console.log(`📈 Incremento Google: +${statsAfter.googleEvents - statsBefore.googleEvents}`);
    console.log('');

    // 7. Verificar algunos eventos en detalle
    console.log('7️⃣ Verificación de eventos en base de datos:');
    const recentEvents = await prisma.event.findMany({
      where: {
        googleEventId: { not: '' }
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        invitees: {
          take: 3,
          select: {
            nombre: true,
            email: true,
            institucion: true
          }
        },
        organizer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    recentEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   📅 ${event.startAt.toLocaleString('es-DO')} - ${event.endAt.toLocaleString('es-DO')}`);
      console.log(`   📍 ${event.location || 'Sin ubicación'}`);
      console.log(`   🔗 Google ID: ${event.googleEventId}`);
      console.log(`   👤 Organizador: ${event.organizer.name || event.organizer.email}`);
      console.log(`   🎫 Token: ${event.formToken}`);
      
      if (event.invitees.length > 0) {
        console.log(`   👥 Asistentes (${event.invitees.length}):`);
        event.invitees.forEach(invitee => {
          console.log(`      - ${invitee.nombre} (${invitee.email})`);
        });
      }
      console.log('');
    });

    console.log('✅ Prueba de sincronización completada exitosamente!');
    console.log('\n🎯 Próximos pasos sugeridos:');
    console.log('   • Configurar sincronización automática con cron jobs');
    console.log('   • Implementar webhooks de Google Calendar para sincronización en tiempo real');
    console.log('   • Configurar notificaciones de cambios importantes');
    console.log('   • Generar reportes de asistencia automatizados');

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ Error durante la prueba:', errorMessage);
    
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testCalendarSync()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

export { testCalendarSync };
