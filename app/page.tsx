export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-inapa-primary mb-4">
            Sistema de Registro de Asistencias
          </h1>
          <h2 className="text-2xl text-gray-600 mb-8">
            Instituto Nacional de Aguas Potables y Alcantarillados (INAPA)
          </h2>
          
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-6">
                <div className="w-24 h-24 bg-inapa-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">INAPA</span>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-4">Componentes de UI Completados</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="text-left">
                  <h4 className="font-semibold text-green-600 mb-2">✅ Configurado:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Next.js 14 + TypeScript</li>
                    <li>• Tailwind CSS + shadcn/ui</li>
                    <li>• Estructura de directorios</li>
                    <li>• Variables de entorno</li>
                    <li>• Base de datos SQLite</li>
                    <li>• Prisma ORM + Migraciones</li>
                    <li>• Modelos de datos</li>
                    <li>• Componentes UI</li>
                    <li>• Formulario de asistencia</li>
                    <li>• Dashboard administrativo</li>
                  </ul>
                </div>
                
                <div className="text-left">
                  <h4 className="font-semibold text-blue-600 mb-2">🔧 Próximos pasos:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Endpoints API REST</li>
                    <li>• Integrar Google APIs</li>
                    <li>• Sistema de reportes</li>
                    <li>• Jobs y notificaciones</li>
                    <li>• Testing y validación</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>UI Completado:</strong> Dashboard y formularios funcionando.
                    <a href="/dashboard" className="ml-2 underline">
                      Ver Dashboard →
                    </a>
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    <strong>Progreso:</strong> Tarea 4 completada - Componentes UI implementados
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <strong>Demo:</strong> Formulario de asistencia disponible.
                    <a href="/a/demo-token" className="ml-2 underline">
                      Ver Demo →
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
