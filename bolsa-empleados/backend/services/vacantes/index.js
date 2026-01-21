require('dotenv').config();
const fastify = require('fastify')({
  logger: process.env.NODE_ENV !== 'production'
});
const admin = require('firebase-admin');

// Inicializar Firebase (esto ya está bien)
if (!admin.apps.length) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // 🟡 LOCAL con archivo JSON
    const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin usando serviceAccount local');
  } else if (process.env.FIREBASE_PRIVATE_KEY) {
    // 🟡 LOCAL con variables de entorno
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('Firebase Admin usando variables de entorno');
  } else {
    // 🟢 CLOUD RUN (FORMA CORRECTA)
    admin.initializeApp();
    console.log('Firebase Admin usando credenciales automáticas de Cloud Run');
  }
}
if (!admin.apps.length) {
  admin.initializeApp({ credential });
  console.log('Firebase Admin inicializado correctamente');
}

const db = admin.firestore();

// Ahora sí: registra plugins y rutas DESPUÉS de crear fastify
fastify.register(require('@fastify/cors'), {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});

// Health check
fastify.get('/health', async () => ({
  status: 'healthy',
  service: 'vacantes',
  timestamp: new Date().toISOString()
}));

// Registrar rutas de vacantes
require('./vacante')(fastify, db);

// Puerto
const PORT = process.env.VACANTES_PORT || process.env.PORT || 3003;

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`Microservicio Vacantes corriendo en puerto ${PORT}`);
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