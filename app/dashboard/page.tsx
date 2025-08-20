'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Users, BarChart3, Clock, Loader2 } from 'lucide-react'
import { useStats, useEvents, useCheckins } from '@/lib/hooks/useApi'
import { formatDate } from '@/lib/utils/dates'

export default function DashboardPage() {
  const { stats, loading: statsLoading, error: statsError } = useStats()
  const { events, loading: eventsLoading } = useEvents()
  const { checkins, loading: checkinsLoading } = useCheckins()

  const isLoading = statsLoading || eventsLoading || checkinsLoading

  // Calcular estadísticas locales como fallback
  const localStats = {
    totalEvents: events?.length || 0,
    activeEvents: events?.filter(e => e.status === 'active')?.length || 0,
    totalCheckins: checkins?.length || 0,
    averageAttendance: events?.length > 0 ? Math.round((checkins?.length || 0) / events.length * 100) : 0
  }

  // Usar stats de la API si están disponibles, sino usar stats locales
  const displayStats = {
    totalEvents: stats?.totalEvents ?? localStats.totalEvents,
    activeEvents: stats?.activeEvents ?? localStats.activeEvents,
    totalAttendances: stats?.totalAttendances ?? localStats.totalCheckins,
    averageAttendance: stats?.averageAttendance ?? localStats.averageAttendance
  }

  // Eventos recientes (últimos 5)
  const recentEvents = events?.slice(0, 5) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Bienvenido al sistema de registro de asistencias INAPA</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Totales</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : displayStats.totalEvents}
            </div>
            <p className="text-xs text-muted-foreground">
              {displayStats.totalEvents === 0 ? 'No hay eventos registrados' : `${displayStats.totalEvents} eventos en total`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Activos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : displayStats.activeEvents}
            </div>
            <p className="text-xs text-muted-foreground">
              {displayStats.activeEvents === 0 ? 'No hay eventos activos' : `${displayStats.activeEvents} eventos activos`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asistencias</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : displayStats.totalAttendances}
            </div>
            <p className="text-xs text-muted-foreground">
              {displayStats.totalAttendances === 0 ? 'No hay asistencias registradas' : `${displayStats.totalAttendances} registros de asistencia`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Asistencia</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${displayStats.averageAttendance}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {displayStats.averageAttendance === 0 ? 'No hay datos suficientes' : 'Promedio de asistencia'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Cargando eventos...</span>
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay eventos registrados</p>
              <p className="text-sm mt-2">
                Los eventos aparecerán aquí una vez que se configure la integración con Google Calendar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-gray-500">{event.location}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(new Date(event.startAt))}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      event.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : event.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {event.status === 'active' ? 'Activo' : 
                       event.status === 'completed' ? 'Completado' : 
                       'Cancelado'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error display */}
      {statsError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600 text-sm">
              Error al cargar estadísticas: {statsError}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Configuración inicial</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Base de datos Prisma</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Componentes UI</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Endpoints API</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Integración Frontend</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Integración Google APIs</span>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
