// utils/functions.js - Funciones de evaluación de desempeño

/**
 * Timestamp del servidor
 */
const serverTimestamp = () => new Date().toISOString();

/**
 * Evalúa logros profesionales del empleado
 * @param {Object} empleado - Datos del empleado
 * @returns {number} Puntaje de 0-100
 */
const evaluarLogros = (empleado) => {
  if (!empleado || !empleado.logros) return 0;

  const logros = empleado.logros;
  let puntaje = 0;

  // Evaluar cantidad de logros
  const cantidadLogros = Array.isArray(logros) ? logros.length : 0;
  if (cantidadLogros >= 5) puntaje += 40;
  else if (cantidadLogros >= 3) puntaje += 30;
  else if (cantidadLogros >= 1) puntaje += 20;

  // Evaluar relevancia/impacto de logros (si tienen descripción detallada)
  if (Array.isArray(logros)) {
    const logrosDetallados = logros.filter(l =>
      l.descripcion && l.descripcion.length > 50
    ).length;
    puntaje += Math.min(logrosDetallados * 10, 30);

    // Evaluar reconocimientos formales
    const reconocimientos = logros.filter(l =>
      l.tipo === 'reconocimiento' || l.certificado
    ).length;
    puntaje += Math.min(reconocimientos * 10, 30);
  }

  return Math.min(puntaje, 100);
};

/**
 * Evalúa certificaciones del empleado
 * Considera vigencia y cantidad de certificados
 * @param {Object} empleado - Datos del empleado
 * @returns {number} Puntaje de 0-100
 */
const evaluarCertificaciones = (empleado) => {
  if (!empleado || !empleado.certificaciones) return 0;

  const certificaciones = empleado.certificaciones;
  if (!Array.isArray(certificaciones) || certificaciones.length === 0) return 0;

  let puntaje = 0;
  const ahora = new Date();

  // Evaluar cantidad
  const cantidad = certificaciones.length;
  if (cantidad >= 5) puntaje += 30;
  else if (cantidad >= 3) puntaje += 20;
  else if (cantidad >= 1) puntaje += 10;

  // Evaluar vigencia
  let vigentes = 0;
  let vencidas = 0;

  certificaciones.forEach(cert => {
    if (cert.fechaVencimiento) {
      const fechaVenc = new Date(cert.fechaVencimiento);
      if (fechaVenc > ahora) {
        vigentes++;
      } else {
        vencidas++;
      }
    } else {
      // Certificaciones sin vencimiento se consideran vigentes
      vigentes++;
    }
  });

  // Porcentaje de vigencia
  const porcentajeVigente = cantidad > 0 ? (vigentes / cantidad) * 100 : 0;
  if (porcentajeVigente >= 80) puntaje += 40;
  else if (porcentajeVigente >= 60) puntaje += 30;
  else if (porcentajeVigente >= 40) puntaje += 20;
  else puntaje += 10;

  // Bonificación por certificaciones reconocidas (ej: ISO, AWS, Google, etc)
  const certificacionesReconocidas = certificaciones.filter(cert => {
    const nombre = (cert.nombre || '').toLowerCase();
    return nombre.includes('iso') ||
           nombre.includes('aws') ||
           nombre.includes('google') ||
           nombre.includes('microsoft') ||
           nombre.includes('cisco') ||
           nombre.includes('pmp') ||
           nombre.includes('scrum');
  }).length;

  puntaje += Math.min(certificacionesReconocidas * 10, 30);

  return Math.min(puntaje, 100);
};

/**
 * Evalúa actitud basada en referencias del empleador
 * Escala de 1-5 donde 5 es excelente
 * @param {Object} empleado - Datos del empleado
 * @returns {number} Puntaje de 0-100
 */
