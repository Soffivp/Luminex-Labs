// utils/functions.js

/**
 * Genera timestamp del servidor
 */
function serverTimestamp() {
  return new Date().toISOString();
}

/**
 * Calcula la fecha de inicio según el período
 * @param {string} periodo - 'dia', 'semana', 'mes', 'trimestre', 'anio'
 * @returns {Date}
 */
function calcularFechaInicio(periodo) {
  const ahora = new Date();

  switch (periodo) {
    case 'dia':
      return new Date(ahora.setHours(0, 0, 0, 0));
    case 'semana':
      const inicioSemana = new Date(ahora);
      inicioSemana.setDate(ahora.getDate() - ahora.getDay());
      inicioSemana.setHours(0, 0, 0, 0);
      return inicioSemana;
    case 'mes':
      return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    case 'trimestre':
      const mesActual = ahora.getMonth();
      const inicioTrimestre = mesActual - (mesActual % 3);
      return new Date(ahora.getFullYear(), inicioTrimestre, 1);
    case 'anio':
      return new Date(ahora.getFullYear(), 0, 1);
    default:
      // Por defecto, último mes
      const unMesAtras = new Date(ahora);
      unMesAtras.setMonth(ahora.getMonth() - 1);
      return unMesAtras;
  }
}

/**
 * Formatea fecha de Firestore a Date
 * @param {any} fecha - Fecha de Firestore
 * @returns {Date}
 */
function parseFirestoreDate(fecha) {
  if (!fecha) return null;
  if (fecha._seconds) {
    return new Date(fecha._seconds * 1000);
  }
  if (fecha.toDate) {
    return fecha.toDate();
  }
  return new Date(fecha);
}

/**
 * Calcula porcentaje
 * @param {number} parcial
 * @param {number} total
 * @returns {number}
 */
function calcularPorcentaje(parcial, total) {
  if (total === 0) return 0;
  return Math.round((parcial / total) * 100 * 100) / 100;
}

/**
 * Agrupa datos por mes
 * @param {Array} datos - Array de objetos con campo fecha
 * @param {string} campoFecha - Nombre del campo de fecha
 * @returns {Object}
 */
function agruparPorMes(datos, campoFecha = 'fechaCreacion') {
  const grupos = {};

  datos.forEach(item => {
    const fecha = parseFirestoreDate(item[campoFecha]);
    if (fecha) {
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push(item);
    }
  });

  return grupos;
}

/**
 * Genera resumen de tendencias mensuales
 * @param {Object} datosPorMes - Datos agrupados por mes
 * @returns {Array}
 */
function generarTendenciasMensuales(datosPorMes) {
  const meses = Object.keys(datosPorMes).sort();

  return meses.map(mes => ({
    mes,
    cantidad: datosPorMes[mes].length
  }));
}

/**
 * Calcula estadísticas básicas de un array de números
 * @param {Array<number>} numeros
 * @returns {Object}
 */
function calcularEstadisticas(numeros) {
  if (numeros.length === 0) {
    return { promedio: 0, maximo: 0, minimo: 0, total: 0 };
  }

  const total = numeros.reduce((sum, n) => sum + n, 0);
  const promedio = total / numeros.length;
  const maximo = Math.max(...numeros);
  const minimo = Math.min(...numeros);

  return {
    promedio: Math.round(promedio * 100) / 100,
    maximo,
    minimo,
    total
  };
}

module.exports = {
  serverTimestamp,
  calcularFechaInicio,
  parseFirestoreDate,
  calcularPorcentaje,
  agruparPorMes,
  generarTendenciasMensuales,
  calcularEstadisticas
};
