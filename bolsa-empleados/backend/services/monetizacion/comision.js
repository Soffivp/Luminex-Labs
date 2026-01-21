// routes/comision.js
const { serverTimestamp, generarIdComision, calcularMontoTotal } = require('./utils/functions');

module.exports = (fastify, db) => {
  // Listar todas las comisiones
  fastify.get('/comisiones', async (request, reply) => {
    const { empresaRUC, estadoComision, idAdministrador } = request.query;

    let query = db.collection('comision');

    if (empresaRUC) {
      query = query.where('empresaRUC', '==', empresaRUC);
    }
    if (estadoComision) {
      query = query.where('estadoComision', '==', estadoComision);
    }
    if (idAdministrador) {
      query = query.where('idAdministrador', '==', idAdministrador);
    }

    const snapshot = await query.get();
    const comisiones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reply.send(comisiones);
  });

  // Obtener comisión por ID
  fastify.get('/comisiones/:id', async (request, reply) => {
    const { id } = request.params;
    const docRef = db.collection('comision').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Comisión no encontrada' });
    }

    reply.send({ id: doc.id, ...doc.data() });
  });

  // Crear nueva comisión
  fastify.post('/comisiones', async (request, reply) => {
    const data = request.body;

    // Validaciones
    if (!data.empresaRUC) {
      return reply.code(400).send({ error: 'El campo empresaRUC es obligatorio' });
    }

    // Verificar que la empresa existe
    const empresaDoc = await db.collection('empresa').doc(String(data.empresaRUC)).get();
    if (!empresaDoc.exists) {
      return reply.code(404).send({ error: 'La empresa no existe' });
    }

    // Generar ID único
    const comisionId = data.id || generarIdComision();

    // Calcular monto total
    const montoTotal = calcularMontoTotal(data);

    // Preparar documento
    const comisionData = {
      comisionColocacion: data.comisionColocacion || 0,
      comisionSueldo: data.comisionSueldo || 0,
      comisionContrato: data.comisionContrato || 0,
      comisionRetencion: data.comisionRetencion || 0,
      montoTotal,
      estadoComision: data.estadoComision || 'Pendiente',
      idProceso: data.idProceso || [],
      empresaRUC: data.empresaRUC,
      idAdministrador: data.idAdministrador || null,
      fechaCreacion: serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
      fechaPago: null,
      observaciones: data.observaciones || ''
    };

    const docRef = db.collection('comision').doc(comisionId);
    await docRef.set(comisionData);

    reply.code(201).send({
      id: comisionId,
      mensaje: 'Comisión creada exitosamente',
      montoTotal
    });
  });

  // Actualizar comisión
  fastify.patch('/comisiones/:id', async (request, reply) => {
    const { id } = request.params;
    const data = request.body;

    const docRef = db.collection('comision').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Comisión no encontrada' });
    }

    // Campos permitidos
    const camposPermitidos = [
      'comisionColocacion', 'comisionSueldo', 'comisionContrato',
      'comisionRetencion', 'estadoComision', 'idProceso',
      'idAdministrador', 'observaciones'
    ];
    const actualizacion = {};

    for (const campo of camposPermitidos) {
      if (data[campo] !== undefined) {
        actualizacion[campo] = data[campo];
      }
    }

    // Recalcular monto total si se actualizan comisiones
    const currentData = doc.data();
    const newData = { ...currentData, ...actualizacion };
    actualizacion.montoTotal = calcularMontoTotal(newData);
    actualizacion.fechaActualizacion = serverTimestamp();

    await docRef.update(actualizacion);

    reply.code(200).send({
      id,
      mensaje: 'Comisión actualizada exitosamente',
      montoTotal: actualizacion.montoTotal
    });
  });

  // Cambiar estado de comisión
  fastify.patch('/comisiones/:id/estado', async (request, reply) => {
    const { id } = request.params;
    const { estadoComision } = request.body;

    const estadosValidos = ['Pendiente', 'Aprobada', 'Pagada', 'Cancelada', 'EnDisputa'];
    if (!estadosValidos.includes(estadoComision)) {
      return reply.code(400).send({
        error: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`
      });
    }

    const docRef = db.collection('comision').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Comisión no encontrada' });
    }

    const updateData = {
      estadoComision,
      fechaActualizacion: serverTimestamp()
    };

    // Si se marca como pagada, registrar fecha de pago
    if (estadoComision === 'Pagada') {
      updateData.fechaPago = serverTimestamp();
    }

    await docRef.update(updateData);

    reply.code(200).send({
      id,
      mensaje: `Comisión ${estadoComision.toLowerCase()}`,
      estadoComision
    });
  });

  // Marcar comisión como pagada
  fastify.post('/comisiones/:id/pagar', async (request, reply) => {
    const { id } = request.params;
    const { metodoPago, referenciaPago } = request.body;

    const docRef = db.collection('comision').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Comisión no encontrada' });
    }

    const currentData = doc.data();
    if (currentData.estadoComision === 'Pagada') {
      return reply.code(400).send({ error: 'La comisión ya fue pagada' });
    }
    if (currentData.estadoComision === 'Cancelada') {
      return reply.code(400).send({ error: 'No se puede pagar una comisión cancelada' });
    }

    await docRef.update({
      estadoComision: 'Pagada',
      fechaPago: serverTimestamp(),
      fechaActualizacion: serverTimestamp(),
      metodoPago: metodoPago || 'Transferencia',
      referenciaPago: referenciaPago || null
    });

    reply.code(200).send({
      id,
      mensaje: 'Comisión pagada exitosamente',
      montoTotal: currentData.montoTotal
    });
  });

  // Agregar proceso a comisión
  fastify.post('/comisiones/:id/procesos', async (request, reply) => {
    const { id } = request.params;
    const { idProceso } = request.body;

    if (!idProceso) {
      return reply.code(400).send({ error: 'El campo idProceso es obligatorio' });
    }

    const docRef = db.collection('comision').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Comisión no encontrada' });
    }

    const currentData = doc.data();
    const procesos = currentData.idProceso || [];

    if (!procesos.includes(idProceso)) {
      procesos.push(idProceso);
    }

    await docRef.update({
      idProceso: procesos,
      fechaActualizacion: serverTimestamp()
    });

    reply.code(200).send({
      id,
      mensaje: 'Proceso agregado',
      idProceso: procesos
    });
  });

  // Eliminar comisión
  fastify.delete('/comisiones/:id', async (request, reply) => {
    const { id } = request.params;

    const docRef = db.collection('comision').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Comisión no encontrada' });
    }

    const currentData = doc.data();
    if (currentData.estadoComision === 'Pagada') {
      return reply.code(400).send({ error: 'No se puede eliminar una comisión pagada' });
    }

    await docRef.delete();

    reply.code(200).send({
      id,
      mensaje: 'Comisión eliminada exitosamente',
      eliminado: true
    });
  });

  // Comisiones por empresa
  fastify.get('/comisiones/empresa/:ruc', async (request, reply) => {
    const { ruc } = request.params;
    const snapshot = await db.collection('comision')
      .where('empresaRUC', '==', ruc)
      .get();

    const comisiones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reply.send(comisiones);
  });

  // Comisiones pendientes
  fastify.get('/comisiones/pendientes', async (request, reply) => {
    const snapshot = await db.collection('comision')
      .where('estadoComision', '==', 'Pendiente')
      .get();

    const comisiones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reply.send(comisiones);
  });

  // Comisiones por administrador
  fastify.get('/comisiones/administrador/:idAdmin', async (request, reply) => {
    const { idAdmin } = request.params;
    const snapshot = await db.collection('comision')
      .where('idAdministrador', '==', idAdmin)
      .get();

    const comisiones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reply.send(comisiones);
  });

  // Resumen de comisiones por empresa
  fastify.get('/comisiones/resumen/empresa/:ruc', async (request, reply) => {
    const { ruc } = request.params;
    const snapshot = await db.collection('comision')
      .where('empresaRUC', '==', ruc)
      .get();

    const comisiones = snapshot.docs.map(doc => doc.data());

    const resumen = {
      empresaRUC: ruc,
      totalComisiones: comisiones.length,
      montoTotalPendiente: 0,
      montoTotalPagado: 0,
      montoTotalGeneral: 0,
      porEstado: {
        Pendiente: 0,
        Aprobada: 0,
        Pagada: 0,
        Cancelada: 0,
        EnDisputa: 0
      }
    };

    comisiones.forEach(c => {
      resumen.montoTotalGeneral += c.montoTotal || 0;
      resumen.porEstado[c.estadoComision] = (resumen.porEstado[c.estadoComision] || 0) + 1;

      if (c.estadoComision === 'Pagada') {
        resumen.montoTotalPagado += c.montoTotal || 0;
      } else if (c.estadoComision === 'Pendiente' || c.estadoComision === 'Aprobada') {
        resumen.montoTotalPendiente += c.montoTotal || 0;
      }
    });

    reply.send(resumen);
  });
};
