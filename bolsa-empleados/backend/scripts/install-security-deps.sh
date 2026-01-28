#!/bin/bash

# Script para instalar dependencias de seguridad en todos los microservicios
# Este script instala @fastify/jwt, @fastify/helmet, @fastify/rate-limit, etc.

echo "=========================================="
echo "Instalando dependencias de seguridad"
echo "=========================================="

SERVICES_DIR="/home/user/bolsa-empleados/backend/services"

# Lista de servicios (excluir authenticacion que ya tiene las dependencias)
SERVICES=(
  "colocacion-laboral"
  "cumplimiento-legal"
  "empleados"
  "evaluacion-desempeno"
  "matching"
  "monetizacion"
  "proceso-laboral"
  "reportes"
  "vacantes"
)

# Dependencias de seguridad a instalar
SECURITY_DEPS=(
  "@fastify/jwt@^9.0.1"
  "@fastify/cookie@^11.0.1"
  "@fastify/rate-limit@^10.3.0"
  "@fastify/helmet@^12.0.1"
  "@fastify/csrf-protection@^7.0.1"
)

for service in "${SERVICES[@]}"; do
  echo ""
  echo "----------------------------------------"
  echo "Procesando servicio: $service"
  echo "----------------------------------------"

  SERVICE_PATH="$SERVICES_DIR/$service"

  if [ -d "$SERVICE_PATH" ]; then
    cd "$SERVICE_PATH" || continue

    echo "Instalando dependencias de seguridad en $service..."
    npm install "${SECURITY_DEPS[@]}" --save

    if [ $? -eq 0 ]; then
      echo "✓ Dependencias instaladas correctamente en $service"
    else
      echo "✗ Error al instalar dependencias en $service"
    fi
  else
    echo "✗ No se encontró el directorio: $SERVICE_PATH"
  fi
done

echo ""
echo "=========================================="
echo "Instalación completada"
echo "=========================================="
