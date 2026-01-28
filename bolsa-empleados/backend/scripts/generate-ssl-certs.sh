#!/bin/bash

# Script para generar certificados SSL autofirmados para desarrollo
# NOTA: Para producción, usar certificados de Let's Encrypt o un proveedor comercial

echo "=========================================="
echo "Generando certificados SSL autofirmados"
echo "=========================================="

# Directorio para guardar los certificados
SSL_DIR="/home/user/bolsa-empleados/backend/nginx/ssl"

# Crear directorio si no existe
mkdir -p "$SSL_DIR"

cd "$SSL_DIR" || exit

# Verificar si ya existen certificados
if [ -f "server.crt" ] && [ -f "server.key" ]; then
  echo "⚠️  Ya existen certificados SSL en $SSL_DIR"
  read -p "¿Desea regenerarlos? (s/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operación cancelada"
    exit 0
  fi
  echo "Regenerando certificados..."
fi

# Generar clave privada RSA de 2048 bits
echo "1. Generando clave privada RSA..."
openssl genrsa -out server.key 2048

# Generar certificado autofirmado válido por 365 días
echo "2. Generando certificado autofirmado..."
openssl req -new -x509 -key server.key -out server.crt -days 365 \
  -subj "/C=EC/ST=Pichincha/L=Quito/O=CAIL/OU=IT/CN=localhost"

# Generar DH parameters para mayor seguridad (opcional, toma tiempo)
echo "3. Generando DH parameters (esto puede tardar varios minutos)..."
openssl dhparam -out dhparam.pem 2048

# Establecer permisos correctos
chmod 600 server.key
chmod 644 server.crt
chmod 644 dhparam.pem

echo ""
echo "=========================================="
echo "✓ Certificados SSL generados exitosamente"
echo "=========================================="
echo ""
echo "Archivos generados en: $SSL_DIR"
echo "  - server.key (clave privada)"
echo "  - server.crt (certificado)"
echo "  - dhparam.pem (DH parameters)"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  - Estos certificados son SOLO para desarrollo"
echo "  - Para producción, use certificados de Let's Encrypt o un CA comercial"
echo "  - Los navegadores mostrarán advertencias de seguridad con certificados autofirmados"
echo ""
echo "Para usar estos certificados, actualice su nginx.conf:"
echo "  ssl_certificate     /path/to/ssl/server.crt;"
echo "  ssl_certificate_key /path/to/ssl/server.key;"
echo "  ssl_dhparam         /path/to/ssl/dhparam.pem;"
echo ""
