const fastify = require('fastify')({ logger: true});
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
  // Fallback para correr localmente sin Docker (opcional)
  const serviceAccount = require('./database/firestore/serviceAccountKey.json');
  credential = admin.credential.cert(serviceAccount);
}

admin.initializeApp({
  credential
});

const db = admin.firestore();

// Habilitar CORS
fastify.register(require('@fastify/cors'), {
  origin: '*', // En desarrollo. En producción pon tu dominio o IP del móvil/emulador
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});

fastify.get('/', async () => ({ ok: true, mensaje: 'Backend CAIL con Firebase funcionando' }));

// Registrar módulos de rutas
require('./services/empresas/empresa')(fastify, db);
require('./services/empleados/empleado')(fastify, db);
require('./services/vacantes/vacante')(fastify, db);
require('./services/administrador/administrador')(fastify, db);
require('./services/matching/matching')(fastify, db);
require('./services/vacantes/propuesta')(fastify, db);
require('./services/colocacionlaboral/procesoContratacion')(fastify, db);
require('./services/monetizacion/monetizacioncontroller')(fastify, db);
require('./services/evaluaciondesempeno/evaluacionDesempeno')(fastify, db);
require('./services/empleados/informePonderacion')(fastify, db);
require('./services/administrador/gestionAnalisis')(fastify, db);
require('./services/empleados/nivelLaboral')(fastify, db);
require('./services/conflicto/conflicto')(fastify, db);
require('./services/user/routes/notificacion')(fastify, db);

// Arrancar servidor
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
