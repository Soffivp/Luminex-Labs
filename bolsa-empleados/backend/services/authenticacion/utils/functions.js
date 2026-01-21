const crypto = require('crypto');

/**
 * Genera timestamp del servidor
 */
function serverTimestamp() {
  return new Date().toISOString();
}

/**
 * Genera tokens de acceso y refresh
 */
async function generarTokens(fastify, payload) {
  const sessionId = `SES-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

  const accessToken = fastify.jwt.sign({
    id: payload.id,
    cedula: payload.cedula,
    tipoUsuario: payload.tipoUsuario,
    empresaRUC: payload.empresaRUC,
    sessionId
  });

  const refreshToken = crypto.randomBytes(64).toString('hex');

  return {
    accessToken,
    refreshToken,
    sessionId,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  };
}

/**
 * Genera contraseña aleatoria segura
 * @param {number} longitud - Longitud de la contraseña (default: 12)
 * @returns {string} - Contraseña generada
 */
function generarPassword(longitud = 12) {
  const mayusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const minusculas = 'abcdefghijklmnopqrstuvwxyz';
  const numeros = '0123456789';
  const especiales = '!@#$%&*';

  // Asegurar al menos uno de cada tipo
  let password = '';
  password += mayusculas.charAt(Math.floor(Math.random() * mayusculas.length));
  password += minusculas.charAt(Math.floor(Math.random() * minusculas.length));
  password += numeros.charAt(Math.floor(Math.random() * numeros.length));
  password += especiales.charAt(Math.floor(Math.random() * especiales.length));

  // Completar el resto con caracteres aleatorios
  const todosCaracteres = mayusculas + minusculas + numeros + especiales;
  for (let i = password.length; i < longitud; i++) {
    password += todosCaracteres.charAt(Math.floor(Math.random() * todosCaracteres.length));
  }

  // Mezclar los caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Valida formato de email
 */
function validarEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida requisitos de password
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula
 * - Al menos una minúscula
 * - Al menos un número
 */
function validarPassword(password) {
  if (password.length < 8) {
    return { valido: false, mensaje: 'La contraseña debe tener al menos 8 caracteres' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valido: false, mensaje: 'La contraseña debe tener al menos una letra mayúscula' };
  }

  if (!/[a-z]/.test(password)) {
    return { valido: false, mensaje: 'La contraseña debe tener al menos una letra minúscula' };
  }

  if (!/[0-9]/.test(password)) {
    return { valido: false, mensaje: 'La contraseña debe tener al menos un número' };
  }

  return { valido: true };
}

/**
 * Genera código de verificación de 6 dígitos
 */
function generarCodigoVerificacion() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sanitiza datos de usuario para respuesta
 */
function sanitizarUsuario(userData) {
  const { password, resetPasswordToken, resetPasswordExpires, ...safeData } = userData;
  return safeData;
}

/**
 * Verifica si una sesión ha expirado
 */
function sesionExpirada(fechaExpiracion) {
  return new Date(fechaExpiracion) < new Date();
}

/**
 * Genera ID único para usuarios
 */
function generarUserId() {
  return `USR-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Valida cédula ecuatoriana
 */
function validarCedula(cedula) {
  if (!cedula || cedula.length !== 10) {
    return false;
  }

  if (!/^\d{10}$/.test(cedula)) {
    return false;
  }

  const provincia = parseInt(cedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) {
    return false;
  }

  const tercerDigito = parseInt(cedula.charAt(2));
  if (tercerDigito > 6) {
    return false;
  }

  // Algoritmo de validación
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.charAt(i)) * coeficientes[i];
    if (valor > 9) valor -= 9;
    suma += valor;
  }

  const digitoVerificador = (10 - (suma % 10)) % 10;
  return digitoVerificador === parseInt(cedula.charAt(9));
}

/**
 * Valida RUC ecuatoriano
 */
function validarRUC(ruc) {
  if (!ruc || ruc.length !== 13) {
    return false;
  }

  if (!/^\d{13}$/.test(ruc)) {
    return false;
  }

  // Los últimos 3 dígitos deben ser 001
  if (!ruc.endsWith('001')) {
    return false;
  }

  // Validar los primeros 10 dígitos como cédula
  const cedula = ruc.substring(0, 10);
  return validarCedula(cedula);
}

module.exports = {
  serverTimestamp,
  generarTokens,
  generarPassword,
  validarEmail,
  validarPassword,
  generarCodigoVerificacion,
  sanitizarUsuario,
  sesionExpirada,
  generarUserId,
  validarCedula,
  validarRUC
};
