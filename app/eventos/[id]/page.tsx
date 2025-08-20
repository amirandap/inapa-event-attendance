'use client'

import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CalendarDays, 
  MapPin, 
  Users, 
  Clock, 
  ArrowLeft, 
  QrCode, 
  Download,
  Mail,
  Loader2,
  UserCheck,
  UserX
} from 'lucide-react'
import { useEvent, useInvitees, useCheckins } from '@/lib/hooks/useApi'
import { formatDate } from '@/lib/utils/dates'
import { InviteesTable } from '@/components/events/InviteesTable'
import { MeetingSummary } from '@/components/events/MeetingSummary'
import Link from 'next/link'

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const { event, loading: eventLoading, error: eventError } = useEvent(eventId)
  const { invitees, loading: inviteesLoading } = useInvitees(true, { eventId })
  const { checkins, loading: checkinsLoading } = useCheckins(true, { eventId })

  const isLoading = eventLoading || inviteesLoading || checkinsLoading

  if (eventError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Evento no encontrado</h3>
            <p className="text-gray-600 mb-4">
              El evento que buscas no existe o ha sido eliminado.
            </p>
            <Button onClick={() => router.push('/dashboard/eventos')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Eventos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando evento...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Evento no encontrado</h3>
            <p className="text-gray-600 mb-4">
              El evento que buscas no existe.
            </p>
            <Button onClick={() => router.push('/dashboard/eventos')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Eventos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calcular estadísticas
  const totalInvitees = invitees.length
  const totalCheckins = checkins.length
  const attendanceRate = totalInvitees > 0 ? Math.round((totalCheckins / totalInvitees) * 100) : 0
  const notAttended = totalInvitees - totalCheckins

  // Crear set de emails que han hecho check-in
  const checkedInEmails = new Set(checkins.map(checkin => checkin.correo).filter(Boolean))

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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo'
      case 'cancelled':
        return 'Cancelado'
      case 'completed':
        return 'Completado'
      default:
        return 'Desconocido'
    }
  }

  const isEventActive = event.status === 'active'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            
            <div className="flex items-center space-x-2">
              {isEventActive && (
                <Button asChild variant="outline">
                  <Link href={`/a/${event.formToken}`} target="_blank">
                    <QrCode className="h-4 w-4 mr-2" />
                    Ver Formulario
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href={`/eventos/${event.id}/resumen`} target="_blank">
                  <Download className="h-4 w-4 mr-2" />
                  Resumen Completo
                </Link>
              </Button>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Enviar Invitaciones
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                  <Badge className={getStatusColor(event.status)}>
                    {getStatusText(event.status)}
                  </Badge>
                </div>
                
                {event.description && (
                  <p className="text-gray-600 mb-4">{event.description}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    <div>
                      <div>Inicio: {formatDate(new Date(event.startAt), 'PPpp')}</div>
                      <div>Fin: {formatDate(new Date(event.endAt), 'PPpp')}</div>
                    </div>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <div>{event.location}</div>
                    </div>
                  )}

                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <div>
                      {event.organizer?.name || event.organizer?.email || 'Organizador desconocido'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invitados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvitees}</div>
              <p className="text-xs text-muted-foreground">
                Personas invitadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presentes</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalCheckins}</div>
              <p className="text-xs text-muted-foreground">
                Han confirmado asistencia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ausentes</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{notAttended}</div>
              <p className="text-xs text-muted-foreground">
                Sin registrar asistencia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Asistencia</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                Porcentaje de asistencia
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs con contenido */}
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="invitees" className="w-full">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="invitees">
                    Invitados ({totalInvitees})
                  </TabsTrigger>
                  <TabsTrigger value="checkins">
                    Presentes ({totalCheckins})
                  </TabsTrigger>
                  <TabsTrigger value="summary">
                    Resumen
                  </TabsTrigger>
                  <TabsTrigger value="analytics">
                    Análisis
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <TabsContent value="invitees" className="p-6 pt-0">
                <InviteesTable invitees={invitees} checkedInEmails={checkedInEmails} />
              </TabsContent>

              <TabsContent value="checkins" className="p-6 pt-0">
                <div className="space-y-4">
                  {checkins.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No hay registros de asistencia aún</p>
                      <p className="text-sm mt-2">
                        Los registros aparecerán aquí cuando los participantes se registren
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {checkins.map((checkin) => (
                        <div key={checkin.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{checkin.nombre}</div>
                            <div className="text-sm text-gray-500">
                              {checkin.cedula} • {checkin.cargo} • {checkin.institucion}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {formatDate(new Date(checkin.createdAt), 'PPpp')}
                            </div>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Presente
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="summary" className="p-6 pt-0">
                <MeetingSummary 
                  event={event}
                  invitees={invitees}
                  showActions={true}
                />
              </TabsContent>

              <TabsContent value="analytics" className="p-6 pt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Análisis de Asistencia</h3>
                    
                    {/* Barra de progreso */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progreso de Asistencia</span>
                        <span>{attendanceRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${attendanceRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Métricas adicionales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Resumen de Asistencia</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Total invitados:</span>
                            <span className="font-medium">{totalInvitees}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Presentes:</span>
                            <span className="font-medium text-green-600">{totalCheckins}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ausentes:</span>
                            <span className="font-medium text-red-600">{notAttended}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Información del Evento</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Estado:</span>
                            <Badge className={getStatusColor(event.status)} variant="secondary">
                              {getStatusText(event.status)}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Creado:</span>
                            <span className="font-medium">
                              {formatDate(new Date(event.createdAt), 'PP')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Token:</span>
                            <code className="bg-gray-200 px-1 rounded text-xs">
                              {event.formToken}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
