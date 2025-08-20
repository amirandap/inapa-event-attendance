'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter, Calendar, Loader2 } from 'lucide-react'
import { EventCard } from '@/components/events/EventCard'
import { useEvents } from '@/lib/hooks/useApi'
import { useState } from 'react'

export default function EventosPage() {
  const { events, loading, error, loadEvents } = useEvents()
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrar eventos por término de búsqueda
  const filteredEvents = events.filter(event => 
    event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  // Calcular estadísticas
  const stats = {
    totalEvents: events.length,
    activeEvents: events.filter(e => e.status === 'active').length,
    thisMonthEvents: events.filter(e => {
      const eventDate = new Date(e.startAt)
      const now = new Date()
      return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear()
    }).length,
    averageAttendance: 0 // Se calculará con datos de asistencia
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-600">Gestiona todos los eventos y reuniones</p>
        </div>
        <Button className="bg-inapa-primary hover:bg-inapa-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Evento
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar eventos..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Calendario
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalEvents}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalEvents === 0 ? 'No hay eventos' : `${stats.totalEvents} eventos registrados`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.activeEvents}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeEvents === 0 ? 'No hay eventos activos' : `${stats.activeEvents} eventos activos`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.thisMonthEvents}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.thisMonthEvents === 0 ? 'No hay eventos programados' : 'Eventos programados'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Asistencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${stats.averageAttendance}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.averageAttendance === 0 ? 'No hay datos' : 'Promedio de asistencia'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600 text-sm">
              Error al cargar eventos: {error}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => loadEvents()}
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de eventos */}
      <Card>
        <CardHeader>
          <CardTitle>
            {searchTerm ? `Resultados para "${searchTerm}"` : 'Todos los Eventos'}
            {!loading && filteredEvents.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Cargando eventos...</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No se encontraron eventos' : 'No hay eventos'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Crea tu primer evento o configura la integración con Google Calendar'
                }
              </p>
              {!searchTerm && (
                <Button className="bg-inapa-primary hover:bg-inapa-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Evento
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
