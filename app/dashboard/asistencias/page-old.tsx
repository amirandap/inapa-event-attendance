'use client'

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Download, Users, Calendar, Loader2 } from 'lucide-react'
import { useCheckins, useEvents } from '@/lib/hooks/useApi'
import { useState } from 'react'
import { formatDate } from '@/lib/utils/dates'

export default function AsistenciasPage() {
  const { checkins, loading: checkinsLoading, error } = useCheckins()
  const { events, loading: eventsLoading } = useEvents()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('all-events')

  const isLoading = checkinsLoading || eventsLoading

  // Filtrar check-ins
  const filteredCheckins = checkins.filter(checkin => {
    const matchesSearch = searchTerm === '' || 
      checkin.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checkin.cedula?.includes(searchTerm) ||
      checkin.correo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checkin.institucion?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesEvent = selectedEventId === 'all-events' || checkin.eventId === selectedEventId
    
    return matchesSearch && matchesEvent
  })

  // Calcular estadísticas
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))

  const stats = {
    totalCheckins: checkins.length,
    todayCheckins: checkins.filter(c => new Date(c.createdAt) >= todayStart).length,
    weekCheckins: checkins.filter(c => new Date(c.createdAt) >= weekStart).length,
    averagePerEvent: events.length > 0 ? Math.round(checkins.length / events.length) : 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asistencias</h1>
          <p className="text-gray-600">Monitorea y gestiona el registro de asistencias</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalCheckins}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCheckins === 0 ? 'No hay registros' : `${stats.totalCheckins} registros totales`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.todayCheckins}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.todayCheckins === 0 ? 'No hay registros hoy' : 'Registros de hoy'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.weekCheckins}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.weekCheckins === 0 ? 'No hay registros' : 'Registros semanales'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.averagePerEvent}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.averagePerEvent === 0 ? 'No hay datos' : 'Por evento'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, cédula o evento..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Seleccionar evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-events">Todos los eventos</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select defaultValue="all-time">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">Todo el tiempo</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600 text-sm">
              Error al cargar asistencias: {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabla de asistencias */}
      <Card>
        <CardHeader>
          <CardTitle>
            Registros de Asistencias
            {!isLoading && filteredCheckins.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredCheckins.length} registro{filteredCheckins.length !== 1 ? 's' : ''})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Institución</TableHead>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>Cargando registros...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredCheckins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>
                        {searchTerm || selectedEventId !== 'all-events' 
                          ? 'No se encontraron registros con los filtros aplicados'
                          : 'No hay registros de asistencias'
                        }
                      </p>
                      <p className="text-sm mt-2">
                        {!searchTerm && selectedEventId === 'all-events'
                          ? 'Los registros aparecerán aquí cuando los participantes se registren'
                          : 'Intenta ajustar los filtros de búsqueda'
                        }
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCheckins.map((checkin) => {
                    const event = events.find(e => e.id === checkin.eventId)
                    return (
                      <TableRow key={checkin.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{checkin.nombre}</div>
                            {checkin.cargo && (
                              <div className="text-sm text-gray-500">{checkin.cargo}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{checkin.cedula}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {event?.title || 'Evento desconocido'}
                          </div>
                        </TableCell>
                        <TableCell>{checkin.institucion || '-'}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(new Date(checkin.createdAt), 'PPpp')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Registrado
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de tendencias (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencias de Asistencias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Gráfico de tendencias</p>
              <p className="text-sm mt-2">
                {checkins.length > 0 
                  ? 'Visualización de datos disponible próximamente'
                  : 'Visualización de datos cuando haya registros disponibles'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
