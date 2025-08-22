const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Carga las credenciales de la cuenta de servicio
const serviceAccountPath = path.join(__dirname, 'service-account.json');
const credentials = require(serviceAccountPath);

// ID del calendario de pruebas
const CALENDAR_ID = '71a02592c493c489d1bdd0f997ea61b1a4586cb30ed33860b64e2098b5993399@group.calendar.google.com';

// Configura la autenticación con la cuenta de servicio
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/calendar']
});

/**
 * Lista los eventos del calendario de prueba
 */
async function listEvents() {
  try {
    // Obtiene el cliente autenticado
    const client = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: client });

    // Obtiene los eventos
    const res = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = res.data.items;
    if (!events || events.length === 0) {
      console.log('No se encontraron eventos próximos.');
      return;
    }

    console.log('Eventos encontrados:');
    events.forEach((event, i) => {
      const organizador = event.organizer?.email || 'No especificado';
      const fecha = event.start.dateTime || event.start.date;
      const hora = event.start.dateTime ? new Date(event.start.dateTime).toLocaleTimeString() : 'Día completo';
      const invitados = event.attendees ? event.attendees.map(a => a.email).join(', ') : 'No hay invitados';

      console.log(`
        --- Evento #${i + 1} ---
        Título: ${event.summary}
        Organizador: ${organizador}
        Fecha: ${fecha}
        Hora: ${hora}
        Invitados: ${invitados}
        ------------------------
      `);
    });

  } catch (error) {
    console.error('Error al obtener los eventos:');
    console.error('Mensaje:', error.message);
    console.error('Error completo:', error);
    if (error.message.includes('permission')) {
      console.error('Verifica que la cuenta de servicio tenga los permisos necesarios en el calendario.');
    }
  }
}

// Función para crear un evento de prueba
async function createTestEvent() {
  try {
    const client = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: client });

    const event = {
      summary: 'Evento de prueba',
      description: 'Este es un evento creado para probar la integración con Google Calendar',
      start: {
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // mañana
        timeZone: 'America/Santo_Domingo',
      },
      end: {
        dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // mañana + 1 hora
        timeZone: 'America/Santo_Domingo',
      }
    };

    const result = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event,
    });

    console.log('Evento creado:', result.data.htmlLink);
  } catch (error) {
    console.error('Error al crear el evento:', error.message);
  }
}

// Ejecuta las pruebas
console.log('Listando eventos actuales...');
listEvents()
  .then(() => {
    console.log('\nCreando evento de prueba...');
    return createTestEvent();
  })
  .catch(console.error);
