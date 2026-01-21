require('dotenv').config();
const fastify = require('fastify')({
  logger: process.env.NODE_ENV !== 'production'
});
const admin = require('firebase-admin');

let credential;

if (process.env.FIREBASE_PRIVATE_KEY) {
  // Usar variables de entorno (Docker / producción)
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  });
} else {
  // Fallback para correr localmente sin Docker
  const serviceAccount = require('../../../database/firestore/serviceAccountKey.json');
  credential = admin.credential.cert(serviceAccount);
}

admin.initializeApp({
  credential
});

const db = admin.firestore();

// Habilitar CORS
fastify.register(require('@fastify/cors'), {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
});

// Ruta de health check
fastify.get('/', async () => ({
  ok: true,
  mensaje: 'Microservicio de Evaluación de Desempeño - CAIL',
  version: '1.0.0'
}));

// Registrar rutas de evaluación de desempeño
require('./evaluacion-desempeno')(fastify, db);

// Arrancar servidor
const PORT = process.env.EVALUACION_PORT || process.env.PORT || 3008;

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`Microservicio de Evaluación de Desempeño en puerto ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
