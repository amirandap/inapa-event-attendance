'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CalendarDays, MapPin, Users, QrCode } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EventWithCounts } from '@/lib/types'
import { formatDate } from '@/lib/utils/dates'

interface EventCardProps {
  event: EventWithCounts | any // Permitir ambos tipos por compatibilidad
}

export function EventCard({ event }: EventCardProps) {
  const [currentTime, setCurrentTime] = useState<number | null>(null)
  
  useEffect(() => {
    setCurrentTime(Date.now())
  }, [])

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

  // Solo calcular si tenemos currentTime (después de hidratación)
  const isEventSoon = currentTime ? new Date(event.startAt).getTime() - currentTime < 24 * 60 * 60 * 1000 : false
  const isEventActive = currentTime ? new Date(currentTime) < event.endAt && event.status === 'active' : event.status === 'active'

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
