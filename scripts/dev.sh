#!/bin/bash

# Usar el puerto de la variable de entorno PORT o 3000 por defecto
PORT=${PORT:-3000}

echo "🔍 Verificando si hay procesos en el puerto $PORT..."

# Buscar el PID del proceso en el puerto 3030
PID=$(lsof -ti :$PORT)

if [ ! -z "$PID" ]; then
    echo "💀 Matando proceso $PID en puerto $PORT..."
    kill -9 $PID
    if [ $? -eq 0 ]; then
        echo "✅ Proceso eliminado exitosamente"
    else
        echo "❌ Error al eliminar el proceso"
        exit 1
    fi
else
    echo "✅ Puerto $PORT está libre"
fi

echo "🚀 Iniciando Next.js en puerto $PORT..."
next dev -p $PORT
