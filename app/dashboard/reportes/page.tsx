import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FileText, 
  Download, 
  BarChart3, 
  PieChart, 
  Users,
  FileSpreadsheet,
  FileImage
} from 'lucide-react'

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600">Genera y descarga reportes de asistencias</p>
        </div>
      </div>

      {/* Generación de reportes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generador de reportes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Generar Reporte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo de Reporte</label>
              <Select defaultValue="asistencias">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asistencias">Reporte de Asistencias</SelectItem>
                  <SelectItem value="eventos">Resumen de Eventos</SelectItem>
                  <SelectItem value="estadisticas">Estadísticas Generales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Evento</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los eventos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Fecha Inicio</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">Fecha Fin</label>
                <Input type="date" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Formato</label>
              <Select defaultValue="pdf">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full bg-inapa-primary hover:bg-inapa-primary/90">
              <Download className="h-4 w-4 mr-2" />
              Generar Reporte
            </Button>
          </CardContent>
        </Card>

        {/* Vista previa */}
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">Vista previa del reporte</p>
              <p className="text-sm text-gray-500 mt-2">
                Selecciona los parámetros para generar una vista previa
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reportes rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span>Estadísticas del Mes</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <PieChart className="h-6 w-6 mb-2" />
              <span>Distribución por Institución</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Users className="h-6 w-6 mb-2" />
              <span>Top Asistentes</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial de reportes */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Reportes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">No hay reportes generados</p>
            <p className="text-sm text-gray-500 mt-2">
              Los reportes que generes aparecerán aquí para descarga posterior
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plantillas disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Plantillas Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-red-500" />
                <div>
                  <h4 className="font-medium">Reporte PDF Estándar</h4>
                  <p className="text-sm text-gray-600">Logo INAPA, estadísticas completas</p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="h-8 w-8 text-green-500" />
                <div>
                  <h4 className="font-medium">Excel Detallado</h4>
                  <p className="text-sm text-gray-600">Datos completos para análisis</p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-3">
                <FileImage className="h-8 w-8 text-blue-500" />
                <div>
                  <h4 className="font-medium">Infografía</h4>
                  <p className="text-sm text-gray-600">Resumen visual atractivo</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
