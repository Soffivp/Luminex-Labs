// routes/proceso-laboral.js
const {
  serverTimestamp,
  generarIdDocumento,
  generarIdProceso,
  TIPOS_DOCUMENTOS,
  ESTADOS_PROCESO,
  validarTipoArchivo,
  validarTamanoArchivo,
  generarRutaAlmacenamiento,
  verificarDocumentosCompletos,
  calcularProgreso,
  generarResumenProceso,
  validarPDF
} = require('./utils/functions');

module.exports = (fastify, db, storage = null) => {
  // ============================================
  // PROCESOS LABORALES
  // ============================================

  /**
   * Iniciar proceso laboral al aceptar un matching
   * POST /proceso-laboral/iniciar
   */
  fastify.post('/proceso-laboral/iniciar', async (request, reply) => {
    const { matchingId } = request.body;

    if (!matchingId) {
      return reply.code(400).send({ error: 'El matchingId es obligatorio' });
    }

    try {
      // Verificar que el matching existe y está aprobado
      const matchingDoc = await db.collection('matching').doc(matchingId).get();

      if (!matchingDoc.exists) {
        return reply.code(404).send({ error: 'Matching no encontrado' });
      }

      const matching = matchingDoc.data();

      // Validar estado del matching
      if (!['aprobado', 'contratado'].includes(matching.estadoMatch)) {
        return reply.code(400).send({
          error: 'El matching debe estar aprobado para iniciar el proceso laboral',
          estadoActual: matching.estadoMatch
        });
      }

      // Verificar si ya existe un proceso para este matching
      const procesoExistente = await db.collection('proceso_laboral')
        .where('matchingId', '==', matchingId)
        .get();

      if (!procesoExistente.empty) {
        const proceso = procesoExistente.docs[0];
        return reply.code(200).send({
          mensaje: 'Ya existe un proceso laboral para este matching',
          proceso: { id: proceso.id, ...proceso.data() }
        });
      }

      // Obtener datos del empleado
      const empleadoDoc = await db.collection('empleado').doc(matching.empleadoCedula).get();
      const empleado = empleadoDoc.exists ? empleadoDoc.data() : {};

      // Crear nuevo proceso laboral
      const procesoId = generarIdProceso();
      const procesoData = {
        matchingId,
        empleadoCedula: matching.empleadoCedula,
        empleadoNombre: `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim() || matching.empleadoNombre,
        vacanteId: matching.vacanteId,
        vacanteTitulo: matching.vacanteTitulo,
        empresaRUC: matching.empresaRUC,
        estado: ESTADOS_PROCESO.PENDIENTE_DOCUMENTOS,
        documentosRequeridos: Object.values(TIPOS_DOCUMENTOS)
          .filter(t => t.requerido)
          .map(t => ({ codigo: t.codigo, nombre: t.nombre })),
        fechaInicio: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      };

      await db.collection('proceso_laboral').doc(procesoId).set(procesoData);

      reply.code(201).send({
        mensaje: 'Proceso laboral iniciado exitosamente',
        procesoId,
        ...procesoData,
        documentosPendientes: procesoData.documentosRequeridos
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al iniciar proceso laboral' });
    }
  });

  /**
   * Obtener proceso laboral por ID
   * GET /proceso-laboral/:id
   */
  fastify.get('/proceso-laboral/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const procesoDoc = await db.collection('proceso_laboral').doc(id).get();

      if (!procesoDoc.exists) {
        return reply.code(404).send({ error: 'Proceso laboral no encontrado' });
      }

      const proceso = { id: procesoDoc.id, ...procesoDoc.data() };

      // Obtener documentos del proceso
      const documentosSnapshot = await db.collection('documentos_proceso')
        .where('procesoId', '==', id)
        .get();

      const documentos = documentosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        contenido: undefined // No enviar el contenido en listados
      }));

      const resumen = generarResumenProceso(proceso, documentos);

      reply.send({
        ...resumen,
        documentosDetalle: documentos
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al obtener proceso laboral' });
    }
  });

  /**
   * Obtener proceso laboral por matching
   * GET /proceso-laboral/matching/:matchingId
   */
  fastify.get('/proceso-laboral/matching/:matchingId', async (request, reply) => {
    const { matchingId } = request.params;

    try {
      const snapshot = await db.collection('proceso_laboral')
        .where('matchingId', '==', matchingId)
        .get();

      if (snapshot.empty) {
        return reply.code(404).send({ error: 'No existe proceso laboral para este matching' });
      }

      const procesoDoc = snapshot.docs[0];
      const proceso = { id: procesoDoc.id, ...procesoDoc.data() };

      // Obtener documentos
      const documentosSnapshot = await db.collection('documentos_proceso')
        .where('procesoId', '==', procesoDoc.id)
        .get();

      const documentos = documentosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        contenido: undefined
      }));

      const resumen = generarResumenProceso(proceso, documentos);

      reply.send({
        ...resumen,
        documentosDetalle: documentos
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al obtener proceso laboral' });
    }
  });

  /**
   * Listar procesos laborales
   * GET /procesos-laborales
   */
  fastify.get('/procesos-laborales', async (request, reply) => {
    const { estado, empresaRUC, empleadoCedula, limite = 50 } = request.query;

    try {
      let query = db.collection('proceso_laboral');

      if (estado) {
        query = query.where('estado', '==', estado);
      }
      if (empresaRUC) {
        query = query.where('empresaRUC', '==', empresaRUC);
      }
      if (empleadoCedula) {
        query = query.where('empleadoCedula', '==', empleadoCedula);
      }

      const snapshot = await query.limit(parseInt(limite)).get();
      const procesos = [];

      for (const doc of snapshot.docs) {
        const proceso = { id: doc.id, ...doc.data() };

        // Obtener documentos para calcular progreso
        const docsSnapshot = await db.collection('documentos_proceso')
          .where('procesoId', '==', doc.id)
          .get();

        const documentos = docsSnapshot.docs.map(d => d.data());
        const progreso = calcularProgreso(documentos);

        procesos.push({
          ...proceso,
          progreso
        });
      }

      reply.send({
        total: procesos.length,
        procesos
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al listar procesos laborales' });
    }
  });

  // ============================================
  // SUBIDA DE DOCUMENTOS
  // ============================================

  /**
   * Subir documento al proceso laboral
   * POST /proceso-laboral/:id/documentos
   */
  fastify.post('/proceso-laboral/:id/documentos', async (request, reply) => {
    const { id } = request.params;
    const { tipoDocumento, nombreArchivo, contenidoBase64, descripcion } = request.body;

    // Validaciones
    if (!tipoDocumento) {
      return reply.code(400).send({ error: 'El tipoDocumento es obligatorio' });
    }
    if (!nombreArchivo) {
      return reply.code(400).send({ error: 'El nombreArchivo es obligatorio' });
    }
    if (!contenidoBase64) {
      return reply.code(400).send({ error: 'El contenidoBase64 es obligatorio' });
    }

    try {
      // Verificar que el proceso existe
      const procesoDoc = await db.collection('proceso_laboral').doc(id).get();

      if (!procesoDoc.exists) {
        return reply.code(404).send({ error: 'Proceso laboral no encontrado' });
      }

      const proceso = procesoDoc.data();

      // Validar estado del proceso
      if ([ESTADOS_PROCESO.CONTRATADO, ESTADOS_PROCESO.CANCELADO].includes(proceso.estado)) {
        return reply.code(400).send({
          error: 'No se pueden subir documentos a un proceso finalizado',
          estado: proceso.estado
        });
      }

      // Validar tipo de archivo
      const validacionTipo = validarTipoArchivo(nombreArchivo, tipoDocumento);
      if (!validacionTipo.valido) {
        return reply.code(400).send({ error: validacionTipo.error });
      }

      // Decodificar y validar tamaño
      const buffer = Buffer.from(contenidoBase64, 'base64');
      const validacionTamano = validarTamanoArchivo(buffer.length, tipoDocumento);
      if (!validacionTamano.valido) {
        return reply.code(400).send({ error: validacionTamano.error });
      }

      // Validar que sea PDF si es requerido
      if (nombreArchivo.toLowerCase().endsWith('.pdf')) {
        if (!validarPDF(buffer)) {
          return reply.code(400).send({ error: 'El archivo no es un PDF válido' });
        }
      }

      // Verificar si ya existe un documento del mismo tipo
      const existente = await db.collection('documentos_proceso')
        .where('procesoId', '==', id)
        .where('tipoDocumento', '==', tipoDocumento)
        .get();

      if (!existente.empty) {
        // Marcar el anterior como reemplazado
        const docAnterior = existente.docs[0];
        await db.collection('documentos_proceso').doc(docAnterior.id).update({
          estado: 'reemplazado',
          fechaReemplazo: serverTimestamp()
        });
      }

      // Generar ruta de almacenamiento
      const rutaAlmacenamiento = generarRutaAlmacenamiento(proceso.matchingId, tipoDocumento, nombreArchivo);

      // Crear documento
      const documentoId = generarIdDocumento();
      const tipoConfig = TIPOS_DOCUMENTOS[tipoDocumento.toUpperCase()] || TIPOS_DOCUMENTOS.OTRO;

      const documentoData = {
        procesoId: id,
        matchingId: proceso.matchingId,
        empleadoCedula: proceso.empleadoCedula,
        tipoDocumento: tipoConfig.codigo,
        nombreTipoDocumento: tipoConfig.nombre,
        nombreArchivo,
        rutaAlmacenamiento,
        tamano: buffer.length,
        mimeType: nombreArchivo.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*',
        contenidoBase64, // Guardamos el contenido en Firestore (alternativa: usar Storage)
        estado: 'pendiente_revision',
        descripcion: descripcion || '',
        fechaSubida: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      };

      await db.collection('documentos_proceso').doc(documentoId).set(documentoData);

      // Actualizar estado del proceso si estaba pendiente
      if (proceso.estado === ESTADOS_PROCESO.PENDIENTE_DOCUMENTOS) {
        await db.collection('proceso_laboral').doc(id).update({
          estado: ESTADOS_PROCESO.DOCUMENTOS_EN_REVISION,
          fechaActualizacion: serverTimestamp()
        });
      }

      reply.code(201).send({
        mensaje: 'Documento subido exitosamente',
        documentoId,
        tipoDocumento: tipoConfig.codigo,
        nombreTipoDocumento: tipoConfig.nombre,
        nombreArchivo,
        tamano: buffer.length,
        estado: 'pendiente_revision'
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al subir documento' });
    }
  });

  /**
   * Subir múltiples documentos
   * POST /proceso-laboral/:id/documentos/lote
   */
  fastify.post('/proceso-laboral/:id/documentos/lote', async (request, reply) => {
    const { id } = request.params;
    const { documentos } = request.body;

    if (!documentos || !Array.isArray(documentos) || documentos.length === 0) {
      return reply.code(400).send({ error: 'Se requiere un array de documentos' });
    }

    try {
      // Verificar que el proceso existe
      const procesoDoc = await db.collection('proceso_laboral').doc(id).get();

      if (!procesoDoc.exists) {
        return reply.code(404).send({ error: 'Proceso laboral no encontrado' });
      }

      const proceso = procesoDoc.data();
      const resultados = [];
      const errores = [];

      for (const doc of documentos) {
        try {
          const { tipoDocumento, nombreArchivo, contenidoBase64, descripcion } = doc;

          // Validaciones básicas
          if (!tipoDocumento || !nombreArchivo || !contenidoBase64) {
            errores.push({
              tipoDocumento,
              error: 'Faltan campos requeridos (tipoDocumento, nombreArchivo, contenidoBase64)'
            });
            continue;
          }

          // Validar tipo
          const validacionTipo = validarTipoArchivo(nombreArchivo, tipoDocumento);
          if (!validacionTipo.valido) {
            errores.push({ tipoDocumento, error: validacionTipo.error });
            continue;
          }

          // Decodificar y validar tamaño
          const buffer = Buffer.from(contenidoBase64, 'base64');
          const validacionTamano = validarTamanoArchivo(buffer.length, tipoDocumento);
          if (!validacionTamano.valido) {
            errores.push({ tipoDocumento, error: validacionTamano.error });
            continue;
          }

          // Crear documento
          const documentoId = generarIdDocumento();
          const tipoConfig = TIPOS_DOCUMENTOS[tipoDocumento.toUpperCase()] || TIPOS_DOCUMENTOS.OTRO;
          const rutaAlmacenamiento = generarRutaAlmacenamiento(proceso.matchingId, tipoDocumento, nombreArchivo);

          const documentoData = {
            procesoId: id,
            matchingId: proceso.matchingId,
            empleadoCedula: proceso.empleadoCedula,
            tipoDocumento: tipoConfig.codigo,
            nombreTipoDocumento: tipoConfig.nombre,
            nombreArchivo,
            rutaAlmacenamiento,
            tamano: buffer.length,
            mimeType: nombreArchivo.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*',
            contenidoBase64,
            estado: 'pendiente_revision',
            descripcion: descripcion || '',
            fechaSubida: serverTimestamp(),
            fechaActualizacion: serverTimestamp()
          };

          await db.collection('documentos_proceso').doc(documentoId).set(documentoData);

          resultados.push({
            documentoId,
            tipoDocumento: tipoConfig.codigo,
            nombreArchivo,
            estado: 'subido'
          });
        } catch (err) {
          errores.push({
            tipoDocumento: doc.tipoDocumento,
            error: err.message
          });
        }
      }

      // Actualizar estado del proceso
      if (resultados.length > 0 && proceso.estado === ESTADOS_PROCESO.PENDIENTE_DOCUMENTOS) {
        await db.collection('proceso_laboral').doc(id).update({
          estado: ESTADOS_PROCESO.DOCUMENTOS_EN_REVISION,
          fechaActualizacion: serverTimestamp()
        });
      }

      reply.send({
        mensaje: `${resultados.length} documento(s) subido(s)`,
        subidos: resultados.length,
        errores: errores.length,
        resultados,
        detalleErrores: errores.length > 0 ? errores : undefined
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al subir documentos' });
    }
  });

  /**
   * Obtener documento específico
   * GET /proceso-laboral/documentos/:documentoId
   */
  fastify.get('/proceso-laboral/documentos/:documentoId', async (request, reply) => {
    const { documentoId } = request.params;
    const { incluirContenido = false } = request.query;

    try {
      const docRef = await db.collection('documentos_proceso').doc(documentoId).get();

      if (!docRef.exists) {
        return reply.code(404).send({ error: 'Documento no encontrado' });
      }

      const documento = { id: docRef.id, ...docRef.data() };

      // Solo incluir contenido si se solicita explícitamente
      if (incluirContenido !== 'true' && incluirContenido !== true) {
        delete documento.contenidoBase64;
      }

      reply.send(documento);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al obtener documento' });
    }
  });

  /**
   * Descargar documento (obtener contenido)
   * GET /proceso-laboral/documentos/:documentoId/descargar
   */
  fastify.get('/proceso-laboral/documentos/:documentoId/descargar', async (request, reply) => {
    const { documentoId } = request.params;

    try {
      const docRef = await db.collection('documentos_proceso').doc(documentoId).get();

      if (!docRef.exists) {
        return reply.code(404).send({ error: 'Documento no encontrado' });
      }

      const documento = docRef.data();

      if (!documento.contenidoBase64) {
        return reply.code(404).send({ error: 'Contenido del documento no disponible' });
      }

      // Retornar el contenido para descarga
      reply.send({
        nombreArchivo: documento.nombreArchivo,
        mimeType: documento.mimeType,
        tamano: documento.tamano,
        contenidoBase64: documento.contenidoBase64
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al descargar documento' });
    }
  });

  /**
   * Listar documentos de un proceso
   * GET /proceso-laboral/:id/documentos
   */
  fastify.get('/proceso-laboral/:id/documentos', async (request, reply) => {
    const { id } = request.params;
    const { estado } = request.query;

    try {
      let query = db.collection('documentos_proceso')
        .where('procesoId', '==', id);

      if (estado) {
        query = query.where('estado', '==', estado);
      }

      const snapshot = await query.get();
      const documentos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        contenidoBase64: undefined // No incluir contenido en listados
      }));

      // Calcular progreso
      const progreso = calcularProgreso(documentos);
      const verificacion = verificarDocumentosCompletos(documentos);

      reply.send({
        procesoId: id,
        total: documentos.length,
        progreso,
        documentosRequeridos: verificacion,
        documentos
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al listar documentos' });
    }
  });

  // ============================================
  // REVISIÓN DE DOCUMENTOS
  // ============================================

  /**
   * Aprobar documento
   * PATCH /proceso-laboral/documentos/:documentoId/aprobar
   */
  fastify.patch('/proceso-laboral/documentos/:documentoId/aprobar', async (request, reply) => {
    const { documentoId } = request.params;
    const { observaciones } = request.body || {};

    try {
      const docRef = db.collection('documentos_proceso').doc(documentoId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return reply.code(404).send({ error: 'Documento no encontrado' });
      }

      await docRef.update({
        estado: 'aprobado',
        observaciones: observaciones || '',
        fechaRevision: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      });

      // Verificar si todos los documentos requeridos están aprobados
      const documento = doc.data();
      const docsSnapshot = await db.collection('documentos_proceso')
        .where('procesoId', '==', documento.procesoId)
        .get();

      const documentos = docsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Actualizar el estado del documento actual en el array
      const idx = documentos.findIndex(d => d.id === documentoId);
      if (idx >= 0) documentos[idx].estado = 'aprobado';

      const verificacion = verificarDocumentosCompletos(documentos);

      // Si todos los documentos requeridos están completos, actualizar proceso
      if (verificacion.completos) {
        await db.collection('proceso_laboral').doc(documento.procesoId).update({
          estado: ESTADOS_PROCESO.DOCUMENTOS_APROBADOS,
          fechaActualizacion: serverTimestamp()
        });
      }

      reply.send({
        mensaje: 'Documento aprobado',
        documentoId,
        documentosCompletos: verificacion.completos,
        faltantes: verificacion.faltantes
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al aprobar documento' });
    }
  });

  /**
   * Rechazar documento
   * PATCH /proceso-laboral/documentos/:documentoId/rechazar
   */
  fastify.patch('/proceso-laboral/documentos/:documentoId/rechazar', async (request, reply) => {
    const { documentoId } = request.params;
    const { motivo } = request.body;

    if (!motivo) {
      return reply.code(400).send({ error: 'El motivo de rechazo es obligatorio' });
    }

    try {
      const docRef = db.collection('documentos_proceso').doc(documentoId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return reply.code(404).send({ error: 'Documento no encontrado' });
      }

      await docRef.update({
        estado: 'rechazado',
        motivoRechazo: motivo,
        fechaRevision: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      });

      // Actualizar estado del proceso
      const documento = doc.data();
      await db.collection('proceso_laboral').doc(documento.procesoId).update({
        estado: ESTADOS_PROCESO.DOCUMENTOS_RECHAZADOS,
        fechaActualizacion: serverTimestamp()
      });

      reply.send({
        mensaje: 'Documento rechazado',
        documentoId,
        motivo
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al rechazar documento' });
    }
  });

  /**
   * Eliminar documento
   * DELETE /proceso-laboral/documentos/:documentoId
   */
  fastify.delete('/proceso-laboral/documentos/:documentoId', async (request, reply) => {
    const { documentoId } = request.params;

    try {
      const docRef = db.collection('documentos_proceso').doc(documentoId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return reply.code(404).send({ error: 'Documento no encontrado' });
      }

      const documento = doc.data();

      // No permitir eliminar documentos aprobados
      if (documento.estado === 'aprobado') {
        return reply.code(400).send({
          error: 'No se pueden eliminar documentos aprobados'
        });
      }

      await docRef.delete();

      reply.send({
        mensaje: 'Documento eliminado',
        documentoId
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al eliminar documento' });
    }
  });

  // ============================================
  // GESTIÓN DEL PROCESO
  // ============================================

  /**
   * Actualizar estado del proceso laboral
   * PATCH /proceso-laboral/:id/estado
   */
  fastify.patch('/proceso-laboral/:id/estado', async (request, reply) => {
    const { id } = request.params;
    const { estado, observaciones } = request.body;

    const estadosValidos = Object.values(ESTADOS_PROCESO);
    if (!estadosValidos.includes(estado)) {
      return reply.code(400).send({
        error: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`
      });
    }

    try {
      const procesoDoc = await db.collection('proceso_laboral').doc(id).get();

      if (!procesoDoc.exists) {
        return reply.code(404).send({ error: 'Proceso laboral no encontrado' });
      }

      const updateData = {
        estado,
        fechaActualizacion: serverTimestamp()
      };

      if (observaciones) {
        updateData.observaciones = observaciones;
      }

      // Si se marca como contratado, actualizar el matching también
      if (estado === ESTADOS_PROCESO.CONTRATADO) {
        updateData.fechaContratacion = serverTimestamp();

        const proceso = procesoDoc.data();
        await db.collection('matching').doc(proceso.matchingId).update({
          estadoMatch: 'contratado',
          fechaContratacion: serverTimestamp(),
          fechaActualizacion: serverTimestamp()
        });
      }

      await db.collection('proceso_laboral').doc(id).update(updateData);

      reply.send({
        mensaje: `Proceso actualizado a: ${estado}`,
        procesoId: id,
        estado
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al actualizar proceso laboral' });
    }
  });

  /**
   * Cancelar proceso laboral
   * DELETE /proceso-laboral/:id
   */
  fastify.delete('/proceso-laboral/:id', async (request, reply) => {
    const { id } = request.params;
    const { motivo } = request.body || {};

    try {
      const procesoDoc = await db.collection('proceso_laboral').doc(id).get();

      if (!procesoDoc.exists) {
        return reply.code(404).send({ error: 'Proceso laboral no encontrado' });
      }

      const proceso = procesoDoc.data();

      // No permitir cancelar procesos ya contratados
      if (proceso.estado === ESTADOS_PROCESO.CONTRATADO) {
        return reply.code(400).send({
          error: 'No se puede cancelar un proceso ya finalizado como contratado'
        });
      }

      await db.collection('proceso_laboral').doc(id).update({
        estado: ESTADOS_PROCESO.CANCELADO,
        motivoCancelacion: motivo || 'No especificado',
        fechaCancelacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
      });

      reply.send({
        mensaje: 'Proceso laboral cancelado',
        procesoId: id
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al cancelar proceso laboral' });
    }
  });

  // ============================================
  // TIPOS DE DOCUMENTOS
  // ============================================

  /**
   * Obtener tipos de documentos disponibles
   * GET /proceso-laboral/tipos-documentos
   */
  fastify.get('/proceso-laboral/tipos-documentos', async (request, reply) => {
    const tipos = Object.entries(TIPOS_DOCUMENTOS).map(([key, value]) => ({
      codigo: value.codigo,
      nombre: value.nombre,
      requerido: value.requerido,
      extensionesPermitidas: value.extensiones,
      tamanoMaximoMB: value.maxSize / (1024 * 1024)
    }));

    reply.send({
      total: tipos.length,
      requeridos: tipos.filter(t => t.requerido).length,
      tipos
    });
  });

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  /**
   * Estadísticas de procesos laborales
   * GET /procesos-laborales/estadisticas
   */
  fastify.get('/procesos-laborales/estadisticas', async (request, reply) => {
    try {
      const snapshot = await db.collection('proceso_laboral').get();
      const procesos = snapshot.docs.map(doc => doc.data());

      const estadisticas = {
        total: procesos.length,
        porEstado: {},
        contratadosTotal: procesos.filter(p => p.estado === ESTADOS_PROCESO.CONTRATADO).length,
        canceladosTotal: procesos.filter(p => p.estado === ESTADOS_PROCESO.CANCELADO).length,
        enProcesoTotal: procesos.filter(p =>
          ![ESTADOS_PROCESO.CONTRATADO, ESTADOS_PROCESO.CANCELADO].includes(p.estado)
        ).length
      };

      // Contar por estado
      Object.values(ESTADOS_PROCESO).forEach(estado => {
        estadisticas.porEstado[estado] = procesos.filter(p => p.estado === estado).length;
      });

      // Tasa de éxito
      const finalizados = estadisticas.contratadosTotal + estadisticas.canceladosTotal;
      estadisticas.tasaExito = finalizados > 0
        ? Math.round((estadisticas.contratadosTotal / finalizados) * 100)
        : 0;

      reply.send({
        ...estadisticas,
        generadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al obtener estadísticas' });
    }
  });
};
