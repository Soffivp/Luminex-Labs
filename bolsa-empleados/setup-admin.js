// Script para crear el administrador inicial
const https = require('https');

const data = JSON.stringify({
  cedula: "1234567890",
  nombre: "Administrador",
  apellido: "CAIL",
  email: "admin@cail.com",
  password: "AdminCAIL2024!",
  claveSetup: "CAIL-SETUP-2024"
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
