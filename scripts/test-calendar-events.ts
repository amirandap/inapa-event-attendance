#!/usr/bin/env tsx

/**
 * Script de prueba para extraer eventos del calendario de minutas
 * usando la autorización OAuth configurada
 */

// Cargar variables de entorno
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { googleOAuthService } from '../lib/auth/google-oauth';
import { prisma } from '../lib/prisma';

const CALENDAR_EMAIL = 'minutas@inapa.gob.do';
const CALENDAR_ID = 'minutas@inapa.gob.do'; // O el ID específico del calendario

async function testCalendarAccess() {
  console.log('🔍 Iniciando prueba de acceso al calendario...\n');

  try {
    // 1. Verificar estado de autorización
    console.log('1️⃣ Verificando estado de autorización...');
    const authStatus = await googleOAuthService.getAuthStatus(CALENDAR_EMAIL);
    
    if (!authStatus.isAuthorized) {
      console.log('❌ Usuario no autorizado. Por favor, autoriza primero desde /dashboard/configuracion');
      return;
    }

    console.log('✅ Usuario autorizado:', {
      email: authStatus.email,
      calendarios: authStatus.calendars,
      ultimaSync: authStatus.lastSync,
      expira: authStatus.expiresAt
    });
    console.log('');

    // 2. Obtener lista de calendarios
    console.log('2️⃣ Obteniendo lista de calendarios disponibles...');
    const calendars = await googleOAuthService.getUserCalendars(CALENDAR_EMAIL);
    
    console.log(`📅 Calendarios encontrados: ${calendars.length}`);
    calendars.forEach((cal, index) => {
      console.log(`   ${index + 1}. ${cal.summary} (${cal.id})`);
      console.log(`      - Acceso: ${cal.accessRole}`);
      console.log(`      - Color: ${cal.backgroundColor || 'default'}`);
      console.log(`      - Descripción: ${cal.description || 'Sin descripción'}`);
      console.log('');
    });

    // 3. Buscar el calendario específico de minutas
    console.log('3️⃣ Buscando calendario de minutas...');
    let targetCalendar = calendars.find(cal => 
      cal.id === CALENDAR_ID || 
      cal.summary?.toLowerCase().includes('minutas') ||
      cal.id?.includes('minutas')
    );

    if (!targetCalendar) {
      // Usar el calendario principal si no se encuentra uno específico
      targetCalendar = calendars.find(cal => cal.primary) || calendars[0];
      console.log(`⚠️ No se encontró calendario específico de minutas. Usando: ${targetCalendar?.summary}`);
    } else {
      console.log(`✅ Calendario de minutas encontrado: ${targetCalendar.summary}`);
    }

    if (!targetCalendar) {
      console.log('❌ No hay calendarios disponibles');
      return;
    }

    console.log('');

    // 4. Obtener eventos de los últimos 30 días y próximos 30 días
    console.log('4️⃣ Extrayendo eventos del calendario...');
    
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const events = await googleOAuthService.getCalendarEvents(
      CALENDAR_EMAIL,
      targetCalendar.id,
      thirtyDaysAgo,
      thirtyDaysFromNow,
      100 // Límite de eventos
    );

    console.log(`📋 Eventos encontrados: ${events.length}`);
    console.log('');

    // 5. Mostrar información detallada de cada evento
    if (events.length > 0) {
      console.log('5️⃣ Detalle de eventos encontrados:');
      console.log(''.padEnd(80, '='));
      
      events.forEach((event, index) => {
        const startTime = event.start?.dateTime || event.start?.date;
        const endTime = event.end?.dateTime || event.end?.date;
        
        console.log(`${index + 1}. ${event.summary || 'Sin título'}`);
        console.log(`   📅 Fecha: ${new Date(startTime).toLocaleString('es-DO')}`);
        console.log(`   ⏰ Duración: ${new Date(startTime).toLocaleString('es-DO')} - ${new Date(endTime).toLocaleString('es-DO')}`);
        console.log(`   📍 Ubicación: ${event.location || 'Sin ubicación'}`);
        console.log(`   👥 Asistentes: ${event.attendees?.length || 0}`);
        console.log(`   🔗 ID: ${event.id}`);
        console.log(`   📝 Estado: ${event.status}`);
        
        if (event.description) {
          const desc = event.description.length > 100 
            ? event.description.substring(0, 100) + '...' 
            : event.description;
          console.log(`   📄 Descripción: ${desc}`);
        }
        
        if (event.attendees && event.attendees.length > 0) {
          console.log(`   👥 Lista de asistentes:`);
          event.attendees.slice(0, 5).forEach((attendee: any) => {
            const status = attendee.responseStatus || 'needsAction';
            const statusIcon = {
              'accepted': '✅',
              'declined': '❌',
              'tentative': '❓',
              'needsAction': '⏳'
            }[status] || '❔';
            
            console.log(`      ${statusIcon} ${attendee.email}${attendee.displayName ? ` (${attendee.displayName})` : ''}`);
          });
          
          if (event.attendees.length > 5) {
            console.log(`      ... y ${event.attendees.length - 5} más`);
          }
        }
        
        console.log(''.padEnd(60, '-'));
      });
    } else {
      console.log('📭 No se encontraron eventos en el rango de fechas especificado');
    }

    // 6. Estadísticas
    console.log('\n6️⃣ Estadísticas de eventos:');
    console.log(''.padEnd(40, '='));
    
    const eventStats = {
      total: events.length,
      confirmed: events.filter(e => e.status === 'confirmed').length,
      cancelled: events.filter(e => e.status === 'cancelled').length,
      withLocation: events.filter(e => e.location).length,
      withAttendees: events.filter(e => e.attendees && e.attendees.length > 0).length,
      withDescription: events.filter(e => e.description).length
    };

    console.log(`📊 Total de eventos: ${eventStats.total}`);
    console.log(`✅ Confirmados: ${eventStats.confirmed}`);
    console.log(`❌ Cancelados: ${eventStats.cancelled}`);
    console.log(`📍 Con ubicación: ${eventStats.withLocation}`);
    console.log(`👥 Con asistentes: ${eventStats.withAttendees}`);
    console.log(`📝 Con descripción: ${eventStats.withDescription}`);

    // 7. Verificar eventos recientes y próximos
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recentEvents = events.filter(event => {
      const eventDate = new Date(event.start?.dateTime || event.start?.date);
      return eventDate >= today;
    });

    const pastEvents = events.filter(event => {
      const eventDate = new Date(event.start?.dateTime || event.start?.date);
      return eventDate < today;
    });

    console.log(`\n📅 Eventos pasados: ${pastEvents.length}`);
    console.log(`🔮 Eventos futuros: ${recentEvents.length}`);

    console.log('\n✅ Prueba completada exitosamente!');

  } catch (error: any) {
    console.error('❌ Error durante la prueba:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      console.log('\n💡 Sugerencia: El token puede haber expirado. Intenta reautorizar desde /dashboard/configuracion');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testCalendarAccess()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

export { testCalendarAccess };
