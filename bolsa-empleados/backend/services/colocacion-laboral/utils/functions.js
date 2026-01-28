// utils/functions.js - Funciones de Colocación Laboral

/**
 * Genera timestamp del servidor
 */
const serverTimestamp = () => new Date().toISOString();

/**
 * Genera ID único para colocación
 */
const generarIdColocacion = () => {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `COL-${year}${month}-${random}`;
};

/**
 * Calcula la duración de un contrato
 * @param {string} fechaInicio - Fecha de inicio ISO
 * @param {string} fechaFin - Fecha de fin ISO (opcional, usa fecha actual si no se proporciona)
 * @returns {Object} Objeto con duración en diferentes unidades
 */
const calcularDuracionContrato = (fechaInicio, fechaFin = null) => {
  const inicio = new Date(fechaInicio);
  const fin = fechaFin ? new Date(fechaFin) : new Date();

  const diffMs = fin - inicio;
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMeses = Math.floor(diffDias / 30);
  const diffAnios = Math.floor(diffDias / 365);

  return {
    dias: diffDias,
    meses: diffMeses,
    anios: diffAnios,
    descripcion: formatearDuracion(diffDias)
  };
};

/**
 * Formatea duración en texto legible
 * @param {number} dias - Número de días
 * @returns {string} Descripción formateada
 */
const formatearDuracion = (dias) => {
  if (dias < 0) return 'Fecha inválida';
  if (dias === 0) return 'Menos de un día';
  if (dias === 1) return '1 día';
  if (dias < 30) return `${dias} días`;
  if (dias < 60) return '1 mes';
  if (dias < 365) return `${Math.floor(dias / 30)} meses`;
  if (dias < 730) return '1 año';
  return `${Math.floor(dias / 365)} años y ${Math.floor((dias % 365) / 30)} meses`;
};

/**
 * Valida datos requeridos para crear colocación
 * @param {Object} datos - Datos de la colocación
 * @returns {Object} Resultado de validación
 */
const validarDatosColocacion = (datos) => {
  const errores = [];

  if (!datos.empleadoCedula) {
    errores.push('La cédula del empleado es requerida');
  }

  if (!datos.empresaRUC) {
    errores.push('El RUC de la empresa es requerido');
  }

  if (!datos.fechaInicio) {
    errores.push('La fecha de inicio es requerida');
  } else {
    const fechaInicio = new Date(datos.fechaInicio);
    if (isNaN(fechaInicio.getTime())) {
      errores.push('La fecha de inicio no es válida');
    }
  }

  if (datos.fechaFin) {
    const fechaFin = new Date(datos.fechaFin);
    if (isNaN(fechaFin.getTime())) {
      errores.push('La fecha de fin no es válida');
    }
    if (datos.fechaInicio && new Date(datos.fechaFin) < new Date(datos.fechaInicio)) {
      errores.push('La fecha de fin no puede ser anterior a la fecha de inicio');
    }
  }

  const tiposContrato = ['Indefinido', 'Plazo fijo', 'Por obra', 'Temporal', 'Pasantía', 'Aprendizaje'];
  if (datos.tipoContrato && !tiposContrato.includes(datos.tipoContrato)) {
    errores.push(`Tipo de contrato inválido. Debe ser: ${tiposContrato.join(', ')}`);
  }

  const modalidades = ['Presencial', 'Remoto', 'Híbrido'];
  if (datos.modalidadTrabajo && !modalidades.includes(datos.modalidadTrabajo)) {
    errores.push(`Modalidad de trabajo inválida. Debe ser: ${modalidades.join(', ')}`);
  }

  return {
    valido: errores.length === 0,
    mensaje: errores.length > 0 ? errores.join('. ') : 'Datos válidos',
    errores
  };
};

/**
 * Calcula estadísticas de colocaciones
 * @param {Array} colocaciones - Array de colocaciones
 * @param {string} periodo - Período de filtro (opcional)
 * @returns {Object} Estadísticas
 */
