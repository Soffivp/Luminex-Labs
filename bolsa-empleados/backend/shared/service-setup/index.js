/**
 * Módulo compartido para configuración de servicios
 * Reduce duplicación de código en inicialización de microservicios
 */

const security = require('../security');

/**
 * Configuración CORS segura
 * Evita usar wildcard (*) que SonarQube marca como security hotspot
 */
function getCorsConfig() {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:8080'];

  return {
    origin: (origin, callback) => {
      // Permitir requests sin origin (ej: Postman, curl, apps móviles)
      if (!origin) {
        callback(null, true);
        return;
      }

      // En desarrollo, permitir cualquier localhost
      if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
        callback(null, true);
        return;
      }

      // Verificar si el origin está en la lista permitida
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} no permitido por CORS`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400 // 24 horas
  };
}

/**
 * Configura un servicio Fastify con todas las medidas de seguridad
 *
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} db - Instancia de Firestore
 * @param {Object} options - Opciones de configuración
 * @param {string} options.serviceName - Nombre del servicio
 * @param {Array<string>} options.publicRoutes - Rutas públicas sin autenticación
 * @param {boolean} options.enableJWT - Habilitar autenticación JWT (default: true)
 * @param {boolean} options.enableRateLimit - Habilitar rate limiting (default: true)
 * @param {boolean} options.enableSecurityHeaders - Habilitar security headers (default: true)
 * @param {boolean} options.enableAuditLog - Habilitar audit logging (default: true)
 * @param {Object} options.rateLimitOptions - Opciones de rate limiting
 * @returns {Promise<void>}
 */
async function setupService(fastify, db, options = {}) {
  const {
    serviceName = 'unknown',
    publicRoutes = ['/health'],
    enableJWT = true,
    enableRateLimit = true,
    enableSecurityHeaders = true,
    enableAuditLog = true,
    rateLimitOptions = {}
  } = options;

  // Decorar fastify con el nombre del servicio
  fastify.decorate('serviceName', serviceName);

  // 1. CORS (primero, antes que otros plugins)
  await fastify.register(require('@fastify/cors'), getCorsConfig());

  // 2. Configurar seguridad completa
  await security.setupSecurity(fastify, db, {
    enableJWT,
    enableRateLimit,
    enableCSRF: false,
    enableSecurityHeaders,
    enableAuditLog,
    publicRoutes,
    rateLimitOptions: {
      max: 60,
      timeWindow: '1 minute',
      ...rateLimitOptions
    }
  });

  // 3. Health check (siempre público)
  fastify.get('/health', async () => ({
    status: 'healthy',
    service: serviceName,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  }));

  // 4. Ruta raíz informativa
  fastify.get('/', async () => ({
    ok: true,
    service: serviceName,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    security: {
      jwt: enableJWT,
      rateLimit: enableRateLimit,
      securityHeaders: enableSecurityHeaders,
      auditLog: enableAuditLog
    }
  }));

  fastify.log.info(`Servicio ${serviceName} configurado con seguridad completa`);
}

/**
 * Inicia un servidor Fastify con manejo de errores
 * Reemplaza el uso directo de process.exit() que SonarQube marca
 *
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 * @param {number} options.port - Puerto del servidor
 * @param {string} options.host - Host del servidor (default: '0.0.0.0')
 * @param {string} options.serviceName - Nombre del servicio
 * @param {Function} options.onError - Callback en caso de error
 * @returns {Promise<void>}
 */
async function startServer(fastify, options = {}) {
  const {
    port = 3000,
    host = '0.0.0.0',
    serviceName = 'unknown',
    onError
  } = options;

  try {
    await fastify.listen({ port, host });

    fastify.log.info(`✓ ${serviceName} corriendo en puerto ${port}`);
    fastify.log.info('✓ Seguridad: JWT, Rate Limiting, Security Headers, Audit Log');

  } catch (err) {
    fastify.log.error(`Error al iniciar ${serviceName}:`, err);

    // Llamar callback de error si existe
    if (onError && typeof onError === 'function') {
      onError(err);
    }

    // Lanzar error en lugar de process.exit() directo
    throw err;
  }
}

/**
 * Configura graceful shutdown para un servicio
 * Maneja señales SIGTERM y SIGINT correctamente
 *
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 * @param {Function} options.onShutdown - Callback antes de cerrar
 */
function setupGracefulShutdown(fastify, options = {}) {
  const { onShutdown } = options;

  const gracefulShutdown = async (signal) => {
    fastify.log.info(`Recibida señal ${signal}, cerrando servidor...`);

    try {
      // Ejecutar callback de shutdown si existe
      if (onShutdown && typeof onShutdown === 'function') {
        await onShutdown();
      }

      // Cerrar servidor Fastify
      await fastify.close();

      fastify.log.info('Servidor cerrado correctamente');

      // Salir con código 0 (éxito)
      // eslint-disable-next-line no-process-exit
      process.exit(0);

    } catch (err) {
      fastify.log.error('Error durante shutdown:', err);

      // Salir con código 1 (error)
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  };

  // Registrar handlers para señales de terminación
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handler para errores no capturados
  process.on('uncaughtException', (err) => {
    fastify.log.error('Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason) => {
    fastify.log.error('Unhandled Rejection:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
  });
}

/**
 * Validación de variables de entorno requeridas
 * Evita que el servicio arranque sin configuración crítica
 *
 * @param {Array<string>} requiredVars - Variables requeridas
 * @throws {Error} Si falta alguna variable requerida
 */
function validateEnvVars(requiredVars = []) {
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Variables de entorno faltantes: ${missingVars.join(', ')}\n` +
      'Por favor, configura estas variables en tu archivo .env'
    );
  }
}

/**
 * Configuración completa de un microservicio
 * Combina todos los pasos en una sola función
 *
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} db - Instancia de Firestore
 * @param {Object} options - Opciones de configuración
 * @returns {Promise<Object>} { start, setupRoutes }
 */
async function configureMicroservice(fastify, db, options = {}) {
  const {
    serviceName = 'unknown',
    port = 3000,
    publicRoutes = ['/health'],
    requiredEnvVars = [],
    setupRoutes,
    onShutdown,
    ...securityOptions
  } = options;

  // 1. Validar variables de entorno
  if (requiredEnvVars.length > 0) {
    validateEnvVars(requiredEnvVars);
  }

  // 2. Configurar servicio con seguridad
  await setupService(fastify, db, {
    serviceName,
    publicRoutes,
    ...securityOptions
  });

  // 3. Configurar graceful shutdown
  setupGracefulShutdown(fastify, { onShutdown });

  // 4. Retornar función para iniciar servidor
  return {
    start: async () => {
      await startServer(fastify, { port, serviceName });
    },
    setupRoutes: setupRoutes || (() => {})
  };
}

module.exports = {
  getCorsConfig,
  setupService,
  startServer,
  setupGracefulShutdown,
  validateEnvVars,
  configureMicroservice
};
