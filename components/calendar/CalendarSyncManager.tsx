'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Database,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface SyncResult {
  success: boolean;
  totalEvents: number;
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
  syncedEvents: Array<{
    id: string;
    googleEventId: string;
    title: string;
    action: 'created' | 'updated' | 'skipped' | 'deleted';
  }>;
}

interface SyncStats {
  totalEvents: number;
  googleEvents: number;
  localOnlyEvents: number;
  lastSync: string | null;
}

export default function CalendarSyncManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/calendar/sync');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);
    setSyncResult(null);

    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calendarEmail: 'minutas@inapa.gob.do',
          calendarId: 'minutas@inapa.gob.do',
          syncDays: 60,
          organizerId: 1,
          deleteRemovedEvents: false,
          syncAttendees: true
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSyncResult(data.data);
        await loadStats(); // Recargar estadísticas
      } else {
        setError(data.message || 'Error durante la sincronización');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error de conexión: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case 'deleted':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'skipped':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getActionBadge = (action: string) => {
    const variants = {
      created: 'default',
      updated: 'secondary',
      deleted: 'destructive',
      skipped: 'outline'
    } as const;

    return (
      <Badge variant={variants[action as keyof typeof variants] || 'outline'}>
        {action}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header y estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Eventos</p>
                <p className="text-2xl font-bold">{stats?.totalEvents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Google Calendar</p>
                <p className="text-2xl font-bold">{stats?.googleEvents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Solo Locales</p>
                <p className="text-2xl font-bold">{stats?.localOnlyEvents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Última Sync</p>
                <p className="text-sm font-medium">
                  {stats?.lastSync 
                    ? new Date(stats.lastSync).toLocaleString('es-DO')
                    : 'Nunca'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panel de sincronización */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sincronización de Google Calendar
          </CardTitle>
          <CardDescription>
            Sincroniza eventos desde Google Calendar con la base de datos local.
            Los eventos se vincularán usando el identificador único de Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSync} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Sincronizando...' : 'Sincronizar Ahora'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={loadStats}
              disabled={isLoading}
            >
              Actualizar Estadísticas
            </Button>
          </div>

          {/* Configuración de sincronización */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Configuración de Sincronización</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Calendario:</span> minutas@inapa.gob.do
              </div>
              <div>
                <span className="font-medium">Rango:</span> 60 días (±30 días)
              </div>
              <div>
                <span className="font-medium">Asistentes:</span> Habilitado
              </div>
              <div>
                <span className="font-medium">Eliminar eventos:</span> Deshabilitado
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resultados de sincronización */}
      {syncResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {syncResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Resultados de Sincronización
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumen de resultados */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{syncResult.created}</div>
                <div className="text-sm text-green-700">Creados</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{syncResult.updated}</div>
                <div className="text-sm text-blue-700">Actualizados</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{syncResult.deleted}</div>
                <div className="text-sm text-red-700">Eliminados</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{syncResult.totalEvents}</div>
                <div className="text-sm text-gray-700">Total</div>
              </div>
            </div>

            {/* Errores si los hay */}
            {syncResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Errores durante la sincronización:</p>
                    {syncResult.errors.slice(0, 3).map((error, index) => (
                      <p key={index} className="text-sm">• {error}</p>
                    ))}
                    {syncResult.errors.length > 3 && (
                      <p className="text-sm">... y {syncResult.errors.length - 3} errores más</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Lista de eventos sincronizados */}
            {syncResult.syncedEvents.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Eventos Procesados</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {syncResult.syncedEvents.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getActionIcon(event.action)}
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-gray-600">ID: {event.googleEventId}</p>
                        </div>
                      </div>
                      {getActionBadge(event.action)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Información de Sincronización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Identificadores únicos</p>
                <p className="text-gray-600">Cada evento usa el Google Event ID como identificador único para evitar duplicados.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">Sincronización de asistentes</p>
                <p className="text-gray-600">Los asistentes del calendario se sincronizan automáticamente como invitados del evento.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium">Actualizaciones inteligentes</p>
                <p className="text-gray-600">Solo se actualizan los eventos que han cambiado en Google Calendar.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
