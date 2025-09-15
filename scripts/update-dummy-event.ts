import dotenv from 'dotenv';
// Cargar las variables de entorno ANTES que cualquier otro módulo.
dotenv.config({ path: '.env.local' });

import { prisma } from '@/lib/prisma';
import { addMinutes } from 'date-fns';
import { emailJobScheduler } from '@/lib/jobs/email-scheduler';

// --- CONFIGURACIÓN DE LA PRUEBA ---
// 1. Edita este array con los TRES IDs de los eventos que quieres probar.
const EVENT_IDS_TO_TEST = [
  '4e1883b9-7700-41ab-9bef-74ea6a2c36d7',
  '5b5258b3-4aac-41fc-8662-27d22f8b317d',
  'd24300fa-e153-44ad-ab13-10139f7039b4',
];

// 2. (Opcional) Puedes cambiar el email del organizador.
const ORGANIZER_EMAIL = 'kendrick.neufeld@inapa.gob.do';
const DURATION_MINUTES = 30;
// ---------------------------------

// Función auxiliar para crear una pausa en el script.
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function updateMultipleEventsForTesting() {
  if (
    !EVENT_IDS_TO_TEST ||
    EVENT_IDS_TO_TEST.length !== 3 ||
    EVENT_IDS_TO_TEST.some((id) => id.includes('pega-el'))
  ) {
    console.error(
      '❌ Por favor, edita el script y asigna TRES IDs de evento válidos a la constante EVENT_IDS_TO_TEST.'
    );
    process.exit(1);
  }

  console.log(`Buscando al organizador: ${ORGANIZER_EMAIL}`);
  const testOrganizer = await prisma.organizer.upsert({
    where: { email: ORGANIZER_EMAIL },
    update: {},
    create: {
      email: ORGANIZER_EMAIL,
      name: `Organizador de Prueba (${ORGANIZER_EMAIL.split('@')[0]})`,
    },
  });
  console.log(`✅ Usando organizador con ID: ${testOrganizer.id}\n`);

  let eventCounter = 0;
  for (const eventId of EVENT_IDS_TO_TEST) {
    try {
      console.log(`--- Procesando Evento ${eventCounter + 1}/${EVENT_IDS_TO_TEST.length} (ID: ${eventId}) ---`);

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) {
        console.warn(`⚠️ No se encontró el evento con ID: ${eventId}. Saltando...`);
        continue;
      }

      const now = new Date();
      // El primer evento empieza en 61 min (para que el recordatorio sea en 1 min),
      // los siguientes se escalonan a partir de ahí.
      const startInMinutes = 61 + (eventCounter * 5); 
      const newStartAt = addMinutes(now, startInMinutes);
      const newEndAt = addMinutes(newStartAt, DURATION_MINUTES);

      const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: {
          startAt: newStartAt,
          endAt: newEndAt,
          organizerId: testOrganizer.id,
        },
      });

      console.log('✅ Evento actualizado con éxito para pruebas:');
      console.log(`   - Título: ${updatedEvent.title}`);
      console.log(`   - Nuevo inicio: ${updatedEvent.startAt.toLocaleString()}`);

      console.log('🔄 Programando los correos en la base de datos...');
      await emailJobScheduler.scheduleEventEmails(updatedEvent.id);
      console.log('-----------------------------------------------------\n');

      eventCounter++;
    } catch (error) {
        console.error(`❌ Error procesando el evento ${eventId}:`, error);
    }
  }

  // --- Simulación de la llamada del Cron Job ---
  console.log('\n⏱️ Esperando 65 segundos para que la tarea de recordatorio del primer evento esté lista...');
  await delay(65000); // Pausa de 65 segundos (1 min + 5 seg de margen)

  console.log('\n🚀 Simulando la ejecución del "vigilante" (cron job) para procesar tareas inmediatas...');

  const triggerUrl = 'http://localhost:3000/api/cron/trigger-jobs';
  const cronSecret = process.env.CRON_SECRET;

  try {
    const response = await fetch(triggerUrl, {
      method: 'GET',
      headers: {
        ...(cronSecret && { Authorization: `Bearer ${cronSecret}` }),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Error al llamar al endpoint trigger-jobs:', result);
    } else {
      console.log('✅ Respuesta del endpoint trigger-jobs:', result.message || result);
    }
  } catch (error) {
    console.error('❌ Fallo al intentar conectar con el endpoint trigger-jobs. ¿Está el servidor corriendo?', error);
  }
}

updateMultipleEventsForTesting()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

