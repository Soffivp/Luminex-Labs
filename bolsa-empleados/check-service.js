// Script para verificar el servicio
const https = require('https');

const options = {
  hostname: 'auth-service-639327610992.us-central1.run.app',
  port: 443,
  path: '/health',
  method: 'GET'
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

req.end();
