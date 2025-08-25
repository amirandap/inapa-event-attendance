#!/bin/bash

# Script para configurar las variables de entorno para Google OAuth
# Uso: ./scripts/setup-google-oauth.sh

echo "🔧 Configurando Google OAuth para INAPA Event Attendance"
echo "=================================================="

# Verificar si .env.local existe
if [ ! -f ".env.local" ]; then
    echo "📄 Creando archivo .env.local..."
    touch .env.local
else
    echo "📄 Archivo .env.local ya existe"
fi

# Función para agregar o actualizar variable de entorno
update_env_var() {
    local var_name=$1
    local var_value=$2
    local env_file=".env.local"
    
    if grep -q "^${var_name}=" "$env_file"; then
        # La variable existe, actualizarla
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^${var_name}=.*|${var_name}=${var_value}|" "$env_file"
        else
            # Linux
            sed -i "s|^${var_name}=.*|${var_name}=${var_value}|" "$env_file"
        fi
        echo "✅ Actualizada: $var_name"
    else
        # La variable no existe, agregarla
        echo "${var_name}=${var_value}" >> "$env_file"
        echo "➕ Agregada: $var_name"
    fi
}

echo ""
echo "📋 Configurando variables de Google OAuth..."

# Google OAuth Client ID
read -p "🔑 Ingresa tu Google OAuth Client ID: " GOOGLE_CLIENT_ID
if [ ! -z "$GOOGLE_CLIENT_ID" ]; then
    update_env_var "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID"
fi

# Google OAuth Client Secret
read -s -p "🔐 Ingresa tu Google OAuth Client Secret: " GOOGLE_CLIENT_SECRET
echo ""
if [ ! -z "$GOOGLE_CLIENT_SECRET" ]; then
    update_env_var "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET"
fi

# Redirect URI
echo ""
echo "🌐 Configurando Redirect URI..."
read -p "📍 Ingresa tu dominio base (ej: http://localhost:3000): " BASE_URL
if [ ! -z "$BASE_URL" ]; then
    REDIRECT_URI="${BASE_URL}/api/auth/google/callback"
    update_env_var "GOOGLE_REDIRECT_URI" "$REDIRECT_URI"
    echo "✅ Redirect URI configurado: $REDIRECT_URI"
fi

# NextAuth URL
if [ ! -z "$BASE_URL" ]; then
    update_env_var "NEXTAUTH_URL" "$BASE_URL"
fi

# NextAuth Secret (generar uno aleatorio si no se proporciona)
read -p "🎲 Ingresa NextAuth Secret (presiona Enter para generar uno aleatorio): " NEXTAUTH_SECRET
if [ -z "$NEXTAUTH_SECRET" ]; then
    # Generar secret aleatorio
    NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null || echo "$(date +%s | sha256sum | base64 | head -c 32)")
    echo "🎲 Secret generado automáticamente"
fi
update_env_var "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET"

echo ""
echo "📊 Configurando base de datos..."

# Database URL
DATABASE_URL="file:./prisma/dev.db"
update_env_var "DATABASE_URL" "$DATABASE_URL"

echo ""
echo "🎉 ¡Configuración completada!"
echo "=================================================="
echo ""
echo "📁 Variables configuradas en .env.local:"
echo "   - GOOGLE_CLIENT_ID"
echo "   - GOOGLE_CLIENT_SECRET" 
echo "   - GOOGLE_REDIRECT_URI"
echo "   - NEXTAUTH_URL"
echo "   - NEXTAUTH_SECRET"
echo "   - DATABASE_URL"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Verifica que las credenciales de Google estén correctas"
echo "   2. Asegúrate de que el Redirect URI esté configurado en Google Console"
echo "   3. Ejecuta: npm run dev"
echo "   4. Ve a /dashboard/configuracion para probar la integración"
echo ""
echo "🔗 Google Console: https://console.developers.google.com/"
echo "   - Habilita Google Calendar API"
echo "   - Configura OAuth 2.0 credentials"
echo "   - Agrega el Redirect URI: $REDIRECT_URI"
echo ""
echo "⚠️  IMPORTANTE: Nunca compartas tu .env.local en repositorios públicos"
