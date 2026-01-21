// routes/evaluacion-desempeno.js
const {
  serverTimestamp,
  evaluarLogros,
  evaluarCertificaciones,
  evaluarActitud,
  evaluarAntiguedad,
  evaluarTitulacion,
  calcularPuntajeGlobal,
  generarInformePonderacion,
  calcularEstadisticasEvaluaciones
} = require('./utils/functions');

module.exports = (fastify, db) => {
  // ============================================
  // EVALUACIONES INDIVIDUALES
  // ============================================

  /**
   * Evaluar logros de un empleado
   * GET /evaluacion-desempeno/logros/:cedula
   */
  fastify.get('/evaluacion-desempeno/logros/:cedula', async (request, reply) => {
    const { cedula } = request.params;

    try {
      const empleadoDoc = await db.collection('empleado').doc(cedula).get();

      if (!empleadoDoc.exists) {
        return reply.code(404).send({ error: 'Empleado no encontrado' });
      }

      const empleado = { id: empleadoDoc.id, ...empleadoDoc.data() };
      const puntaje = evaluarLogros(empleado);

      reply.send({
        empleadoCedula: cedula,
        empleadoNombre: `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim(),
        criterio: 'logros',
        puntaje,
        logrosEncontrados: empleado.logros?.length || 0,
        evaluadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al evaluar logros' });
    }
  });

  /**
   * Evaluar certificaciones de un empleado
   * GET /evaluacion-desempeno/certificaciones/:cedula
   */
  fastify.get('/evaluacion-desempeno/certificaciones/:cedula', async (request, reply) => {
    const { cedula } = request.params;

    try {
      const empleadoDoc = await db.collection('empleado').doc(cedula).get();

      if (!empleadoDoc.exists) {
        return reply.code(404).send({ error: 'Empleado no encontrado' });
      }

      const empleado = { id: empleadoDoc.id, ...empleadoDoc.data() };
      const puntaje = evaluarCertificaciones(empleado);

      reply.send({
        empleadoCedula: cedula,
        empleadoNombre: `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim(),
        criterio: 'certificaciones',
        puntaje,
        certificacionesEncontradas: empleado.certificaciones?.length || 0,
        evaluadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al evaluar certificaciones' });
    }
  });

  /**
   * Evaluar actitud de un empleado
   * GET /evaluacion-desempeno/actitud/:cedula
   */
  fastify.get('/evaluacion-desempeno/actitud/:cedula', async (request, reply) => {
    const { cedula } = request.params;

    try {
      const empleadoDoc = await db.collection('empleado').doc(cedula).get();

      if (!empleadoDoc.exists) {
        return reply.code(404).send({ error: 'Empleado no encontrado' });
      }

      const empleado = { id: empleadoDoc.id, ...empleadoDoc.data() };
      const puntaje = evaluarActitud(empleado);

      reply.send({
        empleadoCedula: cedula,
        empleadoNombre: `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim(),
        criterio: 'actitud',
        puntaje,
        referenciasEncontradas: empleado.referencias?.length || 0,
        evaluadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al evaluar actitud' });
    }
  });

  /**
   * Evaluar antigüedad de un empleado
   * GET /evaluacion-desempeno/antiguedad/:cedula
   */
  fastify.get('/evaluacion-desempeno/antiguedad/:cedula', async (request, reply) => {
    const { cedula } = request.params;

    try {
      const empleadoDoc = await db.collection('empleado').doc(cedula).get();

      if (!empleadoDoc.exists) {
        return reply.code(404).send({ error: 'Empleado no encontrado' });
      }

      const empleado = { id: empleadoDoc.id, ...empleadoDoc.data() };
      const puntaje = evaluarAntiguedad(empleado);

      reply.send({
        empleadoCedula: cedula,
        empleadoNombre: `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim(),
        criterio: 'antiguedad',
        puntaje,
        aniosExperiencia: empleado.aniosExperiencia || 0,
        experienciasLaborales: empleado.experienciaLaboral?.length || 0,
        evaluadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al evaluar antigüedad' });
    }
  });

  /**
   * Evaluar titulación de un empleado
   * GET /evaluacion-desempeno/titulacion/:cedula
   */
  fastify.get('/evaluacion-desempeno/titulacion/:cedula', async (request, reply) => {
    const { cedula } = request.params;

    try {
      const empleadoDoc = await db.collection('empleado').doc(cedula).get();

      if (!empleadoDoc.exists) {
        return reply.code(404).send({ error: 'Empleado no encontrado' });
      }

      const empleado = { id: empleadoDoc.id, ...empleadoDoc.data() };
      const puntaje = evaluarTitulacion(empleado);

      reply.send({
        empleadoCedula: cedula,
        empleadoNombre: `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim(),
        criterio: 'titulacion',
        puntaje,
        nivelEducativo: empleado.nivelEducativo || 'No especificado',
        formacionAcademica: empleado.formacionAcademica?.length || 0,
        evaluadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al evaluar titulación' });
    }
  });

  // ============================================
  // EVALUACIÓN GLOBAL
  // ============================================

  /**
   * Calcular puntaje global de un empleado
   * GET /evaluacion-desempeno/:cedula
   */
  fastify.get('/evaluacion-desempeno/:cedula', async (request, reply) => {
    const { cedula } = request.params;

    try {
      const empleadoDoc = await db.collection('empleado').doc(cedula).get();

      if (!empleadoDoc.exists) {
        return reply.code(404).send({ error: 'Empleado no encontrado' });
      }

      const empleado = { id: empleadoDoc.id, cedula, ...empleadoDoc.data() };
      const evaluacion = calcularPuntajeGlobal(empleado);

      reply.send({
        empleadoCedula: cedula,
        empleadoNombre: `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim(),
        ...evaluacion
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al calcular puntaje global' });
    }
  });

  /**
   * Calcular puntaje global con pesos personalizados
   * POST /evaluacion-desempeno/:cedula
   */
  fastify.post('/evaluacion-desempeno/:cedula', async (request, reply) => {
    const { cedula } = request.params;
    const { pesos } = request.body || {};

    try {
      const empleadoDoc = await db.collection('empleado').doc(cedula).get();

      if (!empleadoDoc.exists) {
        return reply.code(404).send({ error: 'Empleado no encontrado' });
      }

      // Validar que los pesos sumen 100
      if (pesos) {
        const sumaPesos = Object.values(pesos).reduce((acc, p) => acc + (p || 0), 0);
        if (sumaPesos !== 100) {
          return reply.code(400).send({
            error: 'Los pesos deben sumar 100',
            sumaActual: sumaPesos
          });
        }
      }

      const empleado = { id: empleadoDoc.id, cedula, ...empleadoDoc.data() };
      const evaluacion = calcularPuntajeGlobal(empleado, pesos);

      reply.send({
        empleadoCedula: cedula,
        empleadoNombre: `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim(),
        ...evaluacion
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al calcular puntaje global' });
    }
  });

  // ============================================
  // INFORMES DE PONDERACIÓN
  // ============================================

  /**
   * Generar informe de ponderación para un empleado
   * GET /evaluacion-desempeno/:cedula/informe
   */
  fastify.get('/evaluacion-desempeno/:cedula/informe', async (request, reply) => {
    const { cedula } = request.params;

    try {
      const empleadoDoc = await db.collection('empleado').doc(cedula).get();

      if (!empleadoDoc.exists) {
        return reply.code(404).send({ error: 'Empleado no encontrado' });
      }

      const empleado = { id: empleadoDoc.id, cedula, ...empleadoDoc.data() };
      const evaluacion = calcularPuntajeGlobal(empleado);
      const informe = generarInformePonderacion(empleado, evaluacion);

      reply.send(informe);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al generar informe de ponderación' });
    }
  });

  /**
   * Guardar evaluación de desempeño
   * POST /evaluacion-desempeno/:cedula/guardar
   */
  fastify.post('/evaluacion-desempeno/:cedula/guardar', async (request, reply) => {
    const { cedula } = request.params;
    const { pesos, observaciones } = request.body || {};

    try {
      const empleadoDoc = await db.collection('empleado').doc(cedula).get();

      if (!empleadoDoc.exists) {
        return reply.code(404).send({ error: 'Empleado no encontrado' });
      }

      const empleado = { id: empleadoDoc.id, cedula, ...empleadoDoc.data() };
      const evaluacion = calcularPuntajeGlobal(empleado, pesos);
      const informe = generarInformePonderacion(empleado, evaluacion);

      // Guardar en colección de evaluaciones
      const evaluacionData = {
        empleadoCedula: cedula,
        empleadoNombre: informe.empleadoNombre,
        ...evaluacion,
        nivel: informe.nivel,
        recomendacion: informe.recomendacion,
        fortalezas: informe.fortalezas,
        areasAMejorar: informe.areasAMejorar,
        observaciones: observaciones || '',
        creadoEn: serverTimestamp()
      };

      const docRef = await db.collection('evaluacion_desempeno').add(evaluacionData);

      reply.code(201).send({
        id: docRef.id,
        mensaje: 'Evaluación guardada exitosamente',
        ...evaluacionData
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al guardar evaluación' });
    }
  });

  // ============================================
  // CONSULTAS DE EVALUACIONES
  // ============================================

  /**
   * Listar todas las evaluaciones de desempeño
   * GET /evaluacion-desempeno
   */
  fastify.get('/evaluaciones-desempeno', async (request, reply) => {
    const { limite = 50, nivel, minPuntaje, maxPuntaje } = request.query;

    try {
      let query = db.collection('evaluacion_desempeno')
        .orderBy('creadoEn', 'desc')
        .limit(parseInt(limite));

      const snapshot = await query.get();
      let evaluaciones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filtros post-query
      if (nivel) {
        evaluaciones = evaluaciones.filter(e => e.nivel === nivel);
      }
      if (minPuntaje) {
        evaluaciones = evaluaciones.filter(e => e.puntajeGlobal >= parseInt(minPuntaje));
      }
      if (maxPuntaje) {
        evaluaciones = evaluaciones.filter(e => e.puntajeGlobal <= parseInt(maxPuntaje));
      }

      const estadisticas = calcularEstadisticasEvaluaciones(evaluaciones);

      reply.send({
        total: evaluaciones.length,
        estadisticas,
        evaluaciones,
        generadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al listar evaluaciones' });
    }
  });

  /**
   * Obtener historial de evaluaciones de un empleado
   * GET /evaluacion-desempeno/:cedula/historial
   */
  fastify.get('/evaluacion-desempeno/:cedula/historial', async (request, reply) => {
    const { cedula } = request.params;

    try {
      const snapshot = await db.collection('evaluacion_desempeno')
        .where('empleadoCedula', '==', cedula)
        .orderBy('creadoEn', 'desc')
        .get();

      const evaluaciones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calcular evolución
      const evolucion = evaluaciones.length >= 2 ? {
        primera: evaluaciones[evaluaciones.length - 1]?.puntajeGlobal || 0,
        ultima: evaluaciones[0]?.puntajeGlobal || 0,
        diferencia: (evaluaciones[0]?.puntajeGlobal || 0) - (evaluaciones[evaluaciones.length - 1]?.puntajeGlobal || 0),
        tendencia: ((evaluaciones[0]?.puntajeGlobal || 0) > (evaluaciones[evaluaciones.length - 1]?.puntajeGlobal || 0)) ? 'mejora' : 'declive'
      } : null;

      reply.send({
        empleadoCedula: cedula,
        totalEvaluaciones: evaluaciones.length,
        evolucion,
        evaluaciones,
        generadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al obtener historial' });
    }
  });

  // ============================================
  // EVALUACIONES MASIVAS
  // ============================================

  /**
   * Evaluar múltiples empleados
   * POST /evaluacion-desempeno/evaluar-lote
   */
  fastify.post('/evaluacion-desempeno/evaluar-lote', async (request, reply) => {
    const { cedulas, pesos, guardar = false } = request.body || {};

    if (!cedulas || !Array.isArray(cedulas) || cedulas.length === 0) {
      return reply.code(400).send({ error: 'Se requiere un array de cédulas' });
    }

    try {
      const resultados = [];
      const errores = [];

      for (const cedula of cedulas) {
        try {
          const empleadoDoc = await db.collection('empleado').doc(cedula).get();

          if (!empleadoDoc.exists) {
            errores.push({ cedula, error: 'Empleado no encontrado' });
            continue;
          }

          const empleado = { id: empleadoDoc.id, cedula, ...empleadoDoc.data() };
          const evaluacion = calcularPuntajeGlobal(empleado, pesos);
          const informe = generarInformePonderacion(empleado, evaluacion);

          const resultado = {
            empleadoCedula: cedula,
            empleadoNombre: informe.empleadoNombre,
            puntajeGlobal: evaluacion.puntajeGlobal,
            nivel: informe.nivel
          };

          // Guardar si se solicita
          if (guardar) {
            const evaluacionData = {
              ...resultado,
              ...evaluacion,
              fortalezas: informe.fortalezas,
              areasAMejorar: informe.areasAMejorar,
              creadoEn: serverTimestamp()
            };
            await db.collection('evaluacion_desempeno').add(evaluacionData);
          }

          resultados.push(resultado);
        } catch (err) {
          errores.push({ cedula, error: err.message });
        }
      }

      // Estadísticas del lote
      const estadisticas = {
        evaluados: resultados.length,
        errores: errores.length,
        promedioGlobal: resultados.length > 0
          ? Math.round(resultados.reduce((acc, r) => acc + r.puntajeGlobal, 0) / resultados.length)
          : 0,
        distribucion: {
          excelente: resultados.filter(r => r.puntajeGlobal >= 90).length,
          muyBueno: resultados.filter(r => r.puntajeGlobal >= 75 && r.puntajeGlobal < 90).length,
          bueno: resultados.filter(r => r.puntajeGlobal >= 60 && r.puntajeGlobal < 75).length,
          regular: resultados.filter(r => r.puntajeGlobal >= 45 && r.puntajeGlobal < 60).length,
          basico: resultados.filter(r => r.puntajeGlobal < 45).length
        }
      };

      reply.send({
        guardado: guardar,
        estadisticas,
        resultados,
        errores: errores.length > 0 ? errores : undefined,
        generadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al evaluar lote de empleados' });
    }
  });

  // ============================================
  // RANKINGS Y ESTADÍSTICAS
  // ============================================

  /**
   * Ranking de empleados por puntaje de desempeño
   * GET /evaluacion-desempeno/ranking
   */
  fastify.get('/evaluacion-desempeno/ranking', async (request, reply) => {
    const { limite = 20, criterio = 'puntajeGlobal', orden = 'desc' } = request.query;

    try {
      const empleadosSnapshot = await db.collection('empleado').get();

      const ranking = [];
      for (const doc of empleadosSnapshot.docs) {
        const empleado = { id: doc.id, cedula: doc.id, ...doc.data() };
        const evaluacion = calcularPuntajeGlobal(empleado);

        ranking.push({
          cedula: doc.id,
          nombre: `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim(),
          nivelLaboral: empleado.nivelLaboral,
          puntajeGlobal: evaluacion.puntajeGlobal,
          puntajeLogros: evaluacion.puntajeLogros,
          puntajeCertificaciones: evaluacion.puntajeCertificaciones,
          puntajeActitud: evaluacion.puntajeActitud,
          puntajeAntiguedad: evaluacion.puntajeAntiguedad,
          puntajeTitulacion: evaluacion.puntajeTitulacion
        });
      }

      // Ordenar según criterio
      const criterioValido = ['puntajeGlobal', 'puntajeLogros', 'puntajeCertificaciones',
                            'puntajeActitud', 'puntajeAntiguedad', 'puntajeTitulacion'].includes(criterio)
                            ? criterio : 'puntajeGlobal';

      ranking.sort((a, b) => {
        return orden === 'asc'
          ? a[criterioValido] - b[criterioValido]
          : b[criterioValido] - a[criterioValido];
      });

      const topRanking = ranking.slice(0, parseInt(limite));

      // Estadísticas generales
      const estadisticas = calcularEstadisticasEvaluaciones(
        ranking.map(r => ({
          puntajeGlobal: r.puntajeGlobal,
          puntajeLogros: r.puntajeLogros,
          puntajeCertificaciones: r.puntajeCertificaciones,
          puntajeActitud: r.puntajeActitud,
          puntajeAntiguedad: r.puntajeAntiguedad,
          puntajeTitulacion: r.puntajeTitulacion
        }))
      );

      reply.send({
        criterioOrdenamiento: criterioValido,
        orden,
        totalEmpleados: ranking.length,
        estadisticas,
        ranking: topRanking,
        generadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al generar ranking' });
    }
  });

  /**
   * Eliminar una evaluación
   * DELETE /evaluacion-desempeno/:id
   */
  fastify.delete('/evaluacion-desempeno/registro/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const docRef = db.collection('evaluacion_desempeno').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return reply.code(404).send({ error: 'Evaluación no encontrada' });
      }

      await docRef.delete();

      reply.send({
        mensaje: 'Evaluación eliminada exitosamente',
        id,
        eliminadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al eliminar evaluación' });
    }
  });
};
