'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function CalendarAuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const success = searchParams.get('success');
  const error = searchParams.get('error');
  const email = searchParams.get('email');

  const handleRetry = () => {
    setIsLoading(true);
    // Redirigir a la configuración para intentar autorizar de nuevo
    router.push('/dashboard/configuracion');
  };

  const handleGoBack = () => {
    router.push('/dashboard/configuracion');
  };

  useEffect(() => {
    // Auto-redirigir después de 5 segundos si fue exitoso
    if (success === 'true') {
      const timer = setTimeout(() => {
        router.push('/dashboard/configuracion');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [success, router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {success === 'true' ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Autorización Exitosa
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  Error de Autorización
                </>
              )}
            </CardTitle>
            <CardDescription>
              Resultado de la autorización de Google Calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {success === 'true' ? (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ¡Excelente! La autorización de Google Calendar fue exitosa.
                    {email && (
                      <>
                        <br />
                        <strong>Cuenta autorizada:</strong> {decodeURIComponent(email)}
                      </>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">¿Qué sigue?</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Ya puedes sincronizar eventos desde Google Calendar</li>
                    <li>• Los eventos se actualizarán automáticamente</li>
                    <li>• Puedes gestionar la sincronización desde Configuración</li>
                  </ul>
                </div>

                <p className="text-sm text-gray-600">
                  Serás redirigido automáticamente a Configuración en unos segundos...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Error durante la autorización:</strong>
                    <br />
                    {error ? decodeURIComponent(error) : 'Error desconocido'}
                  </AlertDescription>
                </Alert>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-900 mb-2">Posibles soluciones:</h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Verifica que hayas autorizado todos los permisos solicitados</li>
                    <li>• Asegúrate de usar la cuenta correcta de Google</li>
                    <li>• Revisa que tu cuenta tenga acceso a Google Calendar</li>
                    <li>• Intenta el proceso de autorización nuevamente</li>
                  </ul>
                </div>

                {error?.includes('intercambiando código') && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertDescription className="text-orange-800">
                      <strong>Error técnico detectado:</strong> Problema con la configuración OAuth.
                      <br />
                      Por favor, contacta al administrador del sistema si el problema persiste.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Configuración
              </Button>

              {success !== 'true' && (
                <Button
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Intentar de Nuevo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
