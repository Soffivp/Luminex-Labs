const { FieldValue } = require('firebase-admin/firestore');

function serverTimestamp() {
  return FieldValue.serverTimestamp();
}

// Generar ID único para vacante
function generarIdVacante() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `VAC-${timestamp}-${random}`.toUpperCase();
}

module.exports = {
  serverTimestamp,
  generarIdVacante
};
