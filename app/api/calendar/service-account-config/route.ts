import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAuth, getUserFromToken } from '@/lib/middleware/auth';

// Ruta para obtener y actualizar la configuración de la cuenta de servicio
export async function GET(request: NextRequest) {
  try {
    const authError = requireAuth(request);
    
    // Verificar si el usuario está autenticado y es admin
    if (authError) {
      return authError;
    }
    
    // Obtener token del header
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.substring(7); // Quitar 'Bearer '
    const user = getUserFromToken(token);
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Obtener las variables de entorno relacionadas con la cuenta de servicio
    const config = {
      projectId: process.env.GOOGLE_PROJECT_ID || '',
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL || '',
      privateKey: process.env.GOOGLE_PRIVATE_KEY || '',
      privateKeyId: process.env.GOOGLE_PRIVATE_KEY_ID || '',
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      calendarId: process.env.GOOGLE_CALENDAR_ID || '',
    };

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = requireAuth(request);
    
    // Verificar si el usuario está autenticado y es admin
    if (authError) {
      return authError;
    }
    
    // Obtener token del header
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.substring(7); // Quitar 'Bearer '
    const user = getUserFromToken(token);
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { projectId, clientEmail, privateKey, privateKeyId, clientId, calendarId } = body;

    // Validar datos
    if (!projectId || !clientEmail || !privateKey || !privateKeyId || !clientId || !calendarId) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Leer el archivo .env.local actual
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Función para actualizar o añadir una variable de entorno en el contenido
    const updateEnvVariable = (content: string, key: string, value: string): string => {
      const regex = new RegExp(`^${key}=.*`, 'gm');
      const escapedValue = value.replace(/"/g, '\\"'); // Escapar comillas dobles
      
      if (content.match(regex)) {
        // Actualizar variable existente
        return content.replace(regex, `${key}="${escapedValue}"`);
      } else {
        // Añadir nueva variable
        return `${content}\n${key}="${escapedValue}"`;
      }
    };
    
    // Actualizar cada variable de entorno
    let updatedContent = envContent;
    updatedContent = updateEnvVariable(updatedContent, 'GOOGLE_PROJECT_ID', projectId);
    updatedContent = updateEnvVariable(updatedContent, 'GOOGLE_CLIENT_EMAIL', clientEmail);
    updatedContent = updateEnvVariable(updatedContent, 'GOOGLE_PRIVATE_KEY', privateKey);
    updatedContent = updateEnvVariable(updatedContent, 'GOOGLE_PRIVATE_KEY_ID', privateKeyId);
    updatedContent = updateEnvVariable(updatedContent, 'GOOGLE_CLIENT_ID', clientId);
    updatedContent = updateEnvVariable(updatedContent, 'GOOGLE_CALENDAR_ID', calendarId);
    
    // Guardar archivo .env.local actualizado
    fs.writeFileSync(envPath, updatedContent, 'utf8');
    
    // Para que los cambios surtan efecto, sería necesario reiniciar el servidor
    return NextResponse.json({
      success: true,
      message: 'Configuración guardada correctamente. Es necesario reiniciar el servidor para que los cambios surtan efecto.'
    });
  } catch (error) {
    console.error('Error guardando configuración:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
