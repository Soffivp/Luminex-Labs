require('dotenv').config();
console.log('Starting proceso-laboral service...');

const fastify = require('fastify')({
  logger: true
});
const admin = require('firebase-admin');

console.log('Initializing Firebase...');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);

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
console.log('Firebase initialized successfully');

const db = admin.firestore();

// Habilitar CORS
fastify.register(require('@fastify/cors'), {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
});

// Configurar límite de tamaño para body (para archivos grandes)
fastify.register(require('@fastify/formbody'));

// Health check
fastify.get('/health', async () => ({
  status: 'healthy',
  service: 'proceso-laboral',
  timestamp: new Date().toISOString()
}));

// Ruta raíz
fastify.get('/', async () => ({
  ok: true,
  mensaje: 'Microservicio de Proceso Laboral - CAIL',
  version: '1.0.0',
  descripcion: 'Gestión de documentación para contratación laboral'
}));

// Registrar rutas de proceso laboral
require('./proceso-laboral')(fastify, db);

// Arrancar servidor
const PORT = process.env.PROCESO_LABORAL_PORT || process.env.PORT || 3009;

const start = async () => {
  try {
    console.log(`Starting server on port ${PORT}...`);
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server listening on port ${PORT}`);
  } catch (err) {
    console.error('Server start error:', err);
    process.exit(1);
  }
};

start();
