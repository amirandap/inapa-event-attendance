#!/usr/bin/env tsx

/**
 * Script para inicializar datos básicos de la aplicación
 */

// Cargar variables de entorno
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { prisma } from '../lib/prisma';

async function seedDatabase() {
  console.log('🌱 Inicializando datos básicos...\n');

  try {
    // 1. Crear organizador por defecto
    console.log('1️⃣ Creando organizador por defecto...');
    
    const defaultOrganizer = await prisma.organizer.upsert({
      where: { email: 'minutas@inapa.gob.do' },
      update: {
        name: 'Sistema de Minutas INAPA'
      },
      create: {
        email: 'minutas@inapa.gob.do',
        name: 'Sistema de Minutas INAPA'
      }
    });

    console.log('✅ Organizador creado/actualizado:', {
      id: defaultOrganizer.id,
      email: defaultOrganizer.email,
      name: defaultOrganizer.name
    });

    // 2. Crear organizador adicional para administración
    console.log('\n2️⃣ Creando organizador de administración...');
    
    const adminOrganizer = await prisma.organizer.upsert({
      where: { email: 'admin@inapa.gob.do' },
      update: {
        name: 'Administrador INAPA'
      },
      create: {
        email: 'admin@inapa.gob.do',
        name: 'Administrador INAPA'
      }
    });

    console.log('✅ Organizador admin creado/actualizado:', {
      id: adminOrganizer.id,
      email: adminOrganizer.email,
      name: adminOrganizer.name
    });

    // 3. Mostrar estadísticas
    console.log('\n3️⃣ Estadísticas de la base de datos:');
    
    const stats = {
      organizers: await prisma.organizer.count(),
      events: await prisma.event.count(),
      invitees: await prisma.invitee.count(),
      checkins: await prisma.checkin.count(),
      calendarAuth: await prisma.calendarAuth.count()
    };

    console.log('📊 Estadísticas actuales:');
    console.log(`   • Organizadores: ${stats.organizers}`);
    console.log(`   • Eventos: ${stats.events}`);
    console.log(`   • Invitados: ${stats.invitees}`);
    console.log(`   • Check-ins: ${stats.checkins}`);
    console.log(`   • Autorizaciones de calendario: ${stats.calendarAuth}`);

    // 4. Listar organizadores disponibles
    console.log('\n4️⃣ Organizadores disponibles:');
    const allOrganizers = await prisma.organizer.findMany({
      orderBy: { id: 'asc' }
    });

    allOrganizers.forEach(org => {
      console.log(`   ID: ${org.id} | ${org.name} (${org.email})`);
    });

    console.log('\n✅ Inicialización completada exitosamente!');
    console.log('\n🎯 Información importante:');
    console.log(`   • Organizador por defecto ID: ${defaultOrganizer.id}`);
    console.log(`   • Usar este ID en la sincronización de calendario`);
    console.log(`   • Email del organizador: ${defaultOrganizer.email}`);

    return {
      defaultOrganizerId: defaultOrganizer.id,
      adminOrganizerId: adminOrganizer.id,
      stats
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ Error durante la inicialización:', errorMessage);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedDatabase()
    .then((result) => {
      console.log('\n🎉 Base de datos inicializada correctamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

export { seedDatabase };
