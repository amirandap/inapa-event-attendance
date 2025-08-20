'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Download,
  Mail,
  QrCode,
  Printer,
  Share2
} from 'lucide-react'
import { formatDate } from '@/lib/utils/dates'
import { EventType, InviteeType } from '@/lib/types'
import { generateEventQRData } from '@/lib/qr/generator'
import { useRef, useMemo } from 'react'

interface MeetingSummaryProps {
  event: EventType & { organizer?: { name?: string; email: string } }
  invitees: InviteeType[]
  qrCodeUrl?: string
  showActions?: boolean
  printMode?: boolean
}

export function MeetingSummary({ 
  event, 
  invitees, 
  qrCodeUrl,
  showActions = true,
  printMode = false 
}: MeetingSummaryProps) {
  const printRef = useRef<HTMLDivElement>(null)

  // Generar datos del QR
  const qrData = useMemo(() => {
    return generateEventQRData(event.id, event.formToken)
  }, [event.id, event.formToken])

  // Usar QR proporcionado o el generado
  const finalQrCodeUrl = qrCodeUrl || qrData.qrCodeUrl
  const attendanceUrl = qrData.attendanceUrl

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML
      const originalContent = document.body.innerHTML
      
      document.body.innerHTML = `
        <html>
          <head>
            <title>Resumen de Reunión - ${event.title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .print-container { max-width: 800px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
              .event-info { margin-bottom: 30px; }
              .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 8px; }
              .participants { margin-top: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
              th { background-color: #f3f4f6; font-weight: bold; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="print-container">${printContent}</div>
          </body>
        </html>
      `
      
      window.print()
      document.body.innerHTML = originalContent
      window.location.reload()
    }
  }

  const handleDownloadPDF = () => {
    // Aquí implementaríamos la generación de PDF
    alert('Función de descarga PDF en desarrollo')
  }

  const handleSendEmail = () => {
    // Aquí implementaríamos el envío por email
    alert('Función de envío por email en desarrollo')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Resumen - ${event.title}`,
        text: `Resumen de la reunión: ${event.title}`,
        url: window.location.href
      })
    } else {
      // Fallback: copiar URL al clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('URL copiada al portapapeles')
    }
  }

  return (
    <div className={`space-y-6 ${printMode ? 'print-mode' : ''}`}>
      {/* Acciones */}
      {showActions && !printMode && (
        <div className="flex flex-wrap gap-2 justify-end no-print">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
          <Button variant="outline" onClick={handleSendEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Enviar por Email
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Compartir
          </Button>
        </div>
      )}

      {/* Contenido del resumen */}
      <div ref={printRef} className="bg-white">
        <Card className="border-0 shadow-none">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8 header">
              <div className="mb-4">
                {/* Logo placeholder - puedes agregar el logo aquí */}
                <div className="mx-auto h-16 w-auto mb-4 flex items-center justify-center">
                  <Users className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                RESUMEN DE REUNIÓN
              </h1>
              <p className="text-lg text-gray-600">
                Sistema de Registro de Asistencias INAPA
              </p>
            </div>

            {/* Información del evento */}
            <div className="mb-8 event-info">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Información del Evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-gray-600 mb-4">{event.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 mr-3 mt-1 text-gray-500" />
                        <div>
                          <div className="font-medium">Fecha y Hora</div>
                          <div className="text-sm text-gray-600">
                            <div>Inicio: {formatDate(new Date(event.startAt), 'PPPpp')}</div>
                            <div>Fin: {formatDate(new Date(event.endAt), 'PPPpp')}</div>
                          </div>
                        </div>
                      </div>

                      {event.location && (
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 mr-3 mt-1 text-gray-500" />
                          <div>
                            <div className="font-medium">Ubicación</div>
                            <div className="text-sm text-gray-600">{event.location}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start">
                        <Users className="h-5 w-5 mr-3 mt-1 text-gray-500" />
                        <div>
                          <div className="font-medium">Organizador</div>
                          <div className="text-sm text-gray-600">
                            {event.organizer?.name || event.organizer?.email || 'No especificado'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Clock className="h-5 w-5 mr-3 mt-1 text-gray-500" />
                        <div>
                          <div className="font-medium">Estado</div>
                          <Badge 
                            className={
                              event.status === 'active' ? 'bg-green-100 text-green-800' :
                              event.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {event.status === 'active' ? 'Activo' : 
                             event.status === 'completed' ? 'Completado' : 'Cancelado'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Código QR */}
            <div className="mb-8 qr-section">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-center flex items-center justify-center">
                    <QrCode className="h-5 w-5 mr-2" />
                    Código QR para Registro de Asistencia
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="inline-block p-6 bg-white border-2 border-gray-200 rounded-lg">
                    {/* QR Code real */}
                    <img 
                      src={finalQrCodeUrl}
                      alt="QR Code para registro de asistencia"
                      className="w-48 h-48 mx-auto"
                      onError={(e) => {
                        // Fallback si falla la carga del QR
                        e.currentTarget.style.display = 'none'
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                    {/* Fallback placeholder */}
                    <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 items-center justify-center hidden">
                      <div className="text-center">
                        <QrCode className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">QR Code</p>
                        <p className="text-xs text-gray-400 mt-1 break-all max-w-40">
                          {attendanceUrl}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4 max-w-md mx-auto">
                    Los participantes pueden escanear este código QR con su dispositivo móvil 
                    para registrar su asistencia de manera rápida y sencilla.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    URL de acceso: <code className="bg-gray-100 px-1 rounded">{attendanceUrl}</code>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de participantes esperados */}
            <div className="mb-8 participants">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Participantes Esperados ({invitees.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invitees.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No hay participantes registrados</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                              #
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                              Nombre Completo
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                              Correo Electrónico
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium">
                              Respuesta
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-medium">
                              Asistencia
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {invitees.map((invitee, index) => (
                            <tr key={invitee.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                {index + 1}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {invitee.name}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {invitee.email}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                {invitee.response || 'Sin respuesta'}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                <div className="w-8 h-6 border border-gray-400"></div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Instrucciones */}
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Instrucciones para el Registro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                        1
                      </div>
                      <div>
                        <strong>Escaneado del QR:</strong> Los participantes deben escanear el código QR con la cámara de su dispositivo móvil.
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                        2
                      </div>
                      <div>
                        <strong>Completar formulario:</strong> Al escanear, se abrirá un formulario donde deben ingresar sus datos personales.
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                        3
                      </div>
                      <div>
                        <strong>Confirmación:</strong> Una vez enviado el formulario, recibirán una confirmación de registro.
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                        4
                      </div>
                      <div>
                        <strong>Control manual:</strong> Use la columna &quot;Asistencia&quot; para marcar manualmente los participantes presentes.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Footer */}
            <div className="text-center pt-6 border-t border-gray-200 footer">
              <p className="text-sm text-gray-500">
                Generado el {formatDate(new Date(), 'PPPpp')} | Sistema de Registro de Asistencias INAPA
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ID del Evento: {event.id} | Token: {event.formToken}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
