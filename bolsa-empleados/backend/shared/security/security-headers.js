/**
 * Middleware compartido de Security Headers
 * Implementa headers de seguridad recomendados por OWASP
 */

/**
 * Configura security headers usando @fastify/helmet
 * @param {FastifyInstance} fastify - Instancia de Fastify
 * @param {Object} options - Opciones de configuración
 */
async function setupSecurityHeaders(fastify, options = {}) {
  const defaultOptions = {
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    // Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: true,
    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    // Cross-Origin-Resource-Policy
    crossOriginResourcePolicy: { policy: 'same-origin' },
    // DNS Prefetch Control
    dnsPrefetchControl: { allow: false },
    // Frame Options
    frameguard: { action: 'deny' },
    // Hide Powered-By header
    hidePoweredBy: true,
    // HTTP Strict Transport Security (HSTS)
    hsts: {
      maxAge: 31536000, // 1 año
      includeSubDomains: true,
      preload: true
    },
    // IE No Open
    ieNoOpen: true,
    // No Sniff
    noSniff: true,
    // Origin-Agent-Cluster
    originAgentCluster: true,
    // Permitted Cross-Domain Policies
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    // Referrer Policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // X-XSS-Protection
    xssFilter: true,
    ...options
  };

  await fastify.register(require('@fastify/helmet'), defaultOptions);
}

/**
 * Headers de seguridad mínimos para ambientes de desarrollo
 */
const developmentHeaders = {
  contentSecurityPolicy: false, // Deshabilitado en dev para facilitar desarrollo
  hsts: false // HTTPS no suele estar habilitado en desarrollo
};

/**
 * Headers de seguridad estrictos para producción
 */
const productionHeaders = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: []
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

/**
 * Agrega headers de seguridad personalizados
 * @param {FastifyReply} reply - Objeto reply de Fastify
 */
function addCustomSecurityHeaders(reply) {
  // Prevenir clickjacking
  reply.header('X-Frame-Options', 'DENY');

  // Prevenir MIME type sniffing
  reply.header('X-Content-Type-Options', 'nosniff');

  // Habilitar protección XSS del navegador
  reply.header('X-XSS-Protection', '1; mode=block');

  // Política de referencia
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Política de permisos (anteriormente Feature-Policy)
  reply.header('Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // Cross-Domain Policies
  reply.header('X-Permitted-Cross-Domain-Policies', 'none');

  // Download Options
  reply.header('X-Download-Options', 'noopen');

  // DNS Prefetch Control
  reply.header('X-DNS-Prefetch-Control', 'off');

  // Expect-CT (Certificate Transparency)
  if (process.env.NODE_ENV === 'production') {
    reply.header('Expect-CT', 'max-age=86400, enforce');
  }
}

/**
 * Hook para agregar headers de seguridad a todas las respuestas
 */
function securityHeadersHook(request, reply, done) {
  addCustomSecurityHeaders(reply);
  done();
}

module.exports = {
  setupSecurityHeaders,
  developmentHeaders,
  productionHeaders,
  addCustomSecurityHeaders,
  securityHeadersHook
};
