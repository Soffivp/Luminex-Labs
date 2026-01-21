// routes/colocacion-laboral.js
const {
  serverTimestamp,
  generarIdColocacion,
  calcularDuracionContrato,
  validarDatosColocacion,
  calcularEstadisticasColocacion
} = require('./utils/functions');

module.exports = (fastify, db) => {
  // ============================================
  // GESTIÓN DE COLOCACIONES LABORALES
  // ============================================

  // Crear nueva colocación laboral
  fastify.post('/colocaciones', async (request, reply) => {
    try {
      const datos = request.body;

      // Validar datos requeridos
      const validacion = validarDatosColocacion(datos);
      if (!validacion.valido) {
        return reply.code(400).send({ error: validacion.mensaje });
      }

      // Verificar que el matching existe y está aprobado
      if (datos.matchingId) {
        const matchingDoc = await db.collection('matching').doc(datos.matchingId).get();
        if (!matchingDoc.exists) {
          return reply.code(404).send({ error: 'Matching no encontrado' });
        }
        const matching = matchingDoc.data();
        if (!['aprobado', 'contratado'].includes(matching.estadoMatch)) {
          return reply.code(400).send({ error: 'El matching debe estar aprobado para crear una colocación' });
        }
      }

      const colocacionId = generarIdColocacion();
      const colocacion = {
        id: colocacionId,
        matchingId: datos.matchingId || null,
        empleadoCedula: datos.empleadoCedula,
        empleadoNombre: datos.empleadoNombre || '',
        empresaRUC: datos.empresaRUC,
        empresaNombre: datos.empresaNombre || '',
        vacanteId: datos.vacanteId || null,
        vacanteTitulo: datos.vacanteTitulo || '',

        // Datos del contrato
        tipoContrato: datos.tipoContrato || 'Indefinido',
        fechaInicio: datos.fechaInicio,
        fechaFin: datos.fechaFin || null,
        salarioAcordado: datos.salarioAcordado || null,
        modalidadTrabajo: datos.modalidadTrabajo || 'Presencial',
        jornadaLaboral: datos.jornadaLaboral || 'Tiempo completo',

        // Estado de la colocación
        estadoColocacion: 'activa',
        motivoFinalizacion: null,

        // Seguimiento
        evaluacionesDesempeno: [],
        incidencias: [],
        renovaciones: [],

        // Auditoría
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        creadoPor: datos.creadoPor || 'sistema'
      };

      await db.collection('colocacion').doc(colocacionId).set(colocacion);

      // Actualizar estado del matching si existe
      if (datos.matchingId) {
        await db.collection('matching').doc(datos.matchingId).update({
          estadoMatch: 'contratado',
          fechaContratacion: serverTimestamp()
        });
      }

      // Actualizar disponibilidad del empleado
      await db.collection('empleado').doc(datos.empleadoCedula).update({
        estadoDisponibilidad: 'Colocado',
        colocacionActual: colocacionId
      }).catch(() => {});

      reply.code(201).send({
        mensaje: 'Colocación laboral creada exitosamente',
        colocacion
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al crear colocación laboral' });
    }
  });

  // Obtener todas las colocaciones con filtros
  fastify.get('/colocaciones', async (request, reply) => {
    const {
      estado,
      empresaRUC,
      empleadoCedula,
      tipoContrato,
      limite = 50
    } = request.query;

    try {
      let query = db.collection('colocacion');

      if (estado) {
        query = query.where('estadoColocacion', '==', estado);
      }
      if (empresaRUC) {
        query = query.where('empresaRUC', '==', empresaRUC);
      }
      if (empleadoCedula) {
        query = query.where('empleadoCedula', '==', empleadoCedula);
      }
      if (tipoContrato) {
        query = query.where('tipoContrato', '==', tipoContrato);
      }

      const snapshot = await query.limit(parseInt(limite)).get();
      const colocaciones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      reply.send({
        total: colocaciones.length,
        colocaciones
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al obtener colocaciones' });
    }
  });

  // Obtener colocación por ID
  fastify.get('/colocaciones/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const doc = await db.collection('colocacion').doc(id).get();

      if (!doc.exists) {
        return reply.code(404).send({ error: 'Colocación no encontrada' });
      }

      const colocacion = { id: doc.id, ...doc.data() };

      // Calcular duración si está activa
      if (colocacion.estadoColocacion === 'activa') {
        colocacion.duracionActual = calcularDuracionContrato(colocacion.fechaInicio);
      }

      reply.send(colocacion);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al obtener colocación' });
    }
  });

  // Actualizar colocación
  fastify.put('/colocaciones/:id', async (request, reply) => {
    const { id } = request.params;
    const datos = request.body;

    try {
      const docRef = db.collection('colocacion').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return reply.code(404).send({ error: 'Colocación no encontrada' });
      }

      const actualizacion = {
        ...datos,
        fechaActualizacion: serverTimestamp()
      };

      // No permitir cambiar campos de auditoría
      delete actualizacion.id;
      delete actualizacion.fechaCreacion;
      delete actualizacion.creadoPor;

      await docRef.update(actualizacion);

      const docActualizado = await docRef.get();

      reply.send({
        mensaje: 'Colocación actualizada exitosamente',
        colocacion: { id: docActualizado.id, ...docActualizado.data() }
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al actualizar colocación' });
    }
  });

  // Finalizar colocación
  fastify.post('/colocaciones/:id/finalizar', async (request, reply) => {
    const { id } = request.params;
    const { motivo, fechaFinalizacion, observaciones } = request.body;

    try {
      const docRef = db.collection('colocacion').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return reply.code(404).send({ error: 'Colocación no encontrada' });
      }

      const colocacion = doc.data();

      if (colocacion.estadoColocacion !== 'activa') {
        return reply.code(400).send({ error: 'La colocación ya está finalizada' });
      }

      const duracion = calcularDuracionContrato(
        colocacion.fechaInicio,
        fechaFinalizacion || new Date().toISOString()
      );

      await docRef.update({
        estadoColocacion: 'finalizada',
        motivoFinalizacion: motivo || 'No especificado',
        fechaFinalizacion: fechaFinalizacion || serverTimestamp(),
        observacionesFinalizacion: observaciones || '',
        duracionTotal: duracion,
        fechaActualizacion: serverTimestamp()
      });

      // Actualizar disponibilidad del empleado
      await db.collection('empleado').doc(colocacion.empleadoCedula).update({
        estadoDisponibilidad: 'Disponible',
        colocacionActual: null
      }).catch(() => {});

      reply.send({
        mensaje: 'Colocación finalizada exitosamente',
        duracionTotal: duracion
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al finalizar colocación' });
    }
  });

  // Renovar contrato
  fastify.post('/colocaciones/:id/renovar', async (request, reply) => {
    const { id } = request.params;
    const { nuevaFechaFin, nuevoSalario, observaciones } = request.body;

    try {
      const docRef = db.collection('colocacion').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return reply.code(404).send({ error: 'Colocación no encontrada' });
      }

      const colocacion = doc.data();

      if (colocacion.estadoColocacion !== 'activa') {
        return reply.code(400).send({ error: 'Solo se pueden renovar colocaciones activas' });
      }

      const renovacion = {
        fechaRenovacion: serverTimestamp(),
        fechaFinAnterior: colocacion.fechaFin,
        nuevaFechaFin: nuevaFechaFin,
        salarioAnterior: colocacion.salarioAcordado,
        nuevoSalario: nuevoSalario || colocacion.salarioAcordado,
        observaciones: observaciones || ''
      };

      const renovaciones = colocacion.renovaciones || [];
      renovaciones.push(renovacion);

      await docRef.update({
        fechaFin: nuevaFechaFin,
        salarioAcordado: nuevoSalario || colocacion.salarioAcordado,
        renovaciones: renovaciones,
        fechaActualizacion: serverTimestamp()
      });

      reply.send({
        mensaje: 'Contrato renovado exitosamente',
        renovacion
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al renovar contrato' });
    }
  });

  // Agregar evaluación de desempeño a la colocación
  fastify.post('/colocaciones/:id/evaluaciones', async (request, reply) => {
    const { id } = request.params;
    const evaluacion = request.body;

    try {
      const docRef = db.collection('colocacion').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return reply.code(404).send({ error: 'Colocación no encontrada' });
      }

      const colocacion = doc.data();
      const evaluaciones = colocacion.evaluacionesDesempeno || [];

      const nuevaEvaluacion = {
        id: `eval-${Date.now()}`,
        fecha: serverTimestamp(),
        periodo: evaluacion.periodo || '',
        puntuacion: evaluacion.puntuacion || 0,
        fortalezas: evaluacion.fortalezas || [],
        areasAMejorar: evaluacion.areasAMejorar || [],
        comentarios: evaluacion.comentarios || '',
        evaluador: evaluacion.evaluador || ''
      };

      evaluaciones.push(nuevaEvaluacion);

      await docRef.update({
        evaluacionesDesempeno: evaluaciones,
        fechaActualizacion: serverTimestamp()
      });

      reply.send({
        mensaje: 'Evaluación agregada exitosamente',
        evaluacion: nuevaEvaluacion
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al agregar evaluación' });
    }
  });

  // Registrar incidencia
  fastify.post('/colocaciones/:id/incidencias', async (request, reply) => {
    const { id } = request.params;
    const incidencia = request.body;

    try {
      const docRef = db.collection('colocacion').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return reply.code(404).send({ error: 'Colocación no encontrada' });
      }

      const colocacion = doc.data();
      const incidencias = colocacion.incidencias || [];

      const nuevaIncidencia = {
        id: `inc-${Date.now()}`,
        fecha: serverTimestamp(),
        tipo: incidencia.tipo || 'general',
        descripcion: incidencia.descripcion || '',
        gravedad: incidencia.gravedad || 'baja',
        estado: 'abierta',
        reportadoPor: incidencia.reportadoPor || ''
      };

      incidencias.push(nuevaIncidencia);

      await docRef.update({
        incidencias: incidencias,
        fechaActualizacion: serverTimestamp()
      });

      reply.send({
        mensaje: 'Incidencia registrada exitosamente',
        incidencia: nuevaIncidencia
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al registrar incidencia' });
    }
  });

  // ============================================
  // ESTADÍSTICAS Y REPORTES
  // ============================================

  // Estadísticas generales de colocaciones
  fastify.get('/colocaciones/estadisticas/general', async (request, reply) => {
    const { periodo } = request.query;

    try {
      const snapshot = await db.collection('colocacion').get();
      const colocaciones = snapshot.docs.map(doc => doc.data());

      const estadisticas = calcularEstadisticasColocacion(colocaciones, periodo);

      reply.send({
        ...estadisticas,
        generadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al obtener estadísticas' });
    }
  });

  // Colocaciones por empresa
  fastify.get('/colocaciones/estadisticas/por-empresa', async (request, reply) => {
    try {
      const snapshot = await db.collection('colocacion').get();
      const colocaciones = snapshot.docs.map(doc => doc.data());

      const porEmpresa = {};
      colocaciones.forEach(col => {
        const ruc = col.empresaRUC;
        if (!porEmpresa[ruc]) {
          porEmpresa[ruc] = {
            empresaRUC: ruc,
            empresaNombre: col.empresaNombre,
            total: 0,
            activas: 0,
            finalizadas: 0
          };
        }
        porEmpresa[ruc].total++;
        if (col.estadoColocacion === 'activa') {
          porEmpresa[ruc].activas++;
        } else {
          porEmpresa[ruc].finalizadas++;
        }
      });

      const ranking = Object.values(porEmpresa)
        .sort((a, b) => b.total - a.total);

      reply.send({
        total: ranking.length,
        ranking,
        generadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al obtener estadísticas por empresa' });
    }
  });

  // Colocaciones próximas a vencer
  fastify.get('/colocaciones/alertas/proximas-vencer', async (request, reply) => {
    const { dias = 30 } = request.query;

    try {
      const snapshot = await db.collection('colocacion')
        .where('estadoColocacion', '==', 'activa')
        .get();

      const ahora = new Date();
      const limite = new Date();
      limite.setDate(limite.getDate() + parseInt(dias));

      const colocaciones = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(col => {
          if (!col.fechaFin) return false;
          const fechaFin = new Date(col.fechaFin);
          return fechaFin >= ahora && fechaFin <= limite;
        })
        .map(col => ({
          ...col,
          diasRestantes: Math.ceil((new Date(col.fechaFin) - ahora) / (1000 * 60 * 60 * 24))
        }))
        .sort((a, b) => a.diasRestantes - b.diasRestantes);

      reply.send({
        total: colocaciones.length,
        diasConsiderados: parseInt(dias),
        colocaciones,
        generadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al obtener alertas' });
    }
  });
};
