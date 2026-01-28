/**
 * Middleware compartido de protección CSRF
 * Protege contra ataques Cross-Site Request Forgery
 */

const crypto = require('crypto');

/**
 * Configura CSRF protection usando @fastify/csrf-protection
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function setupCSRF(fastify, options = {}) {
  const {
    cookieKey = '_csrf',
    cookieOpts = {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      signed: true
    },
    ...customOptions
  } = options;

  // Primero registrar el plugin de cookies si no está registrado
  if (!fastify.hasPlugin('@fastify/cookie')) {
    if (!process.env.COOKIE_SECRET) {
      const errorMessage = 'COOKIE_SECRET no está definido en las variables de entorno';
      fastify.log.error(errorMessage);
      throw new Error(errorMessage);
    }

    await fastify.register(require('@fastify/cookie'), {
      secret: process.env.COOKIE_SECRET
    });
  }

  // Registrar CSRF protection
  await fastify.register(require('@fastify/csrf-protection'), {
    cookieKey,
    cookieOpts,
    ...customOptions
  });
}

/**
 * Genera un token CSRF
 * @returns {string} Token CSRF
 */
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware para generar y enviar token CSRF en la respuesta
 */
async function attachCSRFToken(request, reply) {
  const token = await reply.generateCsrf();
  reply.header('X-CSRF-Token', token);
}

/**
 * Decorador para excluir rutas de CSRF protection
 * Usar en rutas GET que solo leen datos
 */
const skipCSRF = {
  config: {
    csrf: false
  }
};

/**
 * Lista de métodos HTTP que requieren CSRF protection
 */
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Verifica si un método HTTP requiere CSRF protection
 * @param {string} method - Método HTTP
 * @returns {boolean}
 */
function requiresCSRF(method) {
  return CSRF_PROTECTED_METHODS.includes(method.toUpperCase());
}

module.exports = {
  setupCSRF,
  generateCSRFToken,
  attachCSRFToken,
  skipCSRF,
  requiresCSRF,
  CSRF_PROTECTED_METHODS
};
