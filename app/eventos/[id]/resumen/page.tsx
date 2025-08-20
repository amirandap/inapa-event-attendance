'use client'

import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useEvent, useInvitees } from '@/lib/hooks/useApi'
import { MeetingSummary } from '@/components/events/MeetingSummary'

export default function MeetingSummaryPage() {
  const params = useParams()
  const eventId = params.id as string

  const { event, loading: eventLoading, error: eventError } = useEvent(eventId)
  const { invitees, loading: inviteesLoading } = useInvitees(true, { eventId })

  const isLoading = eventLoading || inviteesLoading

  if (eventError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar el evento</h3>
          <p className="text-gray-600">{eventError}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando resumen de reunión...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Evento no encontrado</h3>
          <p className="text-gray-600">El evento que buscas no existe.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MeetingSummary 
          event={event}
          invitees={invitees}
          showActions={true}
          printMode={false}
        />
      </div>
    </div>
  )
}
