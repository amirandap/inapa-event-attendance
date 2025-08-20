'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/client'

// Hook genérico para manejo de estado de API
export function useApiState<T>() {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = async (apiCall: () => Promise<ApiResponse<T>>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiCall()
      
      if (response.success && response.data) {
        setData(response.data)
      } else {
        setError(response.error || 'Error desconocido')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, execute, setData }
}

// Hook específico para eventos
export function useEvents(autoLoad = true) {
  const { data, loading, error, execute } = useApiState<any[]>()
  
  useEffect(() => {
    if (autoLoad) {
      loadEvents()
    }
  }, [autoLoad])

  const loadEvents = async (params?: {
    page?: number
    limit?: number
    q?: string
    startDate?: string
    endDate?: string
    status?: string
  }) => {
    await execute(() => api.events.list(params))
  }

  return {
    events: data || [],
    loading,
    error,
    loadEvents,
    refetch: () => loadEvents()
  }
}

// Hook específico para un evento individual
export function useEvent(id?: string) {
  const { data, loading, error, execute } = useApiState<any>()
  
  useEffect(() => {
    if (id) {
      loadEvent(id)
    }
  }, [id])

  const loadEvent = async (eventId: string) => {
    await execute(() => api.events.get(eventId))
  }

  return {
    event: data,
    loading,
    error,
    loadEvent,
    refetch: () => id && loadEvent(id)
  }
}

// Hook específico para invitados
export function useInvitees(autoLoad = true, params?: {
  eventId?: string
  page?: number
  limit?: number
}) {
  const { data, loading, error, execute } = useApiState<any[]>()
  
  useEffect(() => {
    if (autoLoad) {
      loadInvitees(params)
    }
  }, [autoLoad, params?.eventId])

  const loadInvitees = async (searchParams?: {
    page?: number
    limit?: number
    q?: string
    eventId?: string
    response?: string
  }) => {
    await execute(() => api.invitees.list(searchParams))
  }

  return {
    invitees: data || [],
    loading,
    error,
    loadInvitees,
    refetch: () => loadInvitees(params)
  }
}

// Hook específico para check-ins
export function useCheckins(autoLoad = true, params?: {
  eventId?: string
  page?: number
  limit?: number
}) {
  const { data, loading, error, execute } = useApiState<any[]>()
  
  useEffect(() => {
    if (autoLoad) {
      loadCheckins(params)
    }
  }, [autoLoad, params?.eventId])

  const loadCheckins = async (searchParams?: {
    page?: number
    limit?: number
    eventId?: string
    cedula?: string
  }) => {
    await execute(() => api.checkins.list(searchParams))
  }

  return {
    checkins: data || [],
    loading,
    error,
    loadCheckins,
    refetch: () => loadCheckins(params)
  }
}

// Hook para estadísticas del dashboard
export function useStats(params?: {
  eventId?: string
  startDate?: string
  endDate?: string
  organizerId?: number
}) {
  const { data, loading, error, execute } = useApiState<any>()
  
  useEffect(() => {
    loadStats(params)
  }, [params?.eventId])

  const loadStats = async (searchParams?: {
    eventId?: string
    startDate?: string
    endDate?: string
    organizerId?: number
  }) => {
    await execute(() => api.stats.get(searchParams))
  }

  return {
    stats: data || {
      totalEvents: 0,
      activeEvents: 0,
      totalAttendances: 0,
      averageAttendance: 0,
      recentEvents: [],
      attendanceByDate: []
    },
    loading,
    error,
    loadStats,
    refetch: () => loadStats(params)
  }
}

// Hook para operaciones de mutación (crear, actualizar, eliminar)
export function useMutation<T>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const execute = async (
    apiCall: () => Promise<ApiResponse<T>>,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
  ) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const response = await apiCall()
      
      if (response.success && response.data) {
        setSuccess(true)
        onSuccess?.(response.data)
      } else {
        const errorMsg = response.error || 'Error desconocido'
        setError(errorMsg)
        onError?.(errorMsg)
      }
    } catch {
      const errorMsg = 'Error de conexión'
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setError(null)
    setSuccess(false)
  }

  return { loading, error, success, execute, reset }
}

// Hooks específicos para mutaciones
export function useCreateEvent() {
  return useMutation<any>()
}

export function useUpdateEvent() {
  return useMutation<any>()
}

export function useDeleteEvent() {
  return useMutation<any>()
}

export function useCreateInvitee() {
  return useMutation<any>()
}

export function useUpdateInvitee() {
  return useMutation<any>()
}

export function useDeleteInvitee() {
  return useMutation<any>()
}

export function useCreateCheckin() {
  return useMutation<any>()
}
