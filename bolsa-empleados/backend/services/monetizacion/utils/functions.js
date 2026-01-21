const { FieldValue } = require('firebase-admin/firestore');

function serverTimestamp() {
  return FieldValue.serverTimestamp();
}

// Generar ID único para comisión
function generarIdComision() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `COM-${timestamp}-${random}`.toUpperCase();
}

// Calcular monto total de comisiones
function calcularMontoTotal(comision) {
  return (
    (comision.comisionColocacion || 0) +
    (comision.comisionSueldo || 0) +
    (comision.comisionContrato || 0) +
    (comision.comisionRetencion || 0)
  );
}

module.exports = {
  serverTimestamp,
  generarIdComision,
  calcularMontoTotal
};
