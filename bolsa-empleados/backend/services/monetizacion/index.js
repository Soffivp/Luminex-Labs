/**
 * Microservicio de Monetización - Bolsa de Empleados
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
const SERVICE_NAME = 'monetizacion';
const PORT = parseInt(process.env.MONETIZACION_PORT || process.env.PORT || '3010', 10);

// Función principal
async function main() {
  try {
    const service = await configureMicroservice(fastify, db, {
      serviceName: SERVICE_NAME,
      port: PORT,
      publicRoutes: ['/health', '/'],
      enableJWT: true,
      enableRateLimit: true,
      enableSecurityHeaders: true,
      enableAuditLog: true,
      rateLimitOptions: {
        max: 60,
        timeWindow: '1 minute'
      },
      setupRoutes: () => {
        require('./monetizacion')(fastify, db);
      }
    });

    await service.start();
  } catch (error) {
    fastify.log.error('Error fatal al iniciar el servicio:', error);
    throw error;
  }
}

main();
module.exports = fastify;
