/**
 * Middleware compartido de Rate Limiting
 * Protege contra ataques de fuerza bruta y abuso de API
 */

/**
 * Configura rate limiting usando @fastify/rate-limit
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function setupRateLimit(fastify, options = {}) {
  const {
    max = 100, // Máximo de requests
    timeWindow = '1 minute', // Ventana de tiempo
    redis = null, // Cliente Redis opcional para rate limiting distribuido
    skipOnError = false, // Si hay error en Redis, permitir o denegar
    whitelist = [], // IPs en whitelist
    ...customOptions
  } = options;

  await fastify.register(require('@fastify/rate-limit'), {
    max,
    timeWindow,
    redis,
    skipOnError,
    allowList: whitelist,
    ...customOptions
  });
}

/**
 * Rate limiter estricto para endpoints sensibles (login, registro, etc.)
 * 5 intentos por minuto por IP
 */
const strictRateLimit = {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '1 minute'
    }
  }
};

/**
 * Rate limiter moderado para endpoints de lectura
 * 60 requests por minuto por IP
 */
const moderateRateLimit = {
  config: {
    rateLimit: {
      max: 60,
      timeWindow: '1 minute'
    }
  }
};

/**
 * Rate limiter permisivo para endpoints menos críticos
 * 100 requests por minuto por IP
 */
const permissiveRateLimit = {
  config: {
    rateLimit: {
      max: 100,
      timeWindow: '1 minute'
    }
  }
};

/**
 * Crea una configuración de rate limit personalizada
 * @param {number} max - Máximo de requests
 * @param {string} timeWindow - Ventana de tiempo
 * @returns {Object} Configuración de rate limit
 */
function createRateLimit(max, timeWindow = '1 minute') {
  return {
    config: {
      rateLimit: {
        max,
        timeWindow
      }
    }
  };
}

module.exports = {
  setupRateLimit,
  strictRateLimit,
  moderateRateLimit,
  permissiveRateLimit,
  createRateLimit
};
