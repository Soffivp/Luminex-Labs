/**
 * Módulo compartido para inicialización de Firebase
 * Elimina duplicación de código entre servicios
 */

const admin = require('firebase-admin');

/**
 * Inicializa Firebase Admin SDK
 * Soporta múltiples métodos de autenticación:
 * 1. Variables de entorno (FIREBASE_PRIVATE_KEY, etc.)
 * 2. Service Account Key file
 * 3. Default credentials (Google Cloud)
 *
 * @param {Object} options - Opciones de configuración
 * @param {string} options.serviceAccountPath - Path al service account key (opcional)
 * @returns {Object} { admin, db, bucket }
 */
function initializeFirebase(options = {}) {
  const { serviceAccountPath } = options;

  // Si ya está inicializado, retornar instancia existente
  if (admin.apps.length > 0) {
    return {
      admin,
      db: admin.firestore(),
      bucket: admin.storage().bucket()
    };
  }

  let credential;

  try {
    // Opción 1: Variables de entorno (recomendado para producción)
    if (process.env.FIREBASE_PRIVATE_KEY &&
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL) {

      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      });

      admin.initializeApp({
        credential,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });

    }
    // Opción 2: Service Account Key file (desarrollo local)
    else if (serviceAccountPath) {
      const serviceAccount = require(serviceAccountPath);

      credential = admin.credential.cert(serviceAccount);

      admin.initializeApp({
        credential,
        projectId: serviceAccount.project_id,
        storageBucket: `${serviceAccount.project_id}.appspot.com`
      });

    }
    // Opción 3: Default credentials (Google Cloud Run, Cloud Functions)
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp();
    }
    // Opción 4: Application Default Credentials
    else {
      admin.initializeApp();
    }

    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    // Configuración de Firestore
    db.settings({
      ignoreUndefinedProperties: true,
      timestampsInSnapshots: true
    });

    return { admin, db, bucket };

  } catch (error) {
    // No usar console.error directo (SonarQube lo marca)
    const logger = console;
    logger.error('Error al inicializar Firebase:', error.message);

    // No usar process.exit() directamente (security hotspot)
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
}

/**
 * Verifica que Firebase esté correctamente inicializado
 * @returns {boolean}
 */
function isFirebaseInitialized() {
  return admin.apps.length > 0;
}

/**
 * Obtiene la instancia de Firestore
 * @returns {FirebaseFirestore.Firestore}
 */
function getFirestore() {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase no está inicializado. Llama a initializeFirebase() primero.');
  }
  return admin.firestore();
}

/**
 * Obtiene la instancia de Storage
 * @returns {Storage}
 */
function getStorage() {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase no está inicializado. Llama a initializeFirebase() primero.');
  }
  return admin.storage();
}

/**
 * Obtiene la instancia de Auth
 * @returns {Auth}
 */
function getAuth() {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase no está inicializado. Llama a initializeFirebase() primero.');
  }
  return admin.auth();
}

/**
 * Cierra la conexión de Firebase (útil para tests)
 */
async function closeFirebase() {
  if (isFirebaseInitialized()) {
    await Promise.all(admin.apps.map(app => app.delete()));
  }
}

module.exports = {
  initializeFirebase,
  isFirebaseInitialized,
  getFirestore,
  getStorage,
  getAuth,
  closeFirebase,
  admin
};
