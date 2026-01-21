require('dotenv').config();
const fastify = require('fastify')({
  logger: process.env.NODE_ENV !== 'production'
});
const admin = require('firebase-admin');

// Inicializar Firebase Admin
let credential;
if (process.env.FIREBASE_PRIVATE_KEY) {
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  });
} else {
  const serviceAccount = require('./database/firestore');
  credential = admin.credential.cert(serviceAccount);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential });
}

const db = admin.firestore();

// Registrar plugins
fastify.register(require('@fastify/cors'), {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
});

fastify.register(require('@fastify/cookie'), {
  secret: process.env.COOKIE_SECRET || 'cail-auth-secret-key-2024',
  hook: 'onRequest'
});

fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET || 'cail-jwt-secret-key-2024',
  sign: {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  }
});

// Health check
fastify.get('/health', async () => ({
  status: 'ok',
  service: 'auth-service',
  timestamp: new Date().toISOString()
}));

// Ruta raíz
fastify.get('/', async () => ({
  ok: true,
  mensaje: 'Microservicio de Autenticación CAIL funcionando',
  version: '2.0.0',
  endpoints: {
    publicos: [
      'POST /auth/login - Login con cédula y contraseña',
      'POST /auth/refresh - Renovar tokens',
      'POST /auth/logout - Cerrar sesión',
      'GET /auth/verificar-empresa/:cedula - Verificar si cédula pertenece a empresa',
      'POST /auth/setup-admin - Crear admin inicial (solo una vez)'
    ],
    autenticados: [
      'GET /auth/me - Obtener usuario actual',
      'PATCH /auth/cambiar-password - Cambiar contraseña'
    ],
    admin: [
      'POST /auth/usuarios - Crear usuario',
      'GET /auth/usuarios - Listar usuarios',
      'GET /auth/usuarios/:id - Obtener usuario',
      'PATCH /auth/usuarios/:id - Actualizar usuario',
      'POST /auth/usuarios/:id/resetear-password - Resetear contraseña',
      'PATCH /auth/usuarios/:id/estado - Activar/Desactivar usuario'
    ]
  }
}));

// Registrar rutas de autenticación
require('./auth')(fastify, db);

const PORT = process.env.AUTH_PORT || process.env.PORT || 3006;

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`Microservicio Auth corriendo en puerto ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

module.exports = fastify;
