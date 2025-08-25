#!/bin/bash

# Script para verificar configuración de Google OAuth 2.0
# Ejecutar: chmod +x scripts/check-oauth-config.sh && ./scripts/check-oauth-config.sh

echo "🔍 VERIFICANDO CONFIGURACIÓN DE GOOGLE OAUTH 2.0"
echo "=================================================="

# Verificar si existe .env.local
if [ ! -f ".env.local" ]; then
    echo "❌ No se encontró .env.local"
    echo "   Crear archivo .env.local con las variables necesarias"
    exit 1
fi

echo "✅ Archivo .env.local encontrado"
echo ""

# Verificar variables críticas
echo "📋 VARIABLES DE ENTORNO:"
echo "------------------------"

# Service Account (ya configurado)
if grep -q "GOOGLE_PROJECT_ID" .env.local; then
    PROJECT_ID=$(grep "GOOGLE_PROJECT_ID" .env.local | cut -d'=' -f2 | tr -d '"')
    echo "✅ GOOGLE_PROJECT_ID: $PROJECT_ID"
else
    echo "❌ GOOGLE_PROJECT_ID no encontrado"
fi

if grep -q "GOOGLE_CLIENT_EMAIL" .env.local; then
    CLIENT_EMAIL=$(grep "GOOGLE_CLIENT_EMAIL" .env.local | cut -d'=' -f2 | tr -d '"')
    echo "✅ GOOGLE_CLIENT_EMAIL: $CLIENT_EMAIL"
else
    echo "❌ GOOGLE_CLIENT_EMAIL no encontrado"
fi

# OAuth 2.0 Client (necesita configuración)
echo ""
echo "🔐 OAUTH 2.0 CLIENT:"
echo "--------------------"

if grep -q "GOOGLE_CLIENT_ID" .env.local; then
    OAUTH_CLIENT_ID=$(grep "GOOGLE_CLIENT_ID" .env.local | cut -d'=' -f2 | tr -d '"')
    if [[ $OAUTH_CLIENT_ID == *"TU_CLIENT_ID"* ]]; then
        echo "⚠️  GOOGLE_CLIENT_ID: PLACEHOLDER - NECESITA CONFIGURACIÓN"
        echo "   Ve a: https://console.cloud.google.com/apis/credentials"
    else
        echo "✅ GOOGLE_CLIENT_ID: ${OAUTH_CLIENT_ID:0:20}..."
    fi
else
    echo "❌ GOOGLE_CLIENT_ID no encontrado"
fi

if grep -q "GOOGLE_CLIENT_SECRET" .env.local; then
    OAUTH_CLIENT_SECRET=$(grep "GOOGLE_CLIENT_SECRET" .env.local | cut -d'=' -f2 | tr -d '"')
    if [[ $OAUTH_CLIENT_SECRET == *"TU_CLIENT_SECRET"* ]]; then
        echo "⚠️  GOOGLE_CLIENT_SECRET: PLACEHOLDER - NECESITA CONFIGURACIÓN"
    else
        echo "✅ GOOGLE_CLIENT_SECRET: Configurado"
    fi
else
    echo "❌ GOOGLE_CLIENT_SECRET no encontrado"
fi

if grep -q "NEXTAUTH_URL" .env.local; then
    NEXTAUTH_URL=$(grep "NEXTAUTH_URL" .env.local | cut -d'=' -f2 | tr -d '"')
    echo "✅ NEXTAUTH_URL: $NEXTAUTH_URL"
else
    echo "❌ NEXTAUTH_URL no encontrado"
fi

echo ""
echo "📡 VERIFICANDO CONECTIVIDAD:"
echo "----------------------------"

# Verificar puerto configurado
if grep -q "PORT" .env.local; then
    PORT=$(grep "PORT" .env.local | cut -d'=' -f2 | tr -d '"')
    echo "✅ Puerto configurado: $PORT"
else
    echo "⚠️  Puerto no especificado, usando 3000 por defecto"
    PORT="3000"
fi

# Verificar si el servidor está corriendo
if curl -s "http://localhost:$PORT" > /dev/null; then
    echo "✅ Servidor accesible en puerto $PORT"
else
    echo "⚠️  Servidor no está corriendo en puerto $PORT"
    echo "   Ejecutar: npm run dev"
fi

echo ""
echo "🚀 SIGUIENTES PASOS:"
echo "===================="

# Verificar si necesita configurar OAuth
if grep -q "TU_CLIENT_ID" .env.local; then
    echo "1. 🔗 Ir a Google Cloud Console:"
    echo "   https://console.cloud.google.com/apis/credentials"
    echo ""
    echo "2. 📝 Crear OAuth 2.0 Client ID:"
    echo "   - Tipo: Web Application"
    echo "   - Authorized redirect URIs: http://localhost:${PORT}/api/auth/google/callback"
    echo ""
    echo "3. 📋 Copiar Client ID y Client Secret a .env.local"
    echo ""
    echo "4. 🔄 Reiniciar servidor: npm run dev"
    echo ""
    echo "5. 🧪 Probar autenticación en: http://localhost:${PORT}/dashboard/configuracion"
else
    echo "1. 🔄 Reiniciar servidor si no está corriendo: npm run dev"
    echo "2. 🧪 Probar autenticación en: http://localhost:${PORT}/dashboard/configuracion"
    echo "3. 📚 Ver documentación: INSTRUCCIONES_08_OAUTH_GOOGLE.md"
fi

echo ""
echo "📖 DOCUMENTACIÓN COMPLETA:"
echo "   INSTRUCCIONES_08_OAUTH_GOOGLE.md"
echo ""
