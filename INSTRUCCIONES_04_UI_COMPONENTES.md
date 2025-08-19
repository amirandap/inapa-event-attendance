# INSTRUCCIONES 04: UI/UX - Componentes y Páginas

## Objetivo
Crear la interfaz de usuario completa con Next.js 14 App Router, incluyendo el formulario público de asistencia, panel de administración y todos los componentes necesarios.

## Tareas a Ejecutar

### 1. Configuración de Layouts

#### 1.1 Layout Público
Crear `app/(public)/layout.tsx`:

```tsx
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'] })

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
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-4">
                  <img
                    src="/images/inapa-logo.png"
                    alt="INAPA"
                    className="h-12 w-auto"
                  />
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
        </div>
        <Toaster />
      </body>
    </html>
  )
}
```

#### 1.2 Layout Dashboard
Crear `app/dashboard/layout.tsx`:

```tsx
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Dashboard - Sistema de Registro de Asistencias',
  description: 'Panel de administración para gestionar eventos y asistencias',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="flex h-screen bg-gray-100">
          <DashboardSidebar />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader />
            
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div className="container mx-auto px-6 py-8">
                {children}
              </div>
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
```

### 2. Componentes de Dashboard

#### 2.1 Sidebar del Dashboard
Crear `components/dashboard/DashboardSidebar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  CalendarDays, 
  Users, 
  BarChart3, 
  Settings, 
  HelpCircle,
  Home
} from 'lucide-react'

const navigation = [
  { name: 'Inicio', href: '/dashboard', icon: Home },
  { name: 'Eventos', href: '/dashboard/eventos', icon: CalendarDays },
  { name: 'Asistencias', href: '/dashboard/asistencias', icon: Users },
  { name: 'Reportes', href: '/dashboard/reportes', icon: BarChart3 },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
  { name: 'Ayuda', href: '/dashboard/ayuda', icon: HelpCircle },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg">
      {/* Logo */}
      <div className="flex items-center justify-center px-4 py-6 border-b">
        <img
          src="/images/inapa-logo.png"
          alt="INAPA"
          className="h-10 w-auto"
        />
        <div className="ml-3">
          <h2 className="text-lg font-bold text-inapa-primary">INAPA</h2>
          <p className="text-sm text-gray-600">Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-inapa-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t text-center">
        <p className="text-xs text-gray-500">
          v1.0.0 - Sistema de Asistencias
        </p>
      </div>
    </div>
  )
}
```

#### 2.2 Header del Dashboard
Crear `components/dashboard/DashboardHeader.tsx`:

```tsx
'use client'

import { Bell, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function DashboardHeader() {
  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex items-center space-x-4 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar eventos, asistentes..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configuración</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Cerrar Sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
```

### 3. Componentes de Eventos

#### 3.1 Header de Evento
Crear `components/events/EventHeader.tsx`:

```tsx
import { CalendarDays, MapPin, Clock, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EventWithRelations } from '@/lib/types'
import { formatDate } from '@/lib/utils/dates'

interface EventHeaderProps {
  event: EventWithRelations
}

export function EventHeader({ event }: EventHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isEventActive = new Date() < event.endAt && event.status === 'active'

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {event.title}
            </h1>
            {event.description && (
              <p className="text-gray-600 text-lg">{event.description}</p>
            )}
          </div>
          <Badge className={getStatusColor(event.status)}>
            {event.status === 'active' ? 'Activo' : 
             event.status === 'cancelled' ? 'Cancelado' : 'Completado'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Fecha</p>
              <p className="text-sm text-gray-600">
                {formatDate(event.startAt, 'dd/MM/yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Horario</p>
              <p className="text-sm text-gray-600">
                {formatDate(event.startAt, 'HH:mm')} - {formatDate(event.endAt, 'HH:mm')}
              </p>
            </div>
          </div>

          {event.location && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Ubicación</p>
                <p className="text-sm text-gray-600">{event.location}</p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Organizador</p>
              <p className="text-sm text-gray-600">
                {event.organizer.name || event.organizer.email}
              </p>
            </div>
          </div>
        </div>

        {isEventActive && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              🟢 Evento activo - Los participantes pueden registrar su asistencia
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

#### 3.2 Tarjeta de Evento
Crear `components/events/EventCard.tsx`:

```tsx
import Link from 'next/link'
import { CalendarDays, MapPin, Users, QrCode } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EventWithCounts } from '@/lib/types'
import { formatDate } from '@/lib/utils/dates'

