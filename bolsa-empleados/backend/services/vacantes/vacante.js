// routes/vacante.js
const { serverTimestamp, generarIdVacante } = require('./utils/functions');

module.exports = (fastify, db) => {
  // Listar todas las vacantes
  fastify.get('/vacantes', async (request, reply) => {
    const { empresaRUC, estadoVacante, ubicacion, nivelLaboralRequerido } = request.query;

    let query = db.collection('vacante');

    if (empresaRUC) {
      query = query.where('empresaRUC', '==', empresaRUC);
    }
    if (estadoVacante) {
      query = query.where('estadoVacante', '==', estadoVacante);
    }
    if (ubicacion) {
      query = query.where('ubicacion', '==', ubicacion);
    }
    if (nivelLaboralRequerido) {
      query = query.where('nivelLaboralRequerido', '==', nivelLaboralRequerido);
    }

    const snapshot = await query.get();
    const vacantes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reply.send(vacantes);
  });

  // Obtener vacante por ID
  fastify.get('/vacantes/:id', async (request, reply) => {
    const { id } = request.params;
    const docRef = db.collection('vacante').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Vacante no encontrada' });
    }

    reply.send({ id: doc.id, ...doc.data() });
  });

  // Crear nueva vacante
  fastify.post('/vacantes', async (request, reply) => {
    const data = request.body;

    // Validaciones requeridas
    if (!data.tituloCargo) {
      return reply.code(400).send({ error: 'El campo tituloCargo es obligatorio' });
    }
    if (!data.empresaRUC) {
      return reply.code(400).send({ error: 'El campo empresaRUC es obligatorio' });
    }

    // Verificar que la empresa existe
    const empresaDoc = await db.collection('empresa').doc(String(data.empresaRUC)).get();
    if (!empresaDoc.exists) {
      return reply.code(404).send({ error: 'La empresa no existe' });
    }

    // Generar ID único
    const vacanteId = data.id || generarIdVacante();

    // Preparar documento
    const vacanteData = {
      tituloCargo: data.tituloCargo,
      descripcionFunciones: data.descripcionFunciones || '',
      requisitosEducacion: data.requisitosEducacion || '',
      aniosExperiencia: data.aniosExperiencia || '0',
      competenciasRequeridas: data.competenciasRequeridas || [],
      nivelLaboralRequerido: data.nivelLaboralRequerido || 'Junior',
      ubicacion: data.ubicacion || '',
      tipoContrato: data.tipoContrato || 'Indefinido',
      estadoVacante: data.estadoVacante || 'Activa',
      empresaRUC: data.empresaRUC,
      salarioMinimo: data.salarioMinimo || null,
      salarioMaximo: data.salarioMaximo || null,
      beneficios: data.beneficios || [],
      fechaPublicacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
      fechaCierre: data.fechaCierre || null,
      cantidadPostulantes: 0
    };

    const docRef = db.collection('vacante').doc(vacanteId);
    await docRef.set(vacanteData);

    reply.code(201).send({
      id: vacanteId,
      mensaje: 'Vacante creada exitosamente'
    });
  });

  // Actualizar vacante
  fastify.patch('/vacantes/:id', async (request, reply) => {
    const { id } = request.params;
    const data = request.body;

    const docRef = db.collection('vacante').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Vacante no encontrada' });
    }

    // Campos permitidos
    const camposPermitidos = [
      'tituloCargo', 'descripcionFunciones', 'requisitosEducacion',
      'aniosExperiencia', 'competenciasRequeridas', 'nivelLaboralRequerido',
      'ubicacion', 'tipoContrato', 'estadoVacante', 'salarioMinimo',
      'salarioMaximo', 'beneficios', 'fechaCierre'
    ];
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
      mensaje: 'Vacante actualizada exitosamente',
      actualizado: true
    });
  });

  // Cambiar estado de vacante
  fastify.patch('/vacantes/:id/estado', async (request, reply) => {
    const { id } = request.params;
    const { estadoVacante } = request.body;

    const estadosValidos = ['Activa', 'Pausada', 'Cerrada', 'Cancelada'];
    if (!estadosValidos.includes(estadoVacante)) {
      return reply.code(400).send({
        error: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`
      });
    }

    const docRef = db.collection('vacante').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Vacante no encontrada' });
    }

    await docRef.update({
      estadoVacante,
      fechaActualizacion: serverTimestamp(),
      ...(estadoVacante === 'Cerrada' && { fechaCierre: serverTimestamp() })
    });

    reply.code(200).send({
      id,
      mensaje: `Vacante ${estadoVacante.toLowerCase()}`,
      estadoVacante
    });
  });

  // Agregar competencia requerida
  fastify.post('/vacantes/:id/competencias', async (request, reply) => {
    const { id } = request.params;
    const { competencia } = request.body;

    if (!competencia) {
      return reply.code(400).send({ error: 'El campo competencia es obligatorio' });
    }

    const docRef = db.collection('vacante').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Vacante no encontrada' });
    }

    const currentData = doc.data();
    const competencias = currentData.competenciasRequeridas || [];

    if (!competencias.includes(competencia)) {
      competencias.push(competencia);
    }

    await docRef.update({
      competenciasRequeridas: competencias,
      fechaActualizacion: serverTimestamp()
    });

    reply.code(200).send({
      id,
      mensaje: 'Competencia agregada',
      competenciasRequeridas: competencias
    });
  });

  // Eliminar vacante
  fastify.delete('/vacantes/:id', async (request, reply) => {
    const { id } = request.params;

    const docRef = db.collection('vacante').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Vacante no encontrada' });
    }

    await docRef.delete();

    reply.code(200).send({
      id,
      mensaje: 'Vacante eliminada exitosamente',
      eliminado: true
    });
  });

  // Buscar vacantes por empresa
  fastify.get('/vacantes/empresa/:ruc', async (request, reply) => {
    const { ruc } = request.params;
    const snapshot = await db.collection('vacante')
      .where('empresaRUC', '==', ruc)
      .get();

    const vacantes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reply.send(vacantes);
  });

  // Buscar vacantes activas
  fastify.get('/vacantes/activas', async (request, reply) => {
    const snapshot = await db.collection('vacante')
      .where('estadoVacante', '==', 'Activa')
      .get();

    const vacantes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reply.send(vacantes);
  });

  // Buscar por competencia
  fastify.get('/vacantes/competencia/:competencia', async (request, reply) => {
    const { competencia } = request.params;
    const snapshot = await db.collection('vacante')
      .where('competenciasRequeridas', 'array-contains', competencia)
      .get();

    const vacantes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reply.send(vacantes);
  });

  // Buscar por ubicación
  fastify.get('/vacantes/ubicacion/:ubicacion', async (request, reply) => {
    const { ubicacion } = request.params;
    const snapshot = await db.collection('vacante')
      .where('ubicacion', '==', ubicacion)
      .where('estadoVacante', '==', 'Activa')
      .get();

    const vacantes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reply.send(vacantes);
  });

  // Incrementar contador de postulantes
  fastify.post('/vacantes/:id/postular', async (request, reply) => {
    const { id } = request.params;

    const docRef = db.collection('vacante').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Vacante no encontrada' });
    }

    const currentData = doc.data();
    if (currentData.estadoVacante !== 'Activa') {
      return reply.code(400).send({ error: 'La vacante no está activa' });
    }

    await docRef.update({
      cantidadPostulantes: (currentData.cantidadPostulantes || 0) + 1,
      fechaActualizacion: serverTimestamp()
    });

    reply.code(200).send({
      id,
      mensaje: 'Postulación registrada',
      cantidadPostulantes: (currentData.cantidadPostulantes || 0) + 1
    });
  });
};
