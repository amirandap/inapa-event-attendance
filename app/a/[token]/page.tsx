import { AttendanceForm } from '@/components/forms/AttendanceForm'
import { Card, CardContent } from '@/components/ui/card'

interface AttendancePageProps {
  params: {
    token: string
  }
}

// Esta será la página pública para el formulario de asistencia
export default async function AttendancePage({ params }: AttendancePageProps) {
  const { token } = await params

  // Por ahora mostraremos un formulario de ejemplo
  // Cuando implementemos las APIs, aquí consultaremos el evento por token
  
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-inapa-primary mb-4">
            Registro de Asistencia
          </h1>
          <p className="text-gray-600">
            Complete el formulario para registrar su asistencia al evento
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-2">
            <AttendanceForm
              eventId="ejemplo-event-id"
              eventTitle="Evento de Ejemplo - Reunión INAPA"
            />
          </div>

          {/* Información del evento */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Información del Evento</h3>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Token:</p>
                    <p className="text-gray-600 font-mono">{token}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-700">Estado:</p>
                    <p className="text-green-600">✅ Activo para registro</p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-700">Nota:</p>
                    <p className="text-gray-600">
                      Esta es una página de ejemplo. Una vez implementadas las APIs, 
                      mostrará la información real del evento.
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Instrucciones:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Complete todos los campos obligatorios</li>
                    <li>• Asegúrese de ingresar su cédula correctamente</li>
                    <li>• Su email es opcional pero recomendado</li>
                    <li>• Recibirá confirmación inmediata</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
