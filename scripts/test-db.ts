import { prisma } from '@/lib/db'

async function testDatabase() {
  try {
    // Verificar conexión
    console.log('🔍 Verificando conexión a la base de datos...')
    
    // Contar registros en SystemConfig
    const configCount = await prisma.systemConfig.count()
    console.log(`✅ SystemConfig registros: ${configCount}`)
    
    // Listar configuraciones
    const configs = await prisma.systemConfig.findMany()
    console.log('✅ Configuraciones disponibles:')
    configs.forEach(config => {
      console.log(`   - ${config.key}: ${config.value}`)
    })
    
    console.log('🎉 Base de datos funcionando correctamente!')
    
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Solo ejecutar si se llama directamente
if (require.main === module) {
  testDatabase()
}

export { testDatabase }