const evaluarActitud = (empleado) => {
  if (!empleado) return 0;

  // Si tiene evaluaciones de actitud directas
  if (empleado.evaluacionActitud) {
    // Escala 1-5 convertida a 0-100
    const escala = parseFloat(empleado.evaluacionActitud) || 0;
    return Math.min(Math.round((escala / 5) * 100), 100);
  }

  // Evaluar basado en referencias del empleador
  if (!empleado.referencias || !Array.isArray(empleado.referencias)) return 50; // Puntaje neutral

  const referencias = empleado.referencias;
  if (referencias.length === 0) return 50;

  let sumaCalificaciones = 0;
  let conteo = 0;

  referencias.forEach(ref => {
    // Calificación de actitud en referencias (escala 1-5)
    if (ref.calificacionActitud) {
      sumaCalificaciones += parseFloat(ref.calificacionActitud) || 0;
      conteo++;
    }
    // Calificación general como alternativa
    else if (ref.calificacion) {
      sumaCalificaciones += parseFloat(ref.calificacion) || 0;
      conteo++;
    }
  });

  if (conteo === 0) return 50;

  const promedioEscala = sumaCalificaciones / conteo;
  return Math.min(Math.round((promedioEscala / 5) * 100), 100);
};

/**
 * Evalúa antigüedad laboral del empleado
 * @param {Object} empleado - Datos del empleado
 * @returns {number} Puntaje de 0-100
 */
const evaluarAntiguedad = (empleado) => {
  if (!empleado) return 0;

  let aniosExperiencia = 0;

  // Si tiene campo directo de años de experiencia
  if (empleado.aniosExperiencia) {
    aniosExperiencia = parseFloat(empleado.aniosExperiencia) || 0;
  }
  // Calcular desde experiencia laboral
  else if (empleado.experienciaLaboral && Array.isArray(empleado.experienciaLaboral)) {
    const ahora = new Date();

    empleado.experienciaLaboral.forEach(exp => {
      if (exp.fechaInicio) {
        const inicio = new Date(exp.fechaInicio);
        const fin = exp.fechaFin ? new Date(exp.fechaFin) : ahora;
        const diferencia = (fin - inicio) / (1000 * 60 * 60 * 24 * 365);
        aniosExperiencia += diferencia;
      }
    });
  }

  // Escala de puntaje según años
  // 0-1 años: 10-30
  // 1-3 años: 30-50
  // 3-5 años: 50-70
  // 5-10 años: 70-90
  // 10+ años: 90-100

  if (aniosExperiencia >= 10) return 100;
  if (aniosExperiencia >= 5) return 70 + Math.round((aniosExperiencia - 5) * 4);
  if (aniosExperiencia >= 3) return 50 + Math.round((aniosExperiencia - 3) * 10);
  if (aniosExperiencia >= 1) return 30 + Math.round((aniosExperiencia - 1) * 10);
  return Math.round(10 + (aniosExperiencia * 20));
};

/**
 * Evalúa nivel de titulación/estudios del empleado
 * @param {Object} empleado - Datos del empleado
 * @returns {number} Puntaje de 0-100
 */
