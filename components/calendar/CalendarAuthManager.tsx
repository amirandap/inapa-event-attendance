'use client'
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  RefreshCw,
  Clock,
  Users,
  AlertTriangle
} from 'lucide-react';

interface CalendarAuthManagerProps {
  userId: string;
  userEmail: string;
}

interface AuthStatus {
  isAuthorized: boolean;
  email?: string;
  expiresAt?: string;
  calendars?: number;
  lastSync?: string;
}

interface Calendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
}

export function CalendarAuthManager({ userId, userEmail }: CalendarAuthManagerProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCalendars = useCallback(async () => {
    try {
      const response = await fetch(`/api/calendar/calendars?userEmail=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      
      if (data.success) {
        setCalendars(data.calendars);
      }
    } catch (err) {
      console.error('Error cargando calendarios:', err);
    }
  }, [userEmail]);

  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/calendar/auth-status?userEmail=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      
      if (data.success) {
        setAuthStatus(data.status);
        if (data.status.isAuthorized) {
          loadCalendars();
        }
      }
    } catch (err) {
      console.error('Error verificando estado de auth:', err);
    } finally {
      setLoading(false);
    }
  }, [userEmail, loadCalendars]);

  useEffect(() => {
    checkAuthStatus();
    
    // Verificar si viene de un callback exitoso
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success')) {
      setSuccess('¡Autorización exitosa! Ahora puedes acceder a Google Calendar.');
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (urlParams.get('error')) {
      setError(`Error: ${urlParams.get('error')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [checkAuthStatus]);

  const startAuthorization = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/google/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail })
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirigir a Google para autorización
        window.location.href = data.authUrl;
      } else {
        setError(data.error || 'Error iniciando autorización');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async () => {
    if (!confirm('¿Estás seguro de que quieres revocar el acceso a Google Calendar?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/calendar/auth-status?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Acceso revocado exitosamente');
        setAuthStatus({ isAuthorized: false });
        setCalendars([]);
      } else {
        setError(data.error || 'Error revocando acceso');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-DO');
  };

  const isTokenExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const expirationTime = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    const oneHour = 60 * 60 * 1000;
    return (expirationTime - now) < oneHour;
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

      {/* Estado de Autorización */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Estado de Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Verificando estado...
            </div>
          ) : authStatus ? (
            <>
              <div className="flex items-center gap-2">
                {authStatus.isAuthorized ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Autorizado</span>
                    <Badge variant="outline" className="text-green-600">
                      Conectado
                    </Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium">No autorizado</span>
                    <Badge variant="outline" className="text-red-600">
                      Desconectado
                    </Badge>
                  </>
                )}
              </div>

              {authStatus.isAuthorized && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{authStatus.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Calendarios</p>
                      <p className="text-sm text-muted-foreground">{authStatus.calendars || 0}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Expira</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(authStatus.expiresAt)}
                      </p>
                      {isTokenExpiringSoon(authStatus.expiresAt) && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-yellow-600">Expira pronto</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">Cargando estado...</p>
          )}

          <div className="flex gap-2 pt-4">
            {authStatus?.isAuthorized ? (
              <>
                <Button variant="outline" onClick={checkAuthStatus} disabled={loading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Estado
                </Button>
                <Button variant="destructive" onClick={revokeAccess} disabled={loading}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Revocar Acceso
                </Button>
              </>
            ) : (
              <Button onClick={startAuthorization} disabled={loading}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Autorizar Google Calendar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Calendarios */}
      {authStatus?.isAuthorized && calendars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Calendarios Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {calendars.map((calendar) => (
                <div
                  key={calendar.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{calendar.summary}</p>
                    {calendar.description && (
                      <p className="text-sm text-muted-foreground">{calendar.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">ID: {calendar.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {calendar.primary && (
                      <Badge variant="default">Principal</Badge>
                    )}
                    <Badge variant="outline">{calendar.accessRole}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            1. <strong>Autorizar:</strong> Haz clic en &quot;Autorizar Google Calendar&quot; para conceder permisos
          </p>
          <p className="text-sm text-muted-foreground">
            2. <strong>Permisos:</strong> La aplicación podrá leer y crear eventos en tus calendarios
          </p>
          <p className="text-sm text-muted-foreground">
            3. <strong>Seguridad:</strong> Puedes revocar el acceso en cualquier momento
          </p>
          <p className="text-sm text-muted-foreground">
            4. <strong>Tokens:</strong> Los tokens se renuevan automáticamente antes de expirar
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
