'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, MapPin, Clock, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EventWithRelations } from '@/lib/types'
import { formatDate } from '@/lib/utils/dates'

interface EventHeaderProps {
  event: EventWithRelations
}

export function EventHeader({ event }: EventHeaderProps) {
  const [currentTime, setCurrentTime] = useState<number | null>(null)
  
  useEffect(() => {
    setCurrentTime(Date.now())
  }, [])

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

  const isEventActive = currentTime ? new Date(currentTime) < event.endAt && event.status === 'active' : event.status === 'active'

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
