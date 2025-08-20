import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Crear configuraciones del sistema
  await prisma.systemConfig.upsert({
    where: { key: 'email_template_footer' },
    update: {},
    create: {
      key: 'email_template_footer',
      value: 'Instituto Nacional de Aguas Potables y Alcantarillados (INAPA)',
      description: 'Pie de página para plantillas de email'
    }
  })

  await prisma.systemConfig.upsert({
    where: { key: 'app_name' },
    update: {},
    create: {
      key: 'app_name',
      value: 'Sistema de Registro de Asistencias - INAPA',
      description: 'Nombre de la aplicación'
    }
  })

  await prisma.systemConfig.upsert({
    where: { key: 'max_checkins_per_event' },
    update: {},
    create: {
      key: 'max_checkins_per_event',
      value: '500',
      description: 'Número máximo de registros por evento'
    }
  })

  // Crear organizadores
  const organizer1 = await prisma.organizer.upsert({
    where: { email: 'eventos@inapa.gob.do' },
    update: {},
    create: {
      name: 'Coordinación de Eventos INAPA',
      email: 'eventos@inapa.gob.do'
    }
  })

  const organizer2 = await prisma.organizer.upsert({
    where: { email: 'capacitacion@inapa.gob.do' },
    update: {},
    create: {
      name: 'Departamento de Capacitación',
      email: 'capacitacion@inapa.gob.do'
    }
  })

  // Crear eventos base
  const event1 = await prisma.event.upsert({
    where: { googleEventId: 'google-event-planning-2025' },
    update: {},
    create: {
      googleEventId: 'google-event-planning-2025',
      title: 'Reunión de Planificación Anual 2025',
      description: 'Reunión estratégica para planificar las actividades y proyectos del año 2025. Se discutirán presupuestos, metas y nuevas iniciativas para mejorar el servicio de agua potable y alcantarillado.',
      location: 'Auditorio Principal INAPA, Santo Domingo',
      startAt: new Date('2025-09-15T09:00:00.000Z'),
      endAt: new Date('2025-09-15T16:00:00.000Z'),
      formToken: 'planning-2025-token',
      organizerId: organizer1.id,
      status: 'active'
    }
  })

  const event2 = await prisma.event.upsert({
    where: { googleEventId: 'google-event-maintenance-workshop' },
    update: {},
    create: {
      googleEventId: 'google-event-maintenance-workshop',
      title: 'Taller de Mantenimiento de Sistemas de Agua',
      description: 'Capacitación técnica dirigida al personal operativo sobre las mejores prácticas en mantenimiento preventivo y correctivo de sistemas de distribución de agua potable.',
      location: 'Centro de Capacitación INAPA, Santiago',
      startAt: new Date('2025-09-22T08:30:00.000Z'),
      endAt: new Date('2025-09-22T17:00:00.000Z'),
      formToken: 'maintenance-workshop-2025',
      organizerId: organizer2.id,
      status: 'active'
    }
  })

  const event3 = await prisma.event.upsert({
    where: { googleEventId: 'google-event-hydric-innovation' },
    update: {},
    create: {
      googleEventId: 'google-event-hydric-innovation',
      title: 'Conferencia Internacional de Innovación Hídrica',
      description: 'Evento magistral con expertos internacionales sobre las últimas tecnologías e innovaciones en gestión de recursos hídricos y sistemas de tratamiento de agua.',
      location: 'Hotel Sheraton Santo Domingo, Malecón',
      startAt: new Date('2025-10-05T08:00:00.000Z'),
      endAt: new Date('2025-10-05T18:00:00.000Z'),
      formToken: 'hydric-innovation-conf-2025',
      organizerId: organizer1.id,
      status: 'active'
    }
  })

  const event4 = await prisma.event.upsert({
    where: { googleEventId: 'google-event-regional-directors' },
    update: {},
    create: {
      googleEventId: 'google-event-regional-directors',
      title: 'Reunión de Directores Regionales',
      description: 'Encuentro mensual de coordinación entre la dirección nacional y los directores de las oficinas regionales para evaluar avances y retos operativos.',
      location: 'Sala de Conferencias INAPA, Oficina Central',
      startAt: new Date('2025-08-28T10:00:00.000Z'),
      endAt: new Date('2025-08-28T15:00:00.000Z'),
      formToken: 'regional-directors-aug-2025',
      organizerId: organizer1.id,
      status: 'active'
    }
  })

  const event5 = await prisma.event.upsert({
    where: { googleEventId: 'google-event-water-quality' },
    update: {},
    create: {
      googleEventId: 'google-event-water-quality',
      title: 'Seminario de Control de Calidad del Agua',
      description: 'Seminario especializado para técnicos de laboratorio sobre protocolos de análisis fisicoquímico y microbiológico del agua potable.',
      location: 'Laboratorio Central INAPA, Santo Domingo',
      startAt: new Date('2025-09-08T09:00:00.000Z'),
      endAt: new Date('2025-09-08T16:30:00.000Z'),
      formToken: 'water-quality-seminar-2025',
      organizerId: organizer2.id,
      status: 'active'
    }
  })

  // Crear algunos invitados de ejemplo para los eventos
  const inviteesData = [
    {
      cedula: '00112345678',
      nombre: 'María Elena González',
      email: 'maria.gonzalez@inapa.gob.do',
      cargo: 'Directora Regional',
      institucion: 'INAPA - Región Norte',
      sexo: 'F',
      telefono: '+1-809-555-0101'
    },
    {
      cedula: '00123456789',
      nombre: 'Roberto Carlos Méndez',
      email: 'roberto.mendez@inapa.gob.do',
      cargo: 'Jefe de Operaciones',
      institucion: 'INAPA - Región Este',
      sexo: 'M',
      telefono: '+1-809-555-0102'
    },
    {
      cedula: '00134567890',
      nombre: 'Ana Patricia Rodríguez',
      email: 'ana.rodriguez@inapa.gob.do',
      cargo: 'Química Analista',
      institucion: 'INAPA - Laboratorio Central',
      sexo: 'F',
      telefono: '+1-809-555-0103'
    },
    {
      cedula: '00145678901',
      nombre: 'Carlos Alberto Fernández',
      email: 'carlos.fernandez@inapa.gob.do',
      cargo: 'Ingeniero de Sistemas',
      institucion: 'INAPA - Sistemas Hidráulicos',
      sexo: 'M',
      telefono: '+1-809-555-0104'
    },
    {
      cedula: '00156789012',
      nombre: 'Luisa María Santos',
      email: 'luisa.santos@inapa.gob.do',
      cargo: 'Coordinadora de Calidad',
      institucion: 'INAPA - Control de Calidad',
      sexo: 'F',
      telefono: '+1-809-555-0105'
    }
  ]

  // Agregar invitados a eventos específicos
  let inviteeIndex = 1
  for (const inviteeData of inviteesData) {
    // Invitar a todos al evento de planificación
    await prisma.invitee.upsert({
      where: { 
        eventId_cedula: {
          eventId: event1.id,
          cedula: inviteeData.cedula
        }
      },
      update: {},
      create: {
        id: `${event1.id}-${inviteeIndex}`,
        ...inviteeData,
        eventId: event1.id
      }
    })
    inviteeIndex++

    // Invitar algunos al taller de mantenimiento
    if (inviteeData.nombre.includes('Roberto') || inviteeData.nombre.includes('Carlos')) {
      await prisma.invitee.upsert({
        where: { 
          eventId_cedula: {
            eventId: event2.id,
            cedula: inviteeData.cedula
          }
        },
        update: {},
        create: {
          id: `${event2.id}-${inviteeIndex}`,
          ...inviteeData,
          eventId: event2.id
        }
      })
      inviteeIndex++
    }

    // Invitar a todos a la conferencia internacional
    await prisma.invitee.upsert({
      where: { 
        eventId_cedula: {
          eventId: event3.id,
          cedula: inviteeData.cedula
        }
      },
      update: {},
      create: {
        id: `${event3.id}-${inviteeIndex}`,
        ...inviteeData,
        eventId: event3.id
      }
    })
    inviteeIndex++

    // Solo algunos a la reunión de directores
    if (inviteeData.nombre.includes('María') || inviteeData.nombre.includes('Roberto')) {
      await prisma.invitee.upsert({
        where: { 
          eventId_cedula: {
            eventId: event4.id,
            cedula: inviteeData.cedula
          }
        },
        update: {},
        create: {
          id: `${event4.id}-${inviteeIndex}`,
          ...inviteeData,
          eventId: event4.id
        }
      })
      inviteeIndex++
    }

    // Solo algunos al seminario de calidad
    if (inviteeData.nombre.includes('Ana') || inviteeData.nombre.includes('Luisa')) {
      await prisma.invitee.upsert({
        where: { 
          eventId_cedula: {
            eventId: event5.id,
            cedula: inviteeData.cedula
          }
        },
        update: {},
        create: {
          id: `${event5.id}-${inviteeIndex}`,
          ...inviteeData,
          eventId: event5.id
        }
      })
      inviteeIndex++
    }
  }

  // Simular algunos check-ins para eventos
  const checkinsData = [
    {
      id: 'checkin-1',
      eventId: event4.id,
      cedula: '00112345678',
      nombre: 'María Elena González',
      cargo: 'Directora Regional',
      institucion: 'INAPA - Región Norte',
      correo: 'maria.gonzalez@inapa.gob.do',
      sexo: 'F',
      telefono: '+1-809-555-0101'
    },
    {
      id: 'checkin-2',
      eventId: event4.id,
      cedula: '00123456789',
      nombre: 'Roberto Carlos Méndez',
      cargo: 'Jefe de Operaciones',
      institucion: 'INAPA - Región Este',
      correo: 'roberto.mendez@inapa.gob.do',
      sexo: 'M',
      telefono: '+1-809-555-0102'
    },
    {
      id: 'checkin-3',
      eventId: event2.id,
      cedula: '00134567890',
      nombre: 'Ana Patricia Rodríguez',
      cargo: 'Química Analista',
      institucion: 'INAPA - Laboratorio Central',
      correo: 'ana.rodriguez@inapa.gob.do',
      sexo: 'F',
      telefono: '+1-809-555-0103'
    }
  ]

  for (const checkinData of checkinsData) {
    await prisma.checkin.upsert({
      where: {
        eventId_cedula: {
          eventId: checkinData.eventId,
          cedula: checkinData.cedula
        }
      },
      update: {},
      create: checkinData
    })
  }

  console.log('✅ Seed completado:')
  console.log(`📋 ${await prisma.event.count()} eventos creados`)
  console.log(`👥 ${await prisma.invitee.count()} invitados registrados`)
  console.log(`✅ ${await prisma.checkin.count()} check-ins realizados`)
  console.log(`⚙️ ${await prisma.systemConfig.count()} configuraciones del sistema`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
