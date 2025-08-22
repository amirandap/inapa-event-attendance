// Cliente API para el frontend
export const API_BASE_URL = '/api'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  success: false
  error: string
  message?: string
  details?: Record<string, unknown> | string[] | Array<{ field: string; message: string }>
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      console.log('Making API request to:', url)
      const response = await fetch(url, config)
      
      if (!response.ok) {
        console.error('API response not ok:', response.status, response.statusText)
        return {
          success: false,
          error: `HTTP_${response.status}`,
          message: `Error ${response.status}: ${response.statusText}`
        }
      }
      
      const data = await response.json()
      console.log('API response received:', data)
      return data
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Error de conexión con el servidor'
      }
    }
  }

  // Métodos CRUD genéricos
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value))
      })
      url += `?${searchParams.toString()}`
    }
    
    return this.request<T>(url, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // Métodos específicos para eventos
  async getEvents(params?: {
    page?: number
    limit?: number
    q?: string
    startDate?: string
    endDate?: string
    status?: string
  }) {
    return this.get('/events', params)
  }

  async getEvent(id: string) {
    return this.get(`/events/${id}`)
  }

  async createEvent(data: unknown) {
    return this.post('/events', data)
  }

  async updateEvent(id: string, data: unknown) {
    return this.put(`/events/${id}`, data)
  }

  async deleteEvent(id: string) {
    return this.delete(`/events/${id}`)
  }

  // Métodos específicos para invitados
  async getInvitees(params?: {
    page?: number
    limit?: number
    q?: string
    eventId?: string
    response?: string
  }) {
    return this.get('/invitees', params)
  }

  async getInvitee(id: string) {
    return this.get(`/invitees/${id}`)
  }

  async createInvitee(data: unknown) {
    return this.post('/invitees', data)
  }

  async updateInvitee(id: string, data: unknown) {
    return this.put(`/invitees/${id}`, data)
  }

  async deleteInvitee(id: string) {
    return this.delete(`/invitees/${id}`)
  }

  // Métodos específicos para check-ins
  async getCheckins(params?: {
    page?: number
    limit?: number
    eventId?: string
    cedula?: string
  }) {
    return this.get('/checkins', params)
  }

  async createCheckin(data: unknown) {
    return this.post('/checkins', data)
  }

  async updateCheckin(id: string, data: unknown) {
    return this.put(`/checkins/${id}`, data)
  }

  async deleteCheckin(id: string) {
    return this.delete(`/checkins/${id}`)
  }

  // Métodos para estadísticas
  async getStats(params?: {
    eventId?: string
    startDate?: string
    endDate?: string
    organizerId?: number
  }) {
    return this.get('/stats', params)
  }

  // Métodos para reportes
  async getReports(params?: {
    eventId?: string
    format?: 'pdf' | 'excel' | 'csv'
    startDate?: string
    endDate?: string
    includeStats?: boolean
  }) {
    return this.get('/reports', params)
  }

  async exportReport(params: {
    eventId?: string
    format?: 'pdf' | 'excel' | 'csv'
    startDate?: string
    endDate?: string
    includeStats?: boolean
  }) {
    return this.get('/exports', params)
  }
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient()

// Funciones de conveniencia
export const api = {
  events: {
    list: (params?: Parameters<typeof apiClient.getEvents>[0]) => apiClient.getEvents(params),
    get: (id: string) => apiClient.getEvent(id),
    create: (data: unknown) => apiClient.createEvent(data),
    update: (id: string, data: unknown) => apiClient.updateEvent(id, data),
    delete: (id: string) => apiClient.deleteEvent(id),
  },
  invitees: {
    list: (params?: Parameters<typeof apiClient.getInvitees>[0]) => apiClient.getInvitees(params),
    get: (id: string) => apiClient.getInvitee(id),
    create: (data: unknown) => apiClient.createInvitee(data),
    update: (id: string, data: unknown) => apiClient.updateInvitee(id, data),
    delete: (id: string) => apiClient.deleteInvitee(id),
  },
  checkins: {
    list: (params?: Parameters<typeof apiClient.getCheckins>[0]) => apiClient.getCheckins(params),
    create: (data: unknown) => apiClient.createCheckin(data),
    update: (id: string, data: unknown) => apiClient.updateCheckin(id, data),
    delete: (id: string) => apiClient.deleteCheckin(id),
  },
  stats: {
    get: (params?: Parameters<typeof apiClient.getStats>[0]) => apiClient.getStats(params),
  },
  reports: {
    list: (params?: Parameters<typeof apiClient.getReports>[0]) => apiClient.getReports(params),
    export: (params: Parameters<typeof apiClient.exportReport>[0]) => apiClient.exportReport(params),
  },
}

export default apiClient
