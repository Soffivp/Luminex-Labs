// routes/matching.js
const {
  serverTimestamp,
  generarIdMatching,
  calcularScore,
  compararCompetencias,
  compararNivelLaboral,
  ordenarPorScore,
  generarRecomendaciones
} = require('./utils/functions');

module.exports = (fastify, db) => {
  // ============================================
  // CRUD BÁSICO DE MATCHINGS
  // ============================================

  // Listar todos los matchings (con filtros)
  fastify.get('/matchings', async (request, reply) => {
    const { estadoMatch, empresaRUC, empleadoCedula, vacanteId, minScore } = request.query;

    let query = db.collection('matching');

    if (estadoMatch) {
      query = query.where('estadoMatch', '==', estadoMatch);
    }
    if (empresaRUC) {
      query = query.where('empresaRUC', '==', empresaRUC);
    }
    if (empleadoCedula) {
      query = query.where('empleadoCedula', '==', empleadoCedula);
    }
    if (vacanteId) {
      query = query.where('vacanteId', '==', vacanteId);
    }

    const snapshot = await query.get();
    let matchings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filtrar por score mínimo (post-query ya que Firestore no soporta >= en múltiples campos)
    if (minScore) {
      matchings = matchings.filter(m => m.scoreCoincidencia >= parseFloat(minScore));
    }

    // Ordenar por score descendente
    matchings = ordenarPorScore(matchings);

    reply.send(matchings);
  });

  // Obtener matching por ID
  fastify.get('/matchings/:id', async (request, reply) => {
    const { id } = request.params;
    const docRef = db.collection('matching').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Matching no encontrado' });
    }

    const matching = { id: doc.id, ...doc.data() };

    // Agregar recomendaciones
    matching.recomendaciones = generarRecomendaciones(matching);

    reply.send(matching);
  });

  // Crear matching manualmente
  fastify.post('/matchings', async (request, reply) => {
    const data = request.body;

    // Validaciones
    if (!data.empleadoCedula) {
      return reply.code(400).send({ error: 'El campo empleadoCedula es obligatorio' });
    }
    if (!data.vacanteId) {
      return reply.code(400).send({ error: 'El campo vacanteId es obligatorio' });
    }

    // Verificar que el empleado existe
    const empleadoDoc = await db.collection('empleado').doc(String(data.empleadoCedula)).get();
    if (!empleadoDoc.exists) {
      return reply.code(404).send({ error: 'Empleado no encontrado' });
    }

    // Verificar que la vacante existe
    const vacanteDoc = await db.collection('vacante').doc(String(data.vacanteId)).get();
    if (!vacanteDoc.exists) {
      return reply.code(404).send({ error: 'Vacante no encontrada' });
    }

    const empleado = empleadoDoc.data();
    const vacante = vacanteDoc.data();

    // Calcular score
    const { scoreCoincidencia, detalles } = calcularScore(empleado, vacante);

    // Generar ID único
    const matchingId = data.id || generarIdMatching();

    // Preparar documento
    const matchingData = {
      empleadoCedula: data.empleadoCedula,
      empleadoNombre: empleado.nombres || '',
      vacanteId: data.vacanteId,
      vacanteTitulo: vacante.tituloCargo || '',
      empresaRUC: vacante.empresaRUC || '',
      scoreCoincidencia,
      competenciasCoincidentes: detalles.competenciasCoincidentes || [],
      detalles,
      estadoMatch: data.estadoMatch || 'pendiente',
      fechaMatching: serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
      propuestaId: null,
      observaciones: data.observaciones || ''
    };

    const docRef = db.collection('matching').doc(matchingId);
    await docRef.set(matchingData);

    reply.code(201).send({
      id: matchingId,
      scoreCoincidencia,
      mensaje: 'Matching creado exitosamente',
      recomendaciones: generarRecomendaciones(matchingData)
    });
  });

  // Actualizar matching
  fastify.patch('/matchings/:id', async (request, reply) => {
    const { id } = request.params;
    const data = request.body;

    const docRef = db.collection('matching').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Matching no encontrado' });
    }

    // Campos permitidos
    const camposPermitidos = ['estadoMatch', 'observaciones', 'propuestaId'];
    const actualizacion = {};

    for (const campo of camposPermitidos) {
      if (data[campo] !== undefined) {
        actualizacion[campo] = data[campo];
      }
    }

    actualizacion.fechaActualizacion = serverTimestamp();

    await docRef.update(actualizacion);

    reply.code(200).send({
      id,
      mensaje: 'Matching actualizado exitosamente',
      actualizado: true
    });
  });

  // Eliminar matching
  fastify.delete('/matchings/:id', async (request, reply) => {
    const { id } = request.params;

    const docRef = db.collection('matching').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Matching no encontrado' });
    }

    // Solo permitir eliminar matchings pendientes
    const matchingData = doc.data();
    if (matchingData.estadoMatch !== 'pendiente') {
      return reply.code(400).send({
        error: 'Solo se pueden eliminar matchings en estado pendiente'
      });
    }

    await docRef.delete();

    reply.code(200).send({
      id,
      mensaje: 'Matching eliminado exitosamente',
      eliminado: true
    });
  });

  // ============================================
  // CAMBIO DE ESTADO
  // ============================================

  // Cambiar estado del matching
  fastify.patch('/matchings/:id/estado', async (request, reply) => {
    const { id } = request.params;
    const { estadoMatch, observaciones } = request.body;

    const estadosValidos = ['pendiente', 'aprobado', 'rechazado', 'contratado', 'precargada'];
    if (!estadosValidos.includes(estadoMatch)) {
      return reply.code(400).send({
        error: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`
      });
    }

    const docRef = db.collection('matching').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Matching no encontrado' });
    }

    const updateData = {
      estadoMatch,
      fechaActualizacion: serverTimestamp()
    };

    if (observaciones) {
      updateData.observaciones = observaciones;
    }

    // Si se aprueba, registrar fecha
    if (estadoMatch === 'aprobado') {
      updateData.fechaAprobacion = serverTimestamp();
    }
    // Si se contrata, registrar fecha
    if (estadoMatch === 'contratado') {
      updateData.fechaContratacion = serverTimestamp();
    }

    await docRef.update(updateData);

    reply.code(200).send({
      id,
      mensaje: `Matching ${estadoMatch}`,
      estadoMatch
    });
  });

  // ============================================
  // CÁLCULO DE MATCHING
  // ============================================

  // Calcular matching para un empleado y vacante específicos
  fastify.post('/matchings/calcular', async (request, reply) => {
    const { empleadoCedula, vacanteId } = request.body;

    if (!empleadoCedula || !vacanteId) {
      return reply.code(400).send({
        error: 'Se requieren empleadoCedula y vacanteId'
      });
    }

    // Obtener empleado
    const empleadoDoc = await db.collection('empleado').doc(String(empleadoCedula)).get();
    if (!empleadoDoc.exists) {
      return reply.code(404).send({ error: 'Empleado no encontrado' });
    }

    // Obtener vacante
    const vacanteDoc = await db.collection('vacante').doc(String(vacanteId)).get();
    if (!vacanteDoc.exists) {
      return reply.code(404).send({ error: 'Vacante no encontrada' });
    }

    const empleado = empleadoDoc.data();
    const vacante = vacanteDoc.data();

    // Calcular score
    const resultado = calcularScore(empleado, vacante);

    // Comparaciones detalladas
    const competencias = compararCompetencias(
      [...(empleado.competencias || []), ...(empleado.habilidades || [])],
      vacante.competenciasRequeridas || []
    );

    const nivel = compararNivelLaboral(
      empleado.nivelLaboral,
      vacante.nivelLaboralRequerido
    );

    reply.send({
      empleadoCedula,
      empleadoNombre: empleado.nombres,
      vacanteId,
      vacanteTitulo: vacante.tituloCargo,
      scoreCoincidencia: resultado.scoreCoincidencia,
      detalles: resultado.detalles,
      analisis: {
        competencias,
        nivel
      },
      recomendaciones: generarRecomendaciones(resultado)
    });
  });

  // Generar matchings para una vacante (buscar empleados compatibles)
  fastify.post('/matchings/vacante/:vacanteId/generar', async (request, reply) => {
    const { vacanteId } = request.params;
    const { minScore = 30, limite = 20, guardar = false } = request.body;

    // Obtener vacante
    const vacanteDoc = await db.collection('vacante').doc(String(vacanteId)).get();
    if (!vacanteDoc.exists) {
      return reply.code(404).send({ error: 'Vacante no encontrada' });
    }

    const vacante = vacanteDoc.data();

    // Obtener todos los empleados publicados
    const empleadosSnapshot = await db.collection('empleado')
      .where('estadoPublicacion', '==', 'Publicado')
      .get();

    const matchings = [];

    for (const empDoc of empleadosSnapshot.docs) {
      const empleado = empDoc.data();
      const resultado = calcularScore(empleado, vacante);

      if (resultado.scoreCoincidencia >= minScore) {
        const matchingData = {
          empleadoCedula: empDoc.id,
          empleadoNombre: empleado.nombres || '',
          vacanteId,
          vacanteTitulo: vacante.tituloCargo,
          empresaRUC: vacante.empresaRUC,
          scoreCoincidencia: resultado.scoreCoincidencia,
          competenciasCoincidentes: resultado.detalles.competenciasCoincidentes,
          detalles: resultado.detalles
        };

        matchings.push(matchingData);
      }
    }

    // Ordenar por score
    const matchingsOrdenados = ordenarPorScore(matchings).slice(0, limite);

    // Guardar en base de datos si se solicita
    if (guardar && matchingsOrdenados.length > 0) {
      const batch = db.batch();

      for (const matching of matchingsOrdenados) {
        // Verificar si ya existe un matching para este par
        const existente = await db.collection('matching')
          .where('empleadoCedula', '==', matching.empleadoCedula)
          .where('vacanteId', '==', vacanteId)
          .get();

        if (existente.empty) {
          const matchingId = generarIdMatching();
          const docRef = db.collection('matching').doc(matchingId);
          batch.set(docRef, {
            ...matching,
            estadoMatch: 'precargada',
            fechaMatching: serverTimestamp(),
            fechaActualizacion: serverTimestamp()
          });
        }
      }

      await batch.commit();
    }

    reply.send({
      vacanteId,
      vacanteTitulo: vacante.tituloCargo,
      totalEncontrados: matchings.length,
      matchings: matchingsOrdenados,
      guardados: guardar
    });
  });

  // Generar matchings para un empleado (buscar vacantes compatibles)
  fastify.post('/matchings/empleado/:cedula/generar', async (request, reply) => {
    const { cedula } = request.params;
    const { minScore = 30, limite = 20, guardar = false } = request.body;

    // Obtener empleado
    const empleadoDoc = await db.collection('empleado').doc(String(cedula)).get();
    if (!empleadoDoc.exists) {
      return reply.code(404).send({ error: 'Empleado no encontrado' });
    }

    const empleado = empleadoDoc.data();

    // Obtener todas las vacantes activas
    const vacantesSnapshot = await db.collection('vacante')
      .where('estadoVacante', '==', 'Activa')
      .get();

    const matchings = [];

    for (const vacDoc of vacantesSnapshot.docs) {
      const vacante = vacDoc.data();
      const resultado = calcularScore(empleado, vacante);

      if (resultado.scoreCoincidencia >= minScore) {
        const matchingData = {
          empleadoCedula: cedula,
          empleadoNombre: empleado.nombres || '',
          vacanteId: vacDoc.id,
          vacanteTitulo: vacante.tituloCargo,
          empresaRUC: vacante.empresaRUC,
          empresaNombre: vacante.empresaNombre || '',
          scoreCoincidencia: resultado.scoreCoincidencia,
          competenciasCoincidentes: resultado.detalles.competenciasCoincidentes,
          detalles: resultado.detalles
        };

        matchings.push(matchingData);
      }
    }

    // Ordenar por score
    const matchingsOrdenados = ordenarPorScore(matchings).slice(0, limite);

    // Guardar en base de datos si se solicita
    if (guardar && matchingsOrdenados.length > 0) {
      const batch = db.batch();

      for (const matching of matchingsOrdenados) {
        // Verificar si ya existe
        const existente = await db.collection('matching')
          .where('empleadoCedula', '==', cedula)
          .where('vacanteId', '==', matching.vacanteId)
          .get();

        if (existente.empty) {
          const matchingId = generarIdMatching();
          const docRef = db.collection('matching').doc(matchingId);
          batch.set(docRef, {
            ...matching,
            estadoMatch: 'precargada',
            fechaMatching: serverTimestamp(),
            fechaActualizacion: serverTimestamp()
          });
        }
      }

      await batch.commit();
    }

    reply.send({
      empleadoCedula: cedula,
      empleadoNombre: empleado.nombres,
      totalEncontrados: matchings.length,
      matchings: matchingsOrdenados,
      guardados: guardar
    });
  });

  // ============================================
  // CONSULTAS ESPECÍFICAS
  // ============================================

  // Matchings por empleado
  fastify.get('/matchings/empleado/:cedula', async (request, reply) => {
    const { cedula } = request.params;
    const { estadoMatch } = request.query;

    let query = db.collection('matching')
      .where('empleadoCedula', '==', cedula);

    if (estadoMatch) {
      query = query.where('estadoMatch', '==', estadoMatch);
    }

    const snapshot = await query.get();
    let matchings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    matchings = ordenarPorScore(matchings);

    reply.send(matchings);
  });

  // Matchings por vacante
  fastify.get('/matchings/vacante/:vacanteId', async (request, reply) => {
    const { vacanteId } = request.params;
    const { estadoMatch, minScore } = request.query;

    let query = db.collection('matching')
      .where('vacanteId', '==', vacanteId);

    if (estadoMatch) {
      query = query.where('estadoMatch', '==', estadoMatch);
    }

    const snapshot = await query.get();
    let matchings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (minScore) {
      matchings = matchings.filter(m => m.scoreCoincidencia >= parseFloat(minScore));
    }

    matchings = ordenarPorScore(matchings);

    reply.send(matchings);
  });

  // Matchings por empresa
  fastify.get('/matchings/empresa/:ruc', async (request, reply) => {
    const { ruc } = request.params;
    const { estadoMatch } = request.query;

    let query = db.collection('matching')
      .where('empresaRUC', '==', ruc);

    if (estadoMatch) {
      query = query.where('estadoMatch', '==', estadoMatch);
    }

    const snapshot = await query.get();
    let matchings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    matchings = ordenarPorScore(matchings);

    reply.send(matchings);
  });

  // Matchings pendientes
  fastify.get('/matchings/pendientes', async (request, reply) => {
    const { empresaRUC, limite = 50 } = request.query;

    let query = db.collection('matching')
      .where('estadoMatch', '==', 'pendiente');

    if (empresaRUC) {
      query = query.where('empresaRUC', '==', empresaRUC);
    }

    const snapshot = await query.get();
    let matchings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    matchings = ordenarPorScore(matchings).slice(0, parseInt(limite));

    reply.send(matchings);
  });

  // Top matchings (mejores scores)
  fastify.get('/matchings/top', async (request, reply) => {
    const { limite = 10, minScore = 70 } = request.query;

    const snapshot = await db.collection('matching').get();
    let matchings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    matchings = matchings
      .filter(m => m.scoreCoincidencia >= parseFloat(minScore))
      .sort((a, b) => b.scoreCoincidencia - a.scoreCoincidencia)
      .slice(0, parseInt(limite));

    reply.send(matchings);
  });

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  // Resumen de matchings por empresa
  fastify.get('/matchings/resumen/empresa/:ruc', async (request, reply) => {
    const { ruc } = request.params;

    const snapshot = await db.collection('matching')
      .where('empresaRUC', '==', ruc)
      .get();

    const matchings = snapshot.docs.map(doc => doc.data());

    const resumen = {
      empresaRUC: ruc,
      totalMatchings: matchings.length,
      porEstado: {
        pendiente: matchings.filter(m => m.estadoMatch === 'pendiente').length,
        aprobado: matchings.filter(m => m.estadoMatch === 'aprobado').length,
        rechazado: matchings.filter(m => m.estadoMatch === 'rechazado').length,
        contratado: matchings.filter(m => m.estadoMatch === 'contratado').length,
        precargada: matchings.filter(m => m.estadoMatch === 'precargada').length
      },
      promedioScore: matchings.length > 0
        ? Math.round(matchings.reduce((sum, m) => sum + (m.scoreCoincidencia || 0), 0) / matchings.length)
        : 0,
      mejorScore: matchings.length > 0
        ? Math.max(...matchings.map(m => m.scoreCoincidencia || 0))
        : 0
    };

    reply.send(resumen);
  });

  // Estadísticas generales
  fastify.get('/matchings/estadisticas', async (request, reply) => {
    const snapshot = await db.collection('matching').get();
    const matchings = snapshot.docs.map(doc => doc.data());

    const scores = matchings.map(m => m.scoreCoincidencia || 0);

    const estadisticas = {
      totalMatchings: matchings.length,
      porEstado: {
        pendiente: matchings.filter(m => m.estadoMatch === 'pendiente').length,
        aprobado: matchings.filter(m => m.estadoMatch === 'aprobado').length,
        rechazado: matchings.filter(m => m.estadoMatch === 'rechazado').length,
        contratado: matchings.filter(m => m.estadoMatch === 'contratado').length,
        precargada: matchings.filter(m => m.estadoMatch === 'precargada').length
      },
      scores: {
        promedio: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        maximo: scores.length > 0 ? Math.max(...scores) : 0,
        minimo: scores.length > 0 ? Math.min(...scores) : 0
      },
      rangos: {
        excelente: matchings.filter(m => (m.scoreCoincidencia || 0) >= 80).length,
        bueno: matchings.filter(m => (m.scoreCoincidencia || 0) >= 60 && (m.scoreCoincidencia || 0) < 80).length,
        moderado: matchings.filter(m => (m.scoreCoincidencia || 0) >= 40 && (m.scoreCoincidencia || 0) < 60).length,
        bajo: matchings.filter(m => (m.scoreCoincidencia || 0) < 40).length
      }
    };

    reply.send(estadisticas);
  });

  // ============================================
  // VINCULAR CON PROPUESTA
  // ============================================

  // Vincular matching con propuesta
  fastify.post('/matchings/:id/propuesta', async (request, reply) => {
    const { id } = request.params;
    const { propuestaId } = request.body;

    if (!propuestaId) {
      return reply.code(400).send({ error: 'El campo propuestaId es obligatorio' });
    }

    const docRef = db.collection('matching').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Matching no encontrado' });
    }

    await docRef.update({
      propuestaId,
      estadoMatch: 'aprobado',
      fechaActualizacion: serverTimestamp()
    });

    reply.code(200).send({
      id,
      mensaje: 'Propuesta vinculada al matching',
      propuestaId
    });
  });
};