const evaluarTitulacion = (empleado) => {
  if (!empleado) return 0;

  // Mapeo de niveles de estudio a puntaje
  const nivelesPuntaje = {
    'doctorado': 100,
    'phd': 100,
    'maestria': 85,
    'master': 85,
    'postgrado': 80,
    'especialidad': 75,
    'especializacion': 75,
    'licenciatura': 70,
    'ingenieria': 70,
    'universitario': 65,
    'tecnologo': 55,
    'tecnologia': 55,
    'tecnico': 45,
    'tecnica': 45,
    'bachillerato': 30,
    'bachiller': 30,
    'secundaria': 25,
    'primaria': 15,
    'basica': 10
  };

  let puntajeMaximo = 0;

  // Si tiene nivel educativo directo
  if (empleado.nivelEducativo) {
    const nivel = empleado.nivelEducativo.toLowerCase();
    for (const [key, valor] of Object.entries(nivelesPuntaje)) {
      if (nivel.includes(key)) {
        puntajeMaximo = Math.max(puntajeMaximo, valor);
        break;
      }
    }
  }

  // Evaluar desde formación académica
  if (empleado.formacionAcademica && Array.isArray(empleado.formacionAcademica)) {
    empleado.formacionAcademica.forEach(formacion => {
      const nivel = (formacion.nivelEstudio || formacion.titulo || '').toLowerCase();
      for (const [key, valor] of Object.entries(nivelesPuntaje)) {
        if (nivel.includes(key)) {
          puntajeMaximo = Math.max(puntajeMaximo, valor);
          break;
        }
      }
    });
  }

  // Bonificación por títulos en curso (máximo 10 puntos extra)
  if (empleado.formacionAcademica && Array.isArray(empleado.formacionAcademica)) {
    const enCurso = empleado.formacionAcademica.filter(f =>
      f.estado === 'en_curso' || f.enCurso === true
    ).length;
    puntajeMaximo += Math.min(enCurso * 5, 10);
  }

  return Math.min(puntajeMaximo || 20, 100); // Mínimo 20 si no se detecta nivel
};

/**
 * Calcula el puntaje global de evaluación de desempeño
 * Promedio ponderado de todas las evaluaciones
 * @param {Object} empleado - Datos del empleado
 * @param {Object} pesos - Pesos para cada criterio (opcional)
 * @returns {Object} Objeto con puntajes individuales y global
 */
const calcularPuntajeGlobal = (empleado, pesos = null) => {
  // Pesos por defecto (suma = 100)
  const pesosDefault = {
    logros: 20,
    certificaciones: 20,
    actitud: 25,
    antiguedad: 15,
    titulacion: 20
  };

  const pesosFinales = pesos || pesosDefault;

  // Calcular puntajes individuales
  const puntajeLogros = evaluarLogros(empleado);
  const puntajeCertificaciones = evaluarCertificaciones(empleado);
  const puntajeActitud = evaluarActitud(empleado);
  const puntajeAntiguedad = evaluarAntiguedad(empleado);
  const puntajeTitulacion = evaluarTitulacion(empleado);

  // Calcular promedio ponderado
  const puntajeGlobal = Math.round(
    (puntajeLogros * pesosFinales.logros +
     puntajeCertificaciones * pesosFinales.certificaciones +
     puntajeActitud * pesosFinales.actitud +
     puntajeAntiguedad * pesosFinales.antiguedad +
     puntajeTitulacion * pesosFinales.titulacion) / 100
  );

  return {
    puntajeLogros,
    puntajeCertificaciones,
    puntajeActitud,
    puntajeAntiguedad,
    puntajeTitulacion,
    puntajeGlobal,
    pesosUtilizados: pesosFinales,
    fechaEvaluacion: serverTimestamp()
  };
};

/**
 * Genera informe de ponderación para un empleado
 * @param {Object} empleado - Datos del empleado
 * @param {Object} evaluacion - Resultado de calcularPuntajeGlobal
 * @returns {Object} Informe de ponderación
 */
