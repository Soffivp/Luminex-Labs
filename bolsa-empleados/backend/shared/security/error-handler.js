/**
 * Módulo de manejo centralizado de errores
 * Previene la fuga de información sensible en mensajes de error
 */

/**
 * Códigos de error personalizados
 */
const ERROR_CODES = {
  // Autenticación y Autorización
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Validación
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Recursos
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Servidor
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR'
};

/**
 * Clase de error personalizado
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = ERROR_CODES.INTERNAL_SERVER_ERROR, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Determina si un error es operacional (esperado) o un error de programación
 */
function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Formatea el error para respuesta al cliente
 * En producción, oculta detalles internos del servidor
 */
function formatErrorResponse(error, isProduction = false) {
  const response = {
    error: true,
    code: error.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: error.message || 'Ha ocurrido un error interno'
  };

  // En desarrollo, incluir stack trace y detalles
  if (!isProduction) {
    response.stack = error.stack;
    if (error.details) {
      response.details = error.details;
    }
  } else {
    // En producción, solo mostrar mensaje genérico para errores no operacionales
    if (!isOperationalError(error)) {
      response.message = 'Ha ocurrido un error interno del servidor';
      response.code = ERROR_CODES.INTERNAL_SERVER_ERROR;
    } else if (error.details) {
      // Para errores operacionales, incluir details si existen
      response.details = error.details;
    }
  }

  return response;
}

/**
 * Handler global de errores para Fastify
 */
function setupErrorHandler(fastify) {
  const isProduction = process.env.NODE_ENV === 'production';

  fastify.setErrorHandler(async (error, request, reply) => {
    // Log del error
    fastify.log.error({
      err: error,
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
        params: request.params,
        query: request.query
      }
    }, 'Error en request');

    // Determinar código de estado HTTP
    let statusCode = error.statusCode || 500;

    // Errores específicos de Fastify
    if (error.validation) {
      statusCode = 400;
      const formattedError = new AppError(
        'Error de validación en los datos enviados',
        400,
        ERROR_CODES.VALIDATION_ERROR,
        error.validation
      );
      return reply.status(400).send(formatErrorResponse(formattedError, isProduction));
    }

    // Error de rate limiting
    if (error.statusCode === 429) {
      const formattedError = new AppError(
        'Demasiadas solicitudes. Por favor, intente más tarde.',
        429,
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        { retryAfter: error.retryAfter || 60 }
      );
      return reply.status(429).send(formatErrorResponse(formattedError, isProduction));
    }

    // Error de JWT
    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' ||
        error.code === 'FST_JWT_BAD_REQUEST' ||
        error.message?.includes('jwt') ||
        error.message?.includes('token')) {
      const formattedError = new AppError(
        'Token de autenticación inválido o no proporcionado',
        401,
        ERROR_CODES.INVALID_TOKEN
      );
      return reply.status(401).send(formatErrorResponse(formattedError, isProduction));
    }

    // Error de CSRF
    if (error.code === 'FST_CSRF_INVALID_TOKEN') {
      const formattedError = new AppError(
        'Token CSRF inválido',
        403,
        ERROR_CODES.FORBIDDEN
      );
      return reply.status(403).send(formatErrorResponse(formattedError, isProduction));
    }

    // Errores de Firestore/Database
    if (error.code?.startsWith('FIRESTORE') || error.message?.includes('Firestore')) {
      fastify.log.error('Database error:', error);
      const formattedError = new AppError(
        'Error al acceder a la base de datos',
        500,
        ERROR_CODES.DATABASE_ERROR
      );
      return reply.status(500).send(formatErrorResponse(formattedError, isProduction));
    }

    // Enviar respuesta de error formateada
    const formattedError = error instanceof AppError
      ? error
      : new AppError(error.message, statusCode, ERROR_CODES.INTERNAL_SERVER_ERROR);

    return reply.status(statusCode).send(formatErrorResponse(formattedError, isProduction));
  });

  // Handler para rutas no encontradas (404)
  fastify.setNotFoundHandler(async (request, reply) => {
    const error = new AppError(
      `Ruta no encontrada: ${request.method} ${request.url}`,
      404,
      ERROR_CODES.RESOURCE_NOT_FOUND
    );

    return reply.status(404).send(formatErrorResponse(error, isProduction));
  });
}

/**
 * Errores predefinidos comunes
 */
const CommonErrors = {
  unauthorized: (message = 'No autorizado') =>
    new AppError(message, 401, ERROR_CODES.UNAUTHORIZED),

  forbidden: (message = 'Acceso prohibido') =>
    new AppError(message, 403, ERROR_CODES.FORBIDDEN),

  notFound: (resource = 'Recurso') =>
    new AppError(`${resource} no encontrado`, 404, ERROR_CODES.RESOURCE_NOT_FOUND),

  conflict: (message = 'El recurso ya existe') =>
    new AppError(message, 409, ERROR_CODES.RESOURCE_CONFLICT),

  validation: (message = 'Error de validación', details = null) =>
    new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR, details),

  invalidCredentials: () =>
    new AppError('Credenciales inválidas', 401, ERROR_CODES.INVALID_CREDENTIALS),

  tokenExpired: () =>
    new AppError('El token ha expirado', 401, ERROR_CODES.TOKEN_EXPIRED),

  rateLimitExceeded: () =>
    new AppError('Límite de solicitudes excedido', 429, ERROR_CODES.RATE_LIMIT_EXCEEDED),

  internal: (message = 'Error interno del servidor') =>
    new AppError(message, 500, ERROR_CODES.INTERNAL_SERVER_ERROR),

  database: (message = 'Error de base de datos') =>
    new AppError(message, 500, ERROR_CODES.DATABASE_ERROR),

  serviceUnavailable: (message = 'Servicio no disponible') =>
    new AppError(message, 503, ERROR_CODES.SERVICE_UNAVAILABLE)
};

/**
 * Wrapper para funciones async para capturar errores automáticamente
 */
function asyncHandler(fn) {
  return async (request, reply) => {
    try {
      await fn(request, reply);
    } catch (error) {
      // Los errores serán manejados por el error handler global
      throw error;
    }
  };
}

module.exports = {
  AppError,
  CommonErrors,
  ERROR_CODES,
  setupErrorHandler,
  isOperationalError,
  formatErrorResponse,
  asyncHandler
};
