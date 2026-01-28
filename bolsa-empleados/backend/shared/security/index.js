/**
 * Módulo compartido de seguridad
 * Exporta todas las utilidades de seguridad para uso en microservicios
 */

const jwtAuth = require('./jwt-auth');
const rateLimit = require('./rate-limit');
const csrfProtection = require('./csrf-protection');
const securityHeaders = require('./security-headers');
const auditLogger = require('./audit-logger');
const errorHandler = require('./error-handler');

/**
 * Configura todas las medidas de seguridad en un microservicio
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} db - Instancia de Firestore
 * @param {Object} options - Opciones de configuración
 */
async function setupSecurity(fastify, db, options = {}) {
  const {
    enableJWT = true,
    enableRateLimit = true,
    enableCSRF = false, // CSRF puede causar problemas con APIs REST, habilitar solo si es necesario
    enableSecurityHeaders = true,
    enableAuditLog = true,
    rateLimitOptions = {},
    csrfOptions = {},
    securityHeadersOptions = {},
    publicRoutes = []
  } = options;

  // 1. Security Headers (siempre primero)
  if (enableSecurityHeaders) {
    const headerOptions = process.env.NODE_ENV === 'production'
      ? { ...securityHeaders.productionHeaders, ...securityHeadersOptions }
      : { ...securityHeaders.developmentHeaders, ...securityHeadersOptions };

    await securityHeaders.setupSecurityHeaders(fastify, headerOptions);
  }

  // 2. Rate Limiting
  if (enableRateLimit) {
    await rateLimit.setupRateLimit(fastify, {
      max: 100,
      timeWindow: '1 minute',
      ...rateLimitOptions
    });
  }

  // 3. JWT Authentication
  if (enableJWT) {
    await jwtAuth.setupJWT(fastify);

    // Agregar hook para verificar JWT en todas las rutas excepto las públicas
    fastify.addHook('onRequest', async (request, reply) => {
      // Skip para rutas públicas
      if (jwtAuth.isPublicRoute(request.url) || publicRoutes.includes(request.url)) {
        return;
      }

      // Verificar JWT
      await jwtAuth.verifyJWT(request, reply);
    });
  }

  // 4. CSRF Protection (opcional)
  if (enableCSRF) {
    await csrfProtection.setupCSRF(fastify, csrfOptions);
  }

  // 5. Audit Logging
  let auditLoggerInstance = null;
  if (enableAuditLog && db) {
    auditLoggerInstance = new auditLogger.AuditLogger(db, fastify.log);

    // Agregar hook para logging automático
    fastify.addHook('onRequest', auditLogger.auditLoggerHook(auditLoggerInstance));

    // Decorar fastify con el audit logger para uso en rutas
    fastify.decorate('auditLog', auditLoggerInstance);
  }

  // 6. Error Handler (debe ser lo último)
  errorHandler.setupErrorHandler(fastify);

  fastify.log.info('Seguridad configurada correctamente');

  return {
    auditLogger: auditLoggerInstance
  };
}

module.exports = {
  setupSecurity,
  ...jwtAuth,
  ...rateLimit,
  ...csrfProtection,
  ...securityHeaders,
  ...auditLogger,
  ...errorHandler
};
