// utils/functions.js
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const { FieldValue } = require('firebase-admin/firestore');

// CARPTURAR LA FECHAAAA
function serverTimestamp() {
  return FieldValue.serverTimestamp();
}

// GENERAR ID NUMERICOOOO 1, 2, 3, ...
async function getNextNumericId(db, collectionName) {
  const snapshot = await db.collection(collectionName).get();

  if (snapshot.empty) {
    return 1;
  }

  let maxNumber = 0;

  snapshot.forEach(doc => {
    const id = doc.id;
    const num = parseInt(id, 10);
    if (!isNaN(num) && num > maxNumber) {
      maxNumber = num;
    }
  });

  return maxNumber + 1;
}

// PARA GENERAR LOS IDS
function padNumber(num, size = 3) {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

// Obtiene el siguiente ID del tipo PREFIX_### dentro de una colección
async function getNextSequentialId(db, collectionName, prefix, digits = 3) {
  const snapshot = await db.collection(collectionName).get();

  if (snapshot.empty) {
    return `${prefix}_${padNumber(1, digits)}`;
  }

  let maxNumber = 0;

  snapshot.forEach(doc => {
    const id = doc.id;          // ej: admin_007
    const parts = id.split('_');
    const num = parseInt(parts[1] || '0', 10);
    if (!isNaN(num) && num > maxNumber) {
      maxNumber = num;
    }
  });

  const nextNumber = maxNumber + 1;
  return `${prefix}_${padNumber(nextNumber, digits)}`;
}


// PARA GENERAR LAS CONTRASEÑAS ENCRIPTADAS
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
  padNumber,
  getNextSequentialId,
  generarPasswordSeguro,
  hashearPassword,
  getNextNumericId,
  serverTimestamp
};