import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { CalendarAuthManager } from '@/components/calendar/CalendarAuthManager'
import CalendarSyncManager from '@/components/calendar/CalendarSyncManager'
import { GoogleServiceAccountConfig } from '@/components/calendar/GoogleServiceAccountConfig'
import { 
  Settings, 
  Users, 
  Mail, 
  Shield, 
  Database,
  Bell,
  Palette,
  Globe,
  Calendar
} from 'lucide-react'

export default function ConfiguracionPage() {
  // En una app real, obtienes estos valores del contexto de usuario/sesión
  const userId = "user-123"; // ID del usuario logueado
  const userEmail = "admin@inapa.gob.do"; // Email del usuario logueado

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600">Administra la configuración del sistema</p>
        </div>
        <Button className="bg-inapa-primary hover:bg-inapa-primary/90">
          Guardar Cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menú lateral de configuración */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categorías</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start bg-inapa-primary/10 text-inapa-primary">
                <Settings className="h-4 w-4 mr-2" />
                General
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Google Calendar
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Usuarios
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Seguridad
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Database className="h-4 w-4 mr-2" />
                Base de Datos
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Panel de configuración */}
        <div className="lg:col-span-3 space-y-6">
          {/* Configuración de Google Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Integración con Google Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarAuthManager userId={userId} userEmail={userEmail} />
            </CardContent>
          </Card>

          {/* Sincronización de Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Sincronización de Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarSyncManager />
            </CardContent>
          </Card>

          {/* Configuración General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configuración General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="org-name">Nombre de la Organización</Label>
                  <Input 
                    id="org-name" 
                    defaultValue="Instituto Nacional de Aguas Potables y Alcantarillados" 
                  />
                </div>
                <div>
                  <Label htmlFor="org-short">Nombre Corto</Label>
                  <Input id="org-short" defaultValue="INAPA" />
                </div>
              </div>

              <div>
                <Label htmlFor="org-description">Descripción</Label>
                <Textarea 
                  id="org-description"
                  placeholder="Descripción de la organización..."
                  className="h-20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select defaultValue="america/santo_domingo">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america/santo_domingo">América/Santo Domingo</SelectItem>
                      <SelectItem value="america/new_york">América/Nueva York</SelectItem>
                      <SelectItem value="europe/madrid">Europa/Madrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Select defaultValue="es">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración de Eventos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Configuración de Eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Registro Automático</Label>
                  <p className="text-sm text-gray-600">Permitir auto-registro en eventos públicos</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Confirmación de Asistencia</Label>
                  <p className="text-sm text-gray-600">Requerir confirmación para eventos</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-capacity">Capacidad Máxima por Defecto</Label>
                  <Input id="max-capacity" type="number" defaultValue="100" />
                </div>
                <div>
                  <Label htmlFor="remind-days">Días de Recordatorio</Label>
                  <Input id="remind-days" type="number" defaultValue="3" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email de Bienvenida</Label>
                  <p className="text-sm text-gray-600">Enviar email al registrar nuevos asistentes</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Recordatorios Automáticos</Label>
                  <p className="text-sm text-gray-600">Enviar recordatorios antes de eventos</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Confirmación de Asistencia</Label>
                  <p className="text-sm text-gray-600">Notificar cuando alguien confirme asistencia</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Personalización */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Personalización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="logo-url">URL del Logo</Label>
                <Input 
                  id="logo-url" 
                  placeholder="https://ejemplo.com/logo.png"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primary-color">Color Primario</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      id="primary-color" 
                      type="color" 
                      defaultValue="#006837" 
                      className="w-12 h-10 p-1"
                    />
                    <Input defaultValue="#006837" className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary-color">Color Secundario</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      id="secondary-color" 
                      type="color" 
                      defaultValue="#8CC63F" 
                      className="w-12 h-10 p-1"
                    />
                    <Input defaultValue="#8CC63F" className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="accent-color">Color de Acento</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      id="accent-color" 
                      type="color" 
                      defaultValue="#FFF200" 
                      className="w-12 h-10 p-1"
                    />
                    <Input defaultValue="#FFF200" className="flex-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
