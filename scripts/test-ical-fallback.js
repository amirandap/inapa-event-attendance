import ICAL from 'ical.js';

// URL del iCal secreto
const ICAL_URL = 'https://calendar.google.com/calendar/ical/c_f02682f1ca102750e235b9686d67b19ede3faf5b244547c677e9685b006e5e3f%40group.calendar.google.com/private-b527da9f779a644f8460cdd8149a2944/basic.ics';

/**
 * Script para probar la conectividad y parseo del iCal fallback con ical.js
 */
async function testICalFallback() {
  console.log('🔄 Probando fallback iCal con ical.js...');
  console.log('📍 URL:', ICAL_URL);
  console.log('');

  try {
    // Descargar el archivo iCal
    console.log('⬇️ Descargando archivo iCal...');
    const response = await fetch(ICAL_URL);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }
    
    const icalData = await response.text();
    console.log(`✅ Archivo descargado (${icalData.length} caracteres)`);
    
    // Parsear el contenido con ical.js
    console.log('🔄 Parseando contenido iCal con ical.js...');
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    
    // Obtener todos los eventos VEVENT
    const vevents = comp.getAllSubcomponents('vevent');
    const events = [];
    
    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      
      events.push({
        id: event.uid || 'sin-id',
        summary: event.summary || 'Sin título',
        start: event.startDate.toJSDate(),
        end: event.endDate.toJSDate(),
        location: event.location || '',
        description: event.description || '',
        organizer: event.organizer || '',
        attendeesCount: event.attendees?.length || 0
      });
    }
    
    console.log(`✅ ${events.length} eventos encontrados`);
    console.log('');
    
    // Mostrar próximos eventos
    const now = new Date();
    const futureEvents = events
      .filter(e => e.start > now)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 5);
    
    if (futureEvents.length > 0) {
      console.log('📅 Próximos eventos:');
      futureEvents.forEach((event, i) => {
        console.log(`
  ${i + 1}. ${event.summary}
     📅 ${event.start.toLocaleString()}
     📍 ${event.location || 'Sin ubicación'}
     👥 ${event.attendeesCount} asistentes
     📧 ${event.organizer || 'Sin organizador'}
        `);
      });
    } else {
      console.log('⚠️ No hay eventos futuros');
    }
    
    // Mostrar estadísticas
    console.log('📊 Estadísticas:');
    console.log(`   Total de eventos: ${events.length}`);
    console.log(`   Eventos futuros: ${events.filter(e => e.start > now).length}`);
    console.log(`   Eventos pasados: ${events.filter(e => e.start <= now).length}`);
    
    console.log('');
    console.log('🎉 Prueba de fallback iCal con ical.js exitosa!');
    
  } catch (error) {
    console.error('❌ Error en prueba de fallback iCal:');
    console.error('   Mensaje:', error.message);
    console.error('   Error completo:', error);
    
    // Sugerencias de troubleshooting
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Verifica que la URL del iCal sea correcta');
    console.log('   2. Asegúrate de que el calendario sea público o que tengas permisos');
    console.log('   3. Revisa tu conexión a internet');
    console.log('   4. Comprueba si Google está bloqueando la solicitud');
    console.log('   5. Verifica que ical.js esté instalado correctamente');
  }
}

// Ejecutar la prueba
testICalFallback();