const generarInformePonderacion = (empleado, evaluacion) => {
  // Determinar nivel basado en puntaje global
  let nivel = 'Básico';
  let recomendacion = '';

  if (evaluacion.puntajeGlobal >= 90) {
    nivel = 'Excelente';
    recomendacion = 'Candidato altamente recomendado para posiciones de liderazgo y responsabilidad.';
  } else if (evaluacion.puntajeGlobal >= 75) {
    nivel = 'Muy Bueno';
    recomendacion = 'Candidato sólido con buen potencial de crecimiento.';
  } else if (evaluacion.puntajeGlobal >= 60) {
    nivel = 'Bueno';
    recomendacion = 'Candidato apto con áreas de mejora identificadas.';
  } else if (evaluacion.puntajeGlobal >= 45) {
    nivel = 'Regular';
    recomendacion = 'Candidato que requiere desarrollo en varias áreas.';
  } else {
    nivel = 'Básico';
    recomendacion = 'Candidato en etapa inicial de desarrollo profesional.';
  }

  // Identificar fortalezas y debilidades
  const criterios = [
    { nombre: 'Logros', puntaje: evaluacion.puntajeLogros },
    { nombre: 'Certificaciones', puntaje: evaluacion.puntajeCertificaciones },
    { nombre: 'Actitud', puntaje: evaluacion.puntajeActitud },
    { nombre: 'Antigüedad', puntaje: evaluacion.puntajeAntiguedad },
    { nombre: 'Titulación', puntaje: evaluacion.puntajeTitulacion }
  ];

  criterios.sort((a, b) => b.puntaje - a.puntaje);

  const fortalezas = criterios.slice(0, 2).filter(c => c.puntaje >= 60);
  const debilidades = criterios.slice(-2).filter(c => c.puntaje < 60);

  return {
    empleadoCedula: empleado.cedula || empleado.id,
    empleadoNombre: `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim(),
    evaluacion,
    nivel,
    recomendacion,
    fortalezas: fortalezas.map(f => f.nombre),
    areasAMejorar: debilidades.map(d => d.nombre),
    fechaInforme: serverTimestamp()
  };
};

/**
 * Calcula estadísticas de evaluaciones múltiples
 * @param {Array} evaluaciones - Array de evaluaciones
 * @returns {Object} Estadísticas
 */
const calcularEstadisticasEvaluaciones = (evaluaciones) => {
  if (!evaluaciones || evaluaciones.length === 0) {
    return {
      total: 0,
      promedioGlobal: 0,
      distribucion: { excelente: 0, muyBueno: 0, bueno: 0, regular: 0, basico: 0 }
    };
  }

  const puntajes = evaluaciones.map(e => e.puntajeGlobal || 0);
  const suma = puntajes.reduce((acc, p) => acc + p, 0);

  return {
    total: evaluaciones.length,
    promedioGlobal: Math.round(suma / evaluaciones.length),
    minimo: Math.min(...puntajes),
    maximo: Math.max(...puntajes),
    distribucion: {
      excelente: evaluaciones.filter(e => e.puntajeGlobal >= 90).length,
      muyBueno: evaluaciones.filter(e => e.puntajeGlobal >= 75 && e.puntajeGlobal < 90).length,
      bueno: evaluaciones.filter(e => e.puntajeGlobal >= 60 && e.puntajeGlobal < 75).length,
      regular: evaluaciones.filter(e => e.puntajeGlobal >= 45 && e.puntajeGlobal < 60).length,
      basico: evaluaciones.filter(e => e.puntajeGlobal < 45).length
    },
    promedios: {
      logros: Math.round(evaluaciones.reduce((acc, e) => acc + (e.puntajeLogros || 0), 0) / evaluaciones.length),
      certificaciones: Math.round(evaluaciones.reduce((acc, e) => acc + (e.puntajeCertificaciones || 0), 0) / evaluaciones.length),
      actitud: Math.round(evaluaciones.reduce((acc, e) => acc + (e.puntajeActitud || 0), 0) / evaluaciones.length),
      antiguedad: Math.round(evaluaciones.reduce((acc, e) => acc + (e.puntajeAntiguedad || 0), 0) / evaluaciones.length),
      titulacion: Math.round(evaluaciones.reduce((acc, e) => acc + (e.puntajeTitulacion || 0), 0) / evaluaciones.length)
    }
  };
};

module.exports = {
  serverTimestamp,
  evaluarLogros,
  evaluarCertificaciones,
  evaluarActitud,
  evaluarAntiguedad,
  evaluarTitulacion,
  calcularPuntajeGlobal,
  generarInformePonderacion,
  calcularEstadisticasEvaluaciones
};
