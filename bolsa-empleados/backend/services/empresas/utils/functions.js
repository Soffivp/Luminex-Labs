// utils/functions.js
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const { FieldValue } = require('firebase-admin/firestore');

function serverTimestamp() {
  return FieldValue.serverTimestamp();
}

function generarPasswordSeguro(longitud = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
  const bytes = crypto.randomBytes(longitud);
  let password = '';
  for (let i = 0; i < longitud; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

async function hashearPassword(passwordPlano) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(passwordPlano, salt);
  return hash;
}

module.exports = {
  generarPasswordSeguro,
  hashearPassword,
  serverTimestamp
};