interface EventCardProps {
  event: EventWithCounts
}

export function EventCard({ event }: EventCardProps) {
  const registrados = event._count.checkins
  const invitados = event._count.invitees
  const porcentajeAsistencia = invitados > 0 ? Math.round((registrados / invitados) * 100) : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isEventSoon = new Date(event.startAt).getTime() - Date.now() < 24 * 60 * 60 * 1000
  const isEventActive = new Date() < event.endAt && event.status === 'active'

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">
              {event.title}
            </h3>
            <div className="flex items-center text-sm text-gray-600 space-x-4">
              <div className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-1" />
                {formatDate(event.startAt, 'dd/MM/yyyy HH:mm')}
              </div>
              {event.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="truncate max-w-32">{event.location}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge className={getStatusColor(event.status)}>
              {event.status === 'active' ? 'Activo' : 
               event.status === 'cancelled' ? 'Cancelado' : 'Completado'}
            </Badge>
            {isEventSoon && isEventActive && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Próximo
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{registrados}</div>
            <div className="text-xs text-gray-600">Registrados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{invitados}</div>
            <div className="text-xs text-gray-600">Invitados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{porcentajeAsistencia}%</div>
            <div className="text-xs text-gray-600">Asistencia</div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${porcentajeAsistencia}%` }}
          />
        </div>

        {/* Acciones */}
        <div className="flex space-x-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/eventos/${event.id}`}>
              <Users className="h-4 w-4 mr-1" />
              Ver Detalles
            </Link>
          </Button>
          
          {isEventActive && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/a/${event.formToken}`}>
                <QrCode className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

#### 3.3 Tabla de Invitados
Crear `components/events/InviteesTable.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Search, Mail, User, Filter } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Invitee } from '@prisma/client'

interface InviteesTableProps {
  invitees: Invitee[]
  checkedInEmails: Set<string>
}

export function InviteesTable({ invitees, checkedInEmails }: InviteesTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [responseFilter, setResponseFilter] = useState<string>('all')

  const filteredInvitees = invitees.filter(invitee => {
    const matchesSearch = 
      invitee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitee.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesResponse = responseFilter === 'all' || invitee.response === responseFilter
    
    return matchesSearch && matchesResponse
  })

  const getResponseBadge = (response: string | null, hasCheckedIn: boolean) => {
    if (hasCheckedIn) {
      return <Badge className="bg-green-100 text-green-800">Registrado</Badge>
    }

    switch (response) {
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800">Confirmado</Badge>
      case 'declined':
        return <Badge className="bg-red-100 text-red-800">Declinó</Badge>
      case 'tentative':
        return <Badge className="bg-yellow-100 text-yellow-800">Tentativo</Badge>
      default:
        return <Badge variant="outline">Sin respuesta</Badge>
    }
  }

  const stats = {
    total: invitees.length,
    accepted: invitees.filter(i => i.response === 'accepted').length,
    declined: invitees.filter(i => i.response === 'declined').length,
    tentative: invitees.filter(i => i.response === 'tentative').length,
    noResponse: invitees.filter(i => !i.response || i.response === 'needsAction').length,
    checkedIn: invitees.filter(i => checkedInEmails.has(i.email)).length
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">{stats.checkedIn}</div>
          <div className="text-sm text-gray-600">Registrados</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">{stats.accepted}</div>
          <div className="text-sm text-gray-600">Confirmados</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-lg font-bold text-red-600">{stats.declined}</div>
          <div className="text-sm text-gray-600">Declinaron</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-lg font-bold text-yellow-600">{stats.tentative}</div>
          <div className="text-sm text-gray-600">Tentativos</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-600">{stats.noResponse}</div>
          <div className="text-sm text-gray-600">Sin respuesta</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={responseFilter} onValueChange={setResponseFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por respuesta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las respuestas</SelectItem>
            <SelectItem value="accepted">Confirmados</SelectItem>
            <SelectItem value="declined">Declinaron</SelectItem>
            <SelectItem value="tentative">Tentativos</SelectItem>
            <SelectItem value="needsAction">Sin respuesta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invitado</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Respuesta</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvitees.map((invitee) => {
              const hasCheckedIn = checkedInEmails.has(invitee.email)
              return (
                <TableRow key={invitee.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {invitee.name || 'Sin nombre'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{invitee.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getResponseBadge(invitee.response, hasCheckedIn)}
                  </TableCell>
                  <TableCell>
                    {hasCheckedIn ? (
                      <Badge className="bg-green-100 text-green-800">
                        ✓ Asistió
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        No registrado
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {filteredInvitees.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron invitados que coincidan con los filtros
          </div>
        )}
      </div>
    </div>
  )
}
```

### 4. Formulario de Asistencia

#### 4.1 Formulario Principal
Crear `components/forms/AttendanceForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, User, Mail, Phone, Building, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { CheckinFormData } from '@/lib/types'
import { validateCedula } from '@/lib/utils/validation'

const attendanceSchema = z.object({
  cedula: z.string()
    .min(11, 'La cédula debe tener 11 dígitos')
    .max(11, 'La cédula debe tener 11 dígitos')
    .regex(/^\d{11}$/, 'La cédula debe contener solo números')
    .refine(validateCedula, 'Cédula dominicana inválida'),
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  cargo: z.string().optional(),
  institucion: z.string().optional(),
  correo: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  sexo: z.enum(['M', 'F', 'Otro']).optional(),
  telefono: z.string()
    .regex(/^(\+1|1)?[0-9]{10}$/, 'Teléfono inválido (formato: 8091234567)')
    .optional()
    .or(z.literal('')),
})

interface AttendanceFormProps {
  eventId: string
  eventTitle: string
  onSuccess?: () => void
}

export function AttendanceForm({ eventId, eventTitle, onSuccess }: AttendanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<CheckinFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      cedula: '',
      nombre: '',
      cargo: '',
      institucion: '',
      correo: '',
      sexo: undefined,
      telefono: '',
    },
  })

  const onSubmit = async (data: CheckinFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          ...data,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al registrar asistencia')
      }

      toast({
        title: '¡Asistencia registrada!',
        description: `Bienvenido(a) ${data.nombre}. Su asistencia ha sido registrada exitosamente.`,
        variant: 'default',
      })

      form.reset()
      onSuccess?.()

    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error al registrar',
        description: error instanceof Error ? error.message : 'Ocurrió un error inesperado',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-inapa-primary">
          Registro de Asistencia
        </CardTitle>
        <p className="text-gray-600">{eventTitle}</p>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Cédula */}
          <div className="space-y-2">
            <Label htmlFor="cedula" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Cédula de Identidad *
            </Label>
            <Input
              id="cedula"
              placeholder="12345678901"
              maxLength={11}
              {...form.register('cedula')}
              className={form.formState.errors.cedula ? 'border-red-500' : ''}
            />
            {form.formState.errors.cedula && (
              <p className="text-sm text-red-500">
                {form.formState.errors.cedula.message}
              </p>
            )}
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Nombre Completo *
            </Label>
            <Input
              id="nombre"
              placeholder="Ingrese su nombre completo"
              {...form.register('nombre')}
              className={form.formState.errors.nombre ? 'border-red-500' : ''}
            />
            {form.formState.errors.nombre && (
              <p className="text-sm text-red-500">
                {form.formState.errors.nombre.message}
              </p>
            )}
          </div>

          {/* Cargo */}
          <div className="space-y-2">
            <Label htmlFor="cargo" className="flex items-center">
              <Briefcase className="h-4 w-4 mr-2" />
              Cargo
            </Label>
            <Input
              id="cargo"
              placeholder="Ej: Director, Analista, Coordinador"
              {...form.register('cargo')}
            />
          </div>

          {/* Institución */}
          <div className="space-y-2">
            <Label htmlFor="institucion" className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Institución
            </Label>
            <Input
              id="institucion"
              placeholder="Ej: INAPA, Ministerio de Salud"
              {...form.register('institucion')}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="correo" className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              Correo Electrónico
            </Label>
            <Input
              id="correo"
              type="email"
              placeholder="ejemplo@email.com"
              {...form.register('correo')}
              className={form.formState.errors.correo ? 'border-red-500' : ''}
            />
            {form.formState.errors.correo && (
              <p className="text-sm text-red-500">
                {form.formState.errors.correo.message}
              </p>
            )}
          </div>

          {/* Sexo */}
          <div className="space-y-2">
            <Label>Sexo</Label>
            <Select onValueChange={(value) => form.setValue('sexo', value as 'M' | 'F' | 'Otro')}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono" className="flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              Teléfono
            </Label>
            <Input
              id="telefono"
              placeholder="8091234567"
              {...form.register('telefono')}
              className={form.formState.errors.telefono ? 'border-red-500' : ''}
            />
            {form.formState.errors.telefono && (
              <p className="text-sm text-red-500">
                {form.formState.errors.telefono.message}
              </p>
            )}
          </div>

          {/* Botón de envío */}
          <Button
            type="submit"
            className="w-full bg-inapa-primary hover:bg-inapa-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar Asistencia'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>* Campos obligatorios</p>
          <p className="mt-2">
            Al registrar su asistencia acepta el tratamiento de sus datos personales
            conforme a la Ley 172-13 de República Dominicana.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 5. Utilidades y Validaciones

#### 5.1 Validación de Cédula
Crear `lib/utils/validation.ts`:

```typescript
/**
 * Validar cédula dominicana usando el algoritmo oficial
 */
export function validateCedula(cedula: string): boolean {
  if (!/^\d{11}$/.test(cedula)) {
    return false
  }

  const digits = cedula.split('').map(Number)
  const checkDigit = digits[10]
  
  // Multiplicadores para cada posición
  const multipliers = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2]
  
  let sum = 0
  for (let i = 0; i < 10; i++) {
    let product = digits[i] * multipliers[i]
    if (product > 9) {
      product = Math.floor(product / 10) + (product % 10)
    }
    sum += product
  }
  
  const remainder = sum % 10
  const calculatedCheckDigit = remainder === 0 ? 0 : 10 - remainder
  
  return calculatedCheckDigit === checkDigit
}

/**
 * Formatear cédula para mostrar
 */
export function formatCedula(cedula: string): string {
  if (cedula.length === 11) {
    return `${cedula.slice(0, 3)}-${cedula.slice(3, 10)}-${cedula.slice(10)}`
  }
  return cedula
}

/**
 * Validar email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validar teléfono dominicano
 */
export function validateDominicanPhone(phone: string): boolean {
  // Formato: 8091234567 o +18091234567 o 18091234567
  const phoneRegex = /^(\+1|1)?[0-9]{10}$/
  return phoneRegex.test(phone.replace(/\s|-/g, ''))
}
```

#### 5.2 Utilidades de Fechas
Crear `lib/utils/dates.ts`:

```typescript
import { format, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formatear fecha con formato específico
 */
export function formatDate(date: Date | string, pattern: string = 'PP'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    if (!isValid(dateObj)) {
      return 'Fecha inválida'
    }
    
    return format(dateObj, pattern, { locale: es })
  } catch (error) {
    console.error('Error formateando fecha:', error)
    return 'Fecha inválida'
  }
}

/**
 * Obtener diferencia en minutos entre dos fechas
 */
export function getMinutesDifference(date1: Date, date2: Date): number {
  return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60))
}

/**
 * Verificar si un evento está activo
 */
export function isEventActive(startAt: Date, endAt: Date): boolean {
  const now = new Date()
  return now >= startAt && now <= endAt
}

/**
 * Verificar si un evento está próximo (próximas 24 horas)
 */
export function isEventSoon(startAt: Date): boolean {
  const now = new Date()
  const hoursUntilEvent = (startAt.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursUntilEvent > 0 && hoursUntilEvent <= 24
}
```

## Entregables

✅ Layout público y dashboard configurados  
✅ Componentes de dashboard (sidebar, header) implementados  
✅ Componentes de eventos (header, card, tabla de invitados) implementados  
✅ Formulario de asistencia completo con validaciones  
✅ Utilidades de validación y fechas  
✅ Interfaz responsive y accesible  

## Siguiente Paso
Continuar con **INSTRUCCIONES_05_APIS_ENDPOINTS.md** para implementar todos los endpoints de la API.
