'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  CheckCircle, 
  XCircle,
  RefreshCw, 
  Save,
  FileCog
} from 'lucide-react';

export function GoogleServiceAccountConfig() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [config, setConfig] = useState({
    projectId: '',
    privateKeyId: '',
    privateKey: '',
    clientEmail: '',
    clientId: '',
    calendarId: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setConfig({
      ...config,
      [e.target.name]: e.target.value
    });
  };

  // Cargar configuración actual del servidor
  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/calendar/service-account-config');
      const data = await response.json();
      
      if (data.success) {
        setConfig({
          projectId: data.config.projectId || '',
          privateKeyId: data.config.privateKeyId || '',
          privateKey: data.config.privateKey || '',
          clientEmail: data.config.clientEmail || '',
          clientId: data.config.clientId || '',
          calendarId: data.config.calendarId || '',
        });
        setSuccess('Configuración cargada correctamente');
      } else {
        setError(data.error || 'Error cargando configuración');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  // Guardar configuración en el servidor
  const saveConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/calendar/service-account-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Configuración guardada correctamente');
      } else {
        setError(data.error || 'Error guardando configuración');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  // Probar la configuración
  const testConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/test/calendar/service-account', {
        method: 'POST'
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Conexión exitosa con Google Calendar');
      } else {
        setError(data.error || 'Error conectando con Google Calendar');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Configuración de cuenta de servicio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCog className="h-5 w-5" />
            Configuración de Cuenta de Servicio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">ID del Proyecto</Label>
              <Input
                id="projectId"
                name="projectId"
                value={config.projectId}
                onChange={handleChange}
                placeholder="redar-469611"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                name="clientId"
                value={config.clientId}
                onChange={handleChange}
                placeholder="112832183163633955953"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Email de Cuenta de Servicio</Label>
            <Input
              id="clientEmail"
              name="clientEmail"
              value={config.clientEmail}
              onChange={handleChange}
              placeholder="inapa-calendar-service@redar-469611.iam.gserviceaccount.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="privateKeyId">ID de Llave Privada</Label>
            <Input
              id="privateKeyId"
              name="privateKeyId"
              value={config.privateKeyId}
              onChange={handleChange}
              placeholder="68203179de39c64b00ea69987a562fba618bf6e9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="privateKey">Llave Privada</Label>
            <Textarea
              id="privateKey"
              name="privateKey"
              value={config.privateKey}
              onChange={handleChange}
              placeholder="-----BEGIN PRIVATE KEY-----\nXXXXX\n-----END PRIVATE KEY-----\n"
              className="h-32 font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">Ingresa la llave privada completa, incluyendo BEGIN PRIVATE KEY y END PRIVATE KEY</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calendarId">ID de Calendario</Label>
            <Input
              id="calendarId"
              name="calendarId"
              value={config.calendarId}
              onChange={handleChange}
              placeholder="minutas@inapa.gob.do"
            />
            <p className="text-xs text-muted-foreground">Normalmente es la dirección de correo del calendario</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={loadConfig} variant="outline" disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Cargar Configuración
            </Button>
            <Button onClick={saveConfig} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </Button>
            <Button onClick={testConfig} variant="secondary" disabled={loading}>
              <Calendar className="h-4 w-4 mr-2" />
              Probar Conexión
            </Button>
          </div>

          <div className="rounded-md bg-muted/50 p-4 mt-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Información</Badge>
              <span className="text-sm">
                La configuración se guarda de forma segura en el archivo .env.local
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
