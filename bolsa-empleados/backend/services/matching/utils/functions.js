/**
 * Genera timestamp del servidor
 */
const serverTimestamp = () => new Date().toISOString();

/**
 * Genera ID único para matching
 * Formato: MATCH-YYYYMMDD-XXXXX
 */
const generarIdMatching = () => {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `MATCH-${year}${month}${day}-${random}`;
};

/**
 * Calcula el score de coincidencia entre empleado y vacante
 * @param {Object} empleado - Datos del empleado
 * @param {Object} vacante - Datos de la vacante
 * @returns {Object} - Score y detalles del matching
 */
const calcularScore = (empleado, vacante) => {
  let score = 0;
  const detalles = {
    competenciasCoincidentes: [],
    nivelCoincide: false,
    experienciaCoincide: false,
    ubicacionCoincide: false
  };

  // 1. Comparar competencias (peso: 50%)
  const competenciasEmpleado = [
    ...(empleado.competencias || []),
    ...(empleado.habilidades || [])
  ].map(c => c.toLowerCase().trim());

  const competenciasVacante = (vacante.competenciasRequeridas || [])
    .map(c => c.toLowerCase().trim());

  if (competenciasVacante.length > 0) {
    const coincidencias = competenciasVacante.filter(c =>
      competenciasEmpleado.some(ce =>
        ce.includes(c) || c.includes(ce)
      )
    );
    detalles.competenciasCoincidentes = coincidencias;
    const porcentajeCompetencias = (coincidencias.length / competenciasVacante.length) * 100;
    score += porcentajeCompetencias * 0.5;
  } else {
    score += 25; // Si no hay competencias requeridas, dar puntuación media
  }

  // 2. Comparar nivel laboral (peso: 25%)
  const nivelEmpleado = (empleado.nivelLaboral || '').toLowerCase();
  const nivelVacante = (vacante.nivelLaboralRequerido || '').toLowerCase();

  const nivelesOrden = ['junior', 'mid-level', 'mid level', 'senior'];
  const indexEmpleado = nivelesOrden.findIndex(n => nivelEmpleado.includes(n));
  const indexVacante = nivelesOrden.findIndex(n => nivelVacante.includes(n));

  if (indexEmpleado >= 0 && indexVacante >= 0) {
    if (indexEmpleado >= indexVacante) {
      score += 25;
      detalles.nivelCoincide = true;
    } else if (indexEmpleado === indexVacante - 1) {
      score += 15; // Un nivel por debajo
    } else {
      score += 5;
    }
  } else {
    score += 12.5; // Si no hay nivel definido, dar puntuación media
  }

  // 3. Comparar experiencia (peso: 15%)
  const experienciaEmpleado = parseInt(empleado.anosExperiencia) || 0;
  const experienciaRequerida = parseInt(vacante.aniosExperiencia) || 0;

  if (experienciaEmpleado >= experienciaRequerida) {
    score += 15;
    detalles.experienciaCoincide = true;
  } else if (experienciaEmpleado >= experienciaRequerida - 1) {
    score += 10;
  } else {
    score += 5;
  }

  // 4. Comparar ubicación (peso: 10%)
  const ubicacionEmpleado = (empleado.direccion || '').toLowerCase();
  const ubicacionVacante = (vacante.ubicacion || '').toLowerCase();

  if (ubicacionVacante && ubicacionEmpleado.includes(ubicacionVacante.split(',')[0])) {
    score += 10;
    detalles.ubicacionCoincide = true;
  } else {
    score += 5; // Ubicación diferente pero no es descalificante
  }

  return {
    scoreCoincidencia: Math.min(Math.round(score * 100) / 100, 100),
    detalles
  };
};

/**
 * Compara competencias entre empleado y vacante
 * @param {Array} competenciasEmpleado
 * @param {Array} competenciasVacante
 * @returns {Object}
 */
const compararCompetencias = (competenciasEmpleado = [], competenciasVacante = []) => {
  const empNormalized = competenciasEmpleado.map(c => c.toLowerCase().trim());
  const vacNormalized = competenciasVacante.map(c => c.toLowerCase().trim());

  const coincidentes = vacNormalized.filter(c =>
    empNormalized.some(e => e.includes(c) || c.includes(e))
  );

  const faltantes = vacNormalized.filter(c =>
    !empNormalized.some(e => e.includes(c) || c.includes(e))
  );

  return {
    coincidentes,
    faltantes,
    porcentajeCoincidencia: vacNormalized.length > 0
      ? Math.round((coincidentes.length / vacNormalized.length) * 100)
      : 100
  };
};

/**
 * Compara nivel laboral
 * @param {string} nivelEmpleado
 * @param {string} nivelRequerido
 * @returns {Object}
 */
const compararNivelLaboral = (nivelEmpleado, nivelRequerido) => {
  const niveles = { 'junior': 1, 'mid-level': 2, 'mid level': 2, 'senior': 3 };

  const nivelEmp = niveles[(nivelEmpleado || '').toLowerCase()] || 0;
  const nivelReq = niveles[(nivelRequerido || '').toLowerCase()] || 0;

  return {
    coincide: nivelEmp >= nivelReq,
    nivelEmpleado: nivelEmp,
    nivelRequerido: nivelReq,
    diferencia: nivelEmp - nivelReq
  };
};

/**
 * Ordena matchings por score descendente
 * @param {Array} matchings
 * @returns {Array}
 */
const ordenarPorScore = (matchings) => {
  return [...matchings].sort((a, b) => b.scoreCoincidencia - a.scoreCoincidencia);
};

/**
 * Genera recomendaciones basadas en el matching
 * @param {Object} matching
 * @returns {Array}
 */
const generarRecomendaciones = (matching) => {
  const recomendaciones = [];
  const score = matching.scoreCoincidencia || 0;

  if (score >= 80) {
    recomendaciones.push({
      tipo: 'excelente',
      mensaje: 'Excelente coincidencia. Se recomienda proceder con la entrevista.'
    });
  } else if (score >= 60) {
    recomendaciones.push({
      tipo: 'bueno',
      mensaje: 'Buena coincidencia. Revisar competencias faltantes antes de contactar.'
    });
  } else if (score >= 40) {
    recomendaciones.push({
      tipo: 'moderado',
      mensaje: 'Coincidencia moderada. Evaluar si el candidato puede adquirir las competencias faltantes.'
    });
  } else {
    recomendaciones.push({
      tipo: 'bajo',
      mensaje: 'Baja coincidencia. Considerar otros candidatos o revisar requisitos de la vacante.'
    });
  }

  // Recomendaciones específicas
  if (matching.detalles) {
    if (!matching.detalles.nivelCoincide) {
      recomendaciones.push({
        tipo: 'nivel',
        mensaje: 'El nivel laboral del candidato es inferior al requerido.'
      });
    }
    if (!matching.detalles.experienciaCoincide) {
      recomendaciones.push({
        tipo: 'experiencia',
        mensaje: 'La experiencia del candidato es menor a la requerida.'
      });
    }
    if (matching.detalles.competenciasCoincidentes?.length === 0) {
      recomendaciones.push({
        tipo: 'competencias',
        mensaje: 'No hay coincidencia en competencias clave.'
      });
    }
  }

  return recomendaciones;
};

module.exports = {
  serverTimestamp,
  generarIdMatching,
  calcularScore,
  compararCompetencias,
  compararNivelLaboral,
  ordenarPorScore,
  generarRecomendaciones
};
