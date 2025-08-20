import { Toaster } from 'sonner'

export const metadata = {
  title: 'Sistema de Registro de Asistencias - INAPA',
  description: 'Registro digital de asistencias para reuniones del Instituto Nacional de Aguas Potables y Alcantarillados',
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-inapa-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">INAPA</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-inapa-primary">INAPA</h1>
                <p className="text-sm text-gray-600">Sistema de Registro de Asistencias</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600">
            <p>&copy; 2024 Instituto Nacional de Aguas Potables y Alcantarillados (INAPA)</p>
            <p className="mt-1">Todos los derechos reservados</p>
          </div>
        </div>
      </footer>
      
      <Toaster />
    </div>
  )
}
