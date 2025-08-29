import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv'; // Importa la biblioteca dotenv

dotenv.config({ path: '.env.local' }); // Carga las variables del archivo .env.local

// Crea un evento y 10 invitados con 5 asistencias
async function createDummyEventWithAttendance() {
  // Generar un token de formulario único
  const formToken = faker.string.uuid();
  
  // Datos de prueba para el evento
  const dummyEvent = {
    title: faker.lorem.words(3),
    description: faker.lorem.paragraph(),
    location: faker.location.city(),
    startAt: faker.date.future(),
    endAt: faker.date.future(),
    googleEventId: faker.string.uuid(),
    status: 'confirmed',
    formToken: formToken, // Añade el campo formToken aquí
    organizer: {
      connectOrCreate: {
        where: { email: faker.internet.email() },
        create: { name: faker.person.fullName(), email: faker.internet.email() },
      },
    },
  };

  const event = await prisma.event.create({
    data: {
      ...dummyEvent,
      organizer: {
        connectOrCreate: {
          where: { email: 'organizador_de_prueba@example.com' },
          create: { name: 'Organizador de Prueba', email: 'organizador_de_prueba@example.com' },
        },
      },
      invitees: {
        createMany: {
          data: Array.from({ length: 10 }, (_, i) => ({
            id: faker.string.uuid(), // Añadir un ID único para cada invitado
            email: faker.internet.email(),
            cedula: faker.string.numeric(9),
            nombre: faker.person.fullName(),
          })),
        },
      },
    },
  });

  const invitees = await prisma.invitee.findMany({ where: { eventId: event.id } });

  await prisma.checkin.createMany({
    data: invitees.slice(0, 5).map(invitee => ({
      inviteeId: invitee.id,
      eventId: event.id,
      nombre: invitee.nombre,
      cedula: invitee.cedula,
      correo: invitee.email,
      institucion: faker.company.name(),
      cargo: faker.person.jobTitle(),
      telefono: faker.phone.number(),
      sexo: faker.person.sex(),
    })),
  });

  console.log(`Evento de prueba creado: ${event.title}`);
  console.log(`ID del evento: ${event.id}`);
  console.log('5 asistencias registradas.');

  return event.id;
}

createDummyEventWithAttendance()
  .then(async (eventId) => {
    await prisma.$disconnect();
    console.log(`Prueba exitosa. ID del evento de prueba: ${eventId}`);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
