// Script para crear el administrador inicial
require('dotenv').config();
const https = require('https');

// Validar variables de entorno requeridas
if (!process.env.ADMIN_SETUP_KEY) {
  console.error('ERROR: ADMIN_SETUP_KEY no está definido en las variables de entorno');
  console.error('Por favor, configura ADMIN_SETUP_KEY en tu archivo .env');
  process.exit(1);
}

const data = JSON.stringify({
  cedula: process.env.ADMIN_CEDULA || "1234567890",
  nombre: process.env.ADMIN_NOMBRE || "Administrador",
  apellido: process.env.ADMIN_APELLIDO || "CAIL",
  email: process.env.ADMIN_EMAIL || "admin@cail.com",
  password: process.env.ADMIN_PASSWORD || "AdminCAIL2024!",
  claveSetup: process.env.ADMIN_SETUP_KEY
});

const options = {
  hostname: 'auth-service-639327610992.us-central1.run.app',
  port: 443,
  path: '/auth/setup-admin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', responseData);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(data);
req.end();
