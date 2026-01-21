require('dotenv').config();
const fastify = require('fastify')({
  logger: process.env.NODE_ENV !== 'production'
});
const admin = require('firebase-admin');

let credential;

if (process.env.FIREBASE_PRIVATE_KEY) {
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  });
} else {
  const serviceAccount = require('../../../database/firestore/serviceAccountKey.json');
  credential = admin.credential.cert(serviceAccount);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential });
}

const db = admin.firestore();

// Habilitar CORS
fastify.register(require('@fastify/cors'), {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
});

// Health check
fastify.get('/health', async () => ({
  status: 'healthy',
  service: 'cumplimiento-legal',
  timestamp: new Date().toISOString()
}));

// Ruta raíz
fastify.get('/', async () => ({
  ok: true,
  mensaje: 'Microservicio de Cumplimiento Legal - CAIL',
  version: '1.0.0'
}));

// Registrar rutas
require('./cumplimiento-legal')(fastify, db);

// Puerto
const PORT = process.env.CUMPLIMIENTO_PORT || process.env.PORT || 3010;

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`Microservicio de Cumplimiento Legal en puerto ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  await fastify.close();
  process.exit(0);
});
process.on('SIGINT', async () => {
  await fastify.close();
  process.exit(0);
});

start();

module.exports = fastify;
