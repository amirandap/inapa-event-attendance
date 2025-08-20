'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, User, Mail, Phone, Building, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { CheckinFormData } from '@/lib/types'
import { validateCedula } from '@/lib/utils/validation'

const attendanceSchema = z.object({
  cedula: z.string()
    .min(11, 'La cédula debe tener 11 dígitos')
    .max(11, 'La cédula debe tener 11 dígitos')
    .regex(/^\d{11}$/, 'La cédula debe contener solo números')
    .refine(validateCedula, 'Cédula dominicana inválida'),
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  cargo: z.string().optional(),
  institucion: z.string().optional(),
  correo: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  sexo: z.enum(['M', 'F', 'Otro']).optional(),
  telefono: z.string()
    .regex(/^(\+1|1)?[0-9]{10}$/, 'Teléfono inválido (formato: 8091234567)')
    .optional()
    .or(z.literal('')),
})

interface AttendanceFormProps {
  eventId: string
  eventTitle: string
  onSuccess?: () => void
}

export function AttendanceForm({ eventId, eventTitle, onSuccess }: AttendanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CheckinFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      cedula: '',
      nombre: '',
      cargo: '',
      institucion: '',
      correo: '',
      sexo: undefined,
      telefono: '',
    },
  })

  const onSubmit = async (data: CheckinFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          ...data,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al registrar asistencia')
      }

      toast.success(
        `¡Asistencia registrada! Bienvenido(a) ${data.nombre}. Su asistencia ha sido registrada exitosamente.`
      )

      form.reset()
      onSuccess?.()

    } catch (error) {
      console.error('Error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Ocurrió un error inesperado'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-inapa-primary">
          Registro de Asistencia
        </CardTitle>
        <p className="text-gray-600">{eventTitle}</p>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Cédula */}
          <div className="space-y-2">
            <Label htmlFor="cedula" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Cédula de Identidad *
            </Label>
            <Input
              id="cedula"
              placeholder="12345678901"
              maxLength={11}
              {...form.register('cedula')}
              className={form.formState.errors.cedula ? 'border-red-500' : ''}
            />
            {form.formState.errors.cedula && (
              <p className="text-sm text-red-500">
                {form.formState.errors.cedula.message}
              </p>
            )}
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Nombre Completo *
            </Label>
            <Input
              id="nombre"
              placeholder="Ingrese su nombre completo"
              {...form.register('nombre')}
              className={form.formState.errors.nombre ? 'border-red-500' : ''}
            />
            {form.formState.errors.nombre && (
              <p className="text-sm text-red-500">
                {form.formState.errors.nombre.message}
              </p>
            )}
          </div>

          {/* Cargo */}
          <div className="space-y-2">
            <Label htmlFor="cargo" className="flex items-center">
              <Briefcase className="h-4 w-4 mr-2" />
              Cargo
            </Label>
            <Input
              id="cargo"
              placeholder="Ej: Director, Analista, Coordinador"
              {...form.register('cargo')}
            />
          </div>

          {/* Institución */}
          <div className="space-y-2">
            <Label htmlFor="institucion" className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Institución
            </Label>
            <Input
              id="institucion"
              placeholder="Ej: INAPA, Ministerio de Salud"
              {...form.register('institucion')}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="correo" className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              Correo Electrónico
            </Label>
            <Input
              id="correo"
              type="email"
              placeholder="ejemplo@email.com"
              {...form.register('correo')}
              className={form.formState.errors.correo ? 'border-red-500' : ''}
            />
            {form.formState.errors.correo && (
              <p className="text-sm text-red-500">
                {form.formState.errors.correo.message}
              </p>
            )}
          </div>

          {/* Sexo */}
          <div className="space-y-2">
            <Label>Sexo</Label>
            <Select onValueChange={(value) => form.setValue('sexo', value as 'M' | 'F' | 'Otro')}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono" className="flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              Teléfono
            </Label>
            <Input
              id="telefono"
              placeholder="8091234567"
              {...form.register('telefono')}
              className={form.formState.errors.telefono ? 'border-red-500' : ''}
            />
            {form.formState.errors.telefono && (
              <p className="text-sm text-red-500">
                {form.formState.errors.telefono.message}
              </p>
            )}
          </div>

          {/* Botón de envío */}
          <Button
            type="submit"
            className="w-full bg-inapa-primary hover:bg-inapa-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar Asistencia'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>* Campos obligatorios</p>
          <p className="mt-2">
            Al registrar su asistencia acepta el tratamiento de sus datos personales
            conforme a la Ley 172-13 de República Dominicana.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