const calcularEstadisticasColocacion = (colocaciones, periodo = null) => {
  if (!colocaciones || colocaciones.length === 0) {
    return {
      total: 0,
      activas: 0,
      finalizadas: 0,
      porTipoContrato: {},
      porModalidad: {},
      duracionPromedio: null
    };
  }

  let datos = colocaciones;

  // Filtrar por período si se especifica
  if (periodo) {
    const fechaInicio = calcularFechaInicio(periodo);
    datos = colocaciones.filter(col => {
      const fecha = new Date(col.fechaCreacion);
      return fecha >= fechaInicio;
    });
  }

  const activas = datos.filter(c => c.estadoColocacion === 'activa');
  const finalizadas = datos.filter(c => c.estadoColocacion === 'finalizada');

  // Por tipo de contrato
  const porTipoContrato = {};
  datos.forEach(col => {
    const tipo = col.tipoContrato || 'No especificado';
    porTipoContrato[tipo] = (porTipoContrato[tipo] || 0) + 1;
  });

  // Por modalidad
  const porModalidad = {};
  datos.forEach(col => {
    const modalidad = col.modalidadTrabajo || 'No especificado';
    porModalidad[modalidad] = (porModalidad[modalidad] || 0) + 1;
  });

  // Duración promedio de colocaciones finalizadas
  let duracionPromedio = null;
  if (finalizadas.length > 0) {
    const duraciones = finalizadas
      .filter(c => c.fechaInicio && c.fechaFinalizacion)
      .map(c => calcularDuracionContrato(c.fechaInicio, c.fechaFinalizacion).dias);

    if (duraciones.length > 0) {
      const sumaDias = duraciones.reduce((sum, d) => sum + d, 0);
      duracionPromedio = {
        dias: Math.round(sumaDias / duraciones.length),
        descripcion: formatearDuracion(Math.round(sumaDias / duraciones.length))
      };
    }
  }

  // Motivos de finalización
  const motivosFinalizacion = {};
  finalizadas.forEach(col => {
    const motivo = col.motivoFinalizacion || 'No especificado';
    motivosFinalizacion[motivo] = (motivosFinalizacion[motivo] || 0) + 1;
  });

  return {
    total: datos.length,
    activas: activas.length,
    finalizadas: finalizadas.length,
    tasaRetencion: datos.length > 0
      ? Math.round((activas.length / datos.length) * 100)
      : 0,
    porTipoContrato,
    porModalidad,
    duracionPromedio,
    motivosFinalizacion
  };
};

/**
 * Calcula fecha de inicio según período
 * @param {string} periodo - 'dia', 'semana', 'mes', 'trimestre', 'anio'
 * @returns {Date}
 */
const calcularFechaInicio = (periodo) => {
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
      const unMesAtras = new Date(ahora);
      unMesAtras.setMonth(ahora.getMonth() - 1);
      return unMesAtras;
  }
};

/**
 * Genera resumen de colocación para reportes
 * @param {Object} colocacion - Datos de la colocación
 * @returns {Object} Resumen
 */
const generarResumenColocacion = (colocacion) => {
  const duracion = colocacion.estadoColocacion === 'activa'
    ? calcularDuracionContrato(colocacion.fechaInicio)
    : calcularDuracionContrato(colocacion.fechaInicio, colocacion.fechaFinalizacion);

  const evaluaciones = colocacion.evaluacionesDesempeno || [];
  const promedioEvaluaciones = evaluaciones.length > 0
    ? Math.round(evaluaciones.reduce((sum, e) => sum + (e.puntuacion || 0), 0) / evaluaciones.length)
    : null;

  return {
    id: colocacion.id,
    empleado: {
      cedula: colocacion.empleadoCedula,
      nombre: colocacion.empleadoNombre
    },
    empresa: {
      ruc: colocacion.empresaRUC,
      nombre: colocacion.empresaNombre
    },
    cargo: colocacion.vacanteTitulo,
    tipoContrato: colocacion.tipoContrato,
    modalidad: colocacion.modalidadTrabajo,
    estado: colocacion.estadoColocacion,
    duracion,
    evaluaciones: {
      cantidad: evaluaciones.length,
      promedio: promedioEvaluaciones
    },
    incidencias: (colocacion.incidencias || []).length,
    renovaciones: (colocacion.renovaciones || []).length
  };
};

module.exports = {
  serverTimestamp,
  generarIdColocacion,
  calcularDuracionContrato,
  formatearDuracion,
  validarDatosColocacion,
  calcularEstadisticasColocacion,
  calcularFechaInicio,
  generarResumenColocacion
};
