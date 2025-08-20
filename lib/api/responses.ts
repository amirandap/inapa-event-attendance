import { NextResponse } from 'next/server'

// Tipos de respuesta estándar
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

// Funciones de respuesta
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message
    },
    { status }
  )
}

export function errorResponse(
  error: string,
  message?: string,
  status: number = 400,
  details?: Record<string, unknown> | string[] | Array<{ field: string; message: string }>
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error,
      message,
      details
    },
    { status }
  )
}

export function validationErrorResponse(
  details: Record<string, unknown> | string[] | Array<{ field: string; message: string }>,
  message: string = 'Datos de entrada inválidos'
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error: 'VALIDATION_ERROR',
      message,
      details
    },
    { status: 400 }
  )
}

export function notFoundResponse(
  resource: string = 'Recurso'
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error: 'NOT_FOUND',
      message: `${resource} no encontrado`
    },
    { status: 404 }
  )
}

export function unauthorizedResponse(
  message: string = 'No autorizado'
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error: 'UNAUTHORIZED',
      message
    },
    { status: 401 }
  )
}

export function forbiddenResponse(
  message: string = 'Acceso prohibido'
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error: 'FORBIDDEN',
      message
    },
    { status: 403 }
  )
}

export function conflictResponse(
  message: string = 'Conflicto con el estado actual del recurso'
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error: 'CONFLICT',
      message
    },
    { status: 409 }
  )
}

export function internalServerErrorResponse(
  message: string = 'Error interno del servidor'
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message
    },
    { status: 500 }
  )
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): NextResponse<ApiResponse<T[]>> {
  const totalPages = Math.ceil(total / limit)
  
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    },
    { status: 200 }
  )
}

export function createdResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message: message || 'Recurso creado exitosamente'
    },
    { status: 201 }
  )
}

export function noContentResponse(): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: true,
      message: 'Operación completada exitosamente'
    },
    { status: 204 }
  )
}

// Función para manejar errores de Prisma
export function handlePrismaError(error: { code?: string; message?: string }): NextResponse<ApiError> {
  console.error('Prisma Error:', error)
  
  if (error.code === 'P2002') {
    return conflictResponse('Ya existe un registro con estos datos únicos')
  }
  
  if (error.code === 'P2025') {
    return notFoundResponse('Registro')
  }
  
  if (error.code === 'P2003') {
    return errorResponse(
      'FOREIGN_KEY_CONSTRAINT',
      'No se puede completar la operación por restricciones de integridad',
      400
    )
  }
  
  if (error.code === 'P2023') {
    return errorResponse(
      'INCONSISTENT_COLUMN_DATA',
      'Datos inconsistentes en la columna',
      400
    )
  }
  
  return internalServerErrorResponse('Error en la base de datos')
}

// Función para manejar errores de validación de Zod
export function handleZodError(error: { errors?: Array<{ path: string[]; message: string }> }): NextResponse<ApiError> {
  const details = error.errors?.map((err) => ({
    field: err.path.join('.'),
    message: err.message
  })) || []
  
  return validationErrorResponse(details)
}

// Función genérica para manejar errores
export function handleError(error: { 
  name?: string; 
  code?: string; 
  message?: string; 
  status?: number;
  errors?: Array<{ path: string[]; message: string }>
}): NextResponse<ApiError> {
  console.error('API Error:', error)
  
  // Error de validación Zod
  if (error.name === 'ZodError') {
    return handleZodError(error)
  }
  
  // Error de Prisma
  if (error.code && error.code.startsWith('P')) {
    return handlePrismaError(error)
  }
  
  // Error personalizado con status
  if (error.status && error.message) {
    return errorResponse(
      error.code || 'CUSTOM_ERROR',
      error.message,
      error.status
    )
  }
  
  // Error genérico
  return internalServerErrorResponse(
    process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Error interno del servidor'
  )
}

// Utilidades para extraer datos de request
export async function getRequestBody(request: Request) {
  try {
    return await request.json()
  } catch {
    throw new Error('Cuerpo de la petición inválido')
  }
}

export function getSearchParams(request: Request) {
  const url = new URL(request.url)
  return url.searchParams
}

export function parseQueryParams(searchParams: URLSearchParams) {
  const params: Record<string, string | number | boolean> = {}
  
  searchParams.forEach((value, key) => {
    // Convertir números
    if (!isNaN(Number(value))) {
      params[key] = Number(value)
    }
    // Convertir booleanos
    else if (value === 'true' || value === 'false') {
      params[key] = value === 'true'
    }
    // Mantener como string
    else {
      params[key] = value
    }
  })
  
  return params
}

// Headers de CORS para desarrollo
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function handleCors(request: Request): NextResponse | null {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders
    })
  }
  return null
}
