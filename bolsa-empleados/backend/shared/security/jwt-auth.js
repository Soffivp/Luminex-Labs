/**
 * Middleware compartido de autenticación JWT
 * Usado por todos los microservicios para validar tokens
 */

/**
 * Configura el plugin JWT en Fastify
 * @param {FastifyInstance} fastify - Instancia de Fastify
 */
async function setupJWT(fastify) {
  // Validar que JWT_SECRET esté configurado
  if (!process.env.JWT_SECRET) {
    const errorMessage = 'JWT_SECRET no está definido en las variables de entorno';
    fastify.log.error(errorMessage);
    throw new Error(errorMessage);
  }

  await fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET
  });
}

/**
 * Middleware para verificar JWT en todas las rutas protegidas
 * Valida el token y anexa la información del usuario a request.user
 */
async function verifyJWT(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({
      error: 'Token inválido o expirado',
      message: 'Por favor, inicie sesión nuevamente'
    });
  }
}

/**
 * Middleware para verificar que el usuario sea administrador
 */
async function verifyAdmin(request, reply) {
  try {
    await request.jwtVerify();

    if (request.user.tipoUsuario !== 'administrador') {
      return reply.status(403).send({
        error: 'Acceso denegado',
        message: 'Se requiere rol de administrador para esta operación'
      });
    }
  } catch (err) {
    return reply.status(401).send({
      error: 'Token inválido o expirado',
      message: 'Por favor, inicie sesión nuevamente'
    });
  }
}

/**
 * Middleware para verificar que el usuario sea empresa
 */
async function verifyEmpresa(request, reply) {
  try {
    await request.jwtVerify();

    if (request.user.tipoUsuario !== 'empresa' && request.user.tipoUsuario !== 'administrador') {
      return reply.status(403).send({
        error: 'Acceso denegado',
        message: 'Se requiere rol de empresa para esta operación'
      });
    }
  } catch (err) {
    return reply.status(401).send({
      error: 'Token inválido o expirado',
      message: 'Por favor, inicie sesión nuevamente'
    });
  }
}

/**
 * Middleware para verificar que el usuario sea empleado
 */
async function verifyEmpleado(request, reply) {
  try {
    await request.jwtVerify();

    if (request.user.tipoUsuario !== 'empleado' && request.user.tipoUsuario !== 'administrador') {
      return reply.status(403).send({
        error: 'Acceso denegado',
        message: 'Se requiere rol de empleado para esta operación'
      });
    }
  } catch (err) {
    return reply.status(401).send({
      error: 'Token inválido o expirado',
      message: 'Por favor, inicie sesión nuevamente'
    });
  }
}

/**
 * Middleware para verificar que el usuario pueda acceder a un recurso específico
 * Por ejemplo, un empleado solo puede ver sus propios datos
 * @param {string} resourceField - Campo del request que contiene el ID del recurso (ej: 'params.id', 'params.cedula')
 */
function verifyResourceOwnership(resourceField = 'params.id') {
  return async (request, reply) => {
    try {
      await request.jwtVerify();

      // Admin puede acceder a todo
      if (request.user.tipoUsuario === 'administrador') {
        return;
      }

      // Obtener el ID del recurso del request
      const fieldParts = resourceField.split('.');
      let resourceId = request;
      for (const part of fieldParts) {
        resourceId = resourceId[part];
      }

      // Para empresas, verificar por RUC
      if (request.user.tipoUsuario === 'empresa') {
        if (resourceId !== request.user.empresaRUC && resourceId !== request.user.cedula) {
          return reply.status(403).send({
            error: 'Acceso denegado',
            message: 'No tiene permiso para acceder a este recurso'
          });
        }
      }

      // Para empleados, verificar por cédula
      if (request.user.tipoUsuario === 'empleado') {
        if (resourceId !== request.user.cedula && resourceId !== request.user.id) {
          return reply.status(403).send({
            error: 'Acceso denegado',
            message: 'No tiene permiso para acceder a este recurso'
          });
        }
      }
    } catch (err) {
      return reply.status(401).send({
        error: 'Token inválido o expirado',
        message: 'Por favor, inicie sesión nuevamente'
      });
    }
  };
}

/**
 * Rutas públicas que no requieren autenticación
 * Agregar aquí las rutas que deben ser públicas
 */
const PUBLIC_ROUTES = [
  '/health',
  '/healthcheck',
  '/'
];

/**
 * Verifica si una ruta es pública
 * @param {string} path - Path de la ruta
 * @returns {boolean}
 */
function isPublicRoute(path) {
  return PUBLIC_ROUTES.some(route => path === route || path.startsWith(route));
}

module.exports = {
  setupJWT,
  verifyJWT,
  verifyAdmin,
  verifyEmpresa,
  verifyEmpleado,
  verifyResourceOwnership,
  isPublicRoute,
  PUBLIC_ROUTES
};
