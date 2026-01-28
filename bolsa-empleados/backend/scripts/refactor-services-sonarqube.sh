#!/bin/bash

# Script para refactorizar servicios según estándares de SonarQube
# Reduce código duplicado y elimina security hotspots

echo "=========================================="
echo "Refactorización de Servicios - SonarQube"
echo "=========================================="
echo ""
echo "Este script actualiza los servicios para:"
echo "  ✓ Eliminar código duplicado (DRY)"
echo "  ✓ Corregir security hotspots"
echo "  ✓ Usar módulos compartidos"
echo "  ✓ Mejorar CORS configuration"
echo "  ✓ Eliminar process.exit() directo"
echo ""

SERVICES_DIR="/home/user/bolsa-empleados/backend/services"

# Lista de servicios a refactorizar (excluir matching que ya está hecho)
SERVICES=(
  "empleados"
  "empresas"
  "vacantes"
  "reportes"
  "colocacion-laboral"
  "cumplimiento-legal"
  "evaluacion-desempeno"
  "monetizacion"
  "proceso-laboral"
  "authenticacion"
)

# Función para crear el nuevo index.js refactorizado
create_refactored_index() {
  local service_name=$1
  local service_path=$2
  local port=$3
  local main_file=$4

  cat > "${service_path}/index.js" << 'EOF'
/**
 * Microservicio {{SERVICE_NAME}} - Bolsa de Empleados
 * Versión refactorizada con módulos compartidos (SonarQube compliant)
 */

require('dotenv').config();
const fastify = require('fastify')({
  logger: process.env.NODE_ENV !== 'production'
});

// Módulos compartidos
const { initializeFirebase } = require('../../shared/firebase');
const { configureMicroservice } = require('../../shared/service-setup');

// Inicializar Firebase
const { db } = initializeFirebase({
  serviceAccountPath: process.env.SERVICE_ACCOUNT_PATH
});

// Configuración del servicio
const SERVICE_NAME = '{{SERVICE_NAME}}';
const PORT = parseInt(process.env.{{SERVICE_NAME_UPPER}}_PORT || process.env.PORT || '{{DEFAULT_PORT}}', 10);

// Función principal
async function main() {
  try {
    // Configurar microservicio con seguridad completa
    const service = await configureMicroservice(fastify, db, {
      serviceName: SERVICE_NAME,
      port: PORT,
      publicRoutes: ['/health', '/'],
      requiredEnvVars: [], // JWT_SECRET y otros se validan en setupService
      enableJWT: true,
      enableRateLimit: true,
      enableSecurityHeaders: true,
      enableAuditLog: true,
      rateLimitOptions: {
        max: 60,
        timeWindow: '1 minute'
      },
      setupRoutes: () => {
        // Registrar rutas del servicio
        require('./{{MAIN_FILE}}')(fastify, db);
      }
    });

    // Iniciar servidor
    await service.start();

  } catch (error) {
    fastify.log.error('Error fatal al iniciar el servicio:', error);
    // El proceso terminará por el error no capturado
    throw error;
  }
}

// Iniciar aplicación
main();

module.exports = fastify;
EOF

  # Reemplazar placeholders
  sed -i "s/{{SERVICE_NAME}}/$service_name/g" "${service_path}/index.js"
  sed -i "s/{{SERVICE_NAME_UPPER}}/${service_name^^}/g" "${service_path}/index.js"
  sed -i "s/{{DEFAULT_PORT}}/$port/g" "${service_path}/index.js"
  sed -i "s/{{MAIN_FILE}}/$main_file/g" "${service_path}/index.js"
}

# Mapeo de servicios con sus configuraciones
declare -A SERVICE_CONFIG
SERVICE_CONFIG["empleados"]="3002:empleado"
SERVICE_CONFIG["empresas"]="3001:empresa"
SERVICE_CONFIG["vacantes"]="3003:vacante"
SERVICE_CONFIG["reportes"]="3005:reportes"
SERVICE_CONFIG["colocacion-laboral"]="3007:colocacion"
SERVICE_CONFIG["cumplimiento-legal"]="3008:cumplimiento"
SERVICE_CONFIG["evaluacion-desempeno"]="3009:evaluacion"
SERVICE_CONFIG["monetizacion"]="3010:monetizacion"
SERVICE_CONFIG["proceso-laboral"]="3011:proceso"
SERVICE_CONFIG["authenticacion"]="3006:auth"

echo "Refactorizando servicios..."
echo ""

for service in "${SERVICES[@]}"; do
  echo "----------------------------------------"
  echo "Procesando: $service"
  echo "----------------------------------------"

  SERVICE_PATH="$SERVICES_DIR/$service"

  if [ ! -d "$SERVICE_PATH" ]; then
    echo "⚠️  No se encontró el directorio: $SERVICE_PATH"
    continue
  fi

  # Obtener configuración del servicio
  config="${SERVICE_CONFIG[$service]}"
  port=$(echo "$config" | cut -d':' -f1)
  main_file=$(echo "$config" | cut -d':' -f2)

  # Crear backup del index.js actual
  if [ -f "${SERVICE_PATH}/index.js" ]; then
    echo "  → Creando backup: index.js.backup"
    cp "${SERVICE_PATH}/index.js" "${SERVICE_PATH}/index.js.backup"
  fi

  # Crear nuevo index.js refactorizado
  echo "  → Generando index.js refactorizado"
  create_refactored_index "$service" "$SERVICE_PATH" "$port" "$main_file"

  echo "  ✓ $service refactorizado"
  echo ""
done

echo "=========================================="
echo "Refactorización completada"
echo "=========================================="
echo ""
echo "Archivos de backup creados con extensión .backup"
echo ""
echo "Próximos pasos:"
echo "  1. Revisar los cambios en cada servicio"
echo "  2. Probar que los servicios arrancan correctamente"
echo "  3. Ejecutar análisis de SonarQube"
echo "  4. Si todo funciona, eliminar los backups"
echo ""
echo "Para restaurar un servicio desde backup:"
echo "  mv backend/services/<servicio>/index.js.backup backend/services/<servicio>/index.js"
echo ""
