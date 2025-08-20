import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  HelpCircle, 
  BookOpen, 
  Video, 
  FileText, 
  MessageCircle,
  Search,
  Download,
  ExternalLink,
  Phone,
  Mail
} from 'lucide-react'

export default function AyudaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centro de Ayuda</h1>
          <p className="text-gray-600">Encuentra respuestas y recursos para usar el sistema</p>
        </div>
      </div>

      {/* Búsqueda de ayuda */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Buscar en la ayuda..." 
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categorías de ayuda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
              Guía de Inicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Aprende los conceptos básicos para comenzar a usar el sistema de asistencias.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <FileText className="h-4 w-4 mr-2 text-gray-400" />
                Crear tu primer evento
              </li>
              <li className="flex items-center">
                <FileText className="h-4 w-4 mr-2 text-gray-400" />
                Invitar participantes
              </li>
              <li className="flex items-center">
                <FileText className="h-4 w-4 mr-2 text-gray-400" />
                Registrar asistencias
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="h-5 w-5 mr-2 text-green-500" />
              Tutoriales en Video
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Ve tutoriales paso a paso sobre las funcionalidades del sistema.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <Video className="h-4 w-4 mr-2 text-gray-400" />
                Configuración inicial (5 min)
              </li>
              <li className="flex items-center">
                <Video className="h-4 w-4 mr-2 text-gray-400" />
                Gestión de eventos (8 min)
              </li>
              <li className="flex items-center">
                <Video className="h-4 w-4 mr-2 text-gray-400" />
                Reportes y estadísticas (6 min)
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="h-5 w-5 mr-2 text-purple-500" />
              Preguntas Frecuentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Encuentra respuestas rápidas a las preguntas más comunes.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <HelpCircle className="h-4 w-4 mr-2 text-gray-400" />
                ¿Cómo validar cédulas?
              </li>
              <li className="flex items-center">
                <HelpCircle className="h-4 w-4 mr-2 text-gray-400" />
                ¿Cómo exportar reportes?
              </li>
              <li className="flex items-center">
                <HelpCircle className="h-4 w-4 mr-2 text-gray-400" />
                ¿Cómo configurar emails?
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Documentación y recursos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Documentación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <Download className="h-4 w-4 mr-3 text-gray-400" />
                  <div>
                    <p className="font-medium">Manual de Usuario</p>
                    <p className="text-sm text-gray-600">Guía completa del sistema (PDF)</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-3 text-gray-400" />
                  <div>
                    <p className="font-medium">API Documentation</p>
                    <p className="text-sm text-gray-600">Para desarrolladores e integraciones</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-3 text-gray-400" />
                  <div>
                    <p className="font-medium">Notas de la Versión</p>
                    <p className="text-sm text-gray-600">Cambios y mejoras recientes</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Soporte Técnico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">¿Necesitas ayuda inmediata?</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Nuestro equipo de soporte está disponible para ayudarte.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-blue-600" />
                    <span>+1 (809) 123-4567</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-blue-600" />
                    <span>soporte@inapa.gob.do</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Horarios de Atención</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Lunes a Viernes: 8:00 AM - 5:00 PM</p>
                  <p>Sábados: 9:00 AM - 1:00 PM</p>
                  <p>Domingos: Cerrado</p>
                </div>
              </div>

              <Button className="w-full bg-inapa-primary hover:bg-inapa-primary/90">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contactar Soporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado del sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <div>
                <p className="font-medium">Todos los sistemas operativos</p>
                <p className="text-sm text-gray-600">Última actualización: hace 5 minutos</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Ver Detalles
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
