// routes/cumplimiento-legal.js
const {
  serverTimestamp,
  generarIdVerificacion,
  validarCedulaEcuador,
  validarRUC,
  verificarDocumentosEmpleado,
  verificarDocumentosEmpresa,
  calcularNivelCumplimiento,
  generarAlertasVencimiento
} = require('./utils/functions');

module.exports = (fastify, db) => {
  // ============================================
  // VERIFICACIÓN DE DOCUMENTOS DE EMPLEADOS
  // ============================================

  // Verificar cumplimiento legal de un empleado
  fastify.get('/cumplimiento/empleados/:cedula', async (request, reply) => {
    const { cedula } = request.params;

    try {
      // Validar formato de cédula
      if (!validarCedulaEcuador(cedula)) {
        return reply.code(400).send({ error: 'Cédula ecuatoriana inválida' });
      }

      const empleadoDoc = await db.collection('empleado').doc(cedula).get();

      if (!empleadoDoc.exists) {
        return reply.code(404).send({ error: 'Empleado no encontrado' });
      }

      const empleado = empleadoDoc.data();
      const verificacion = verificarDocumentosEmpleado(empleado);

      // Guardar verificación en historial
      const verificacionId = generarIdVerificacion('EMP');
      await db.collection('verificaciones_cumplimiento').doc(verificacionId).set({
        id: verificacionId,
        tipo: 'empleado',
        entidadId: cedula,
        resultado: verificacion,
        fechaVerificacion: serverTimestamp()
      });

      reply.send({
        empleadoCedula: cedula,
        empleadoNombre: `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim(),
        verificacion,
        verificacionId,
        fechaVerificacion: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al verificar cumplimiento del empleado' });
    }
  });

  // Verificar cumplimiento de todos los empleados
  fastify.get('/cumplimiento/empleados', async (request, reply) => {
    const { soloIncompletos, limite = 100 } = request.query;

    try {
      const snapshot = await db.collection('empleado').limit(parseInt(limite)).get();
      const resultados = [];

      for (const doc of snapshot.docs) {
        const empleado = doc.data();
        const verificacion = verificarDocumentosEmpleado(empleado);

        if (soloIncompletos === 'true' && verificacion.cumpleRequisitos) {
          continue;
        }

        resultados.push({
          cedula: doc.id,
          nombre: `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim(),
          nivelCumplimiento: verificacion.nivelCumplimiento,
          cumpleRequisitos: verificacion.cumpleRequisitos,
          documentosFaltantes: verificacion.documentosFaltantes.length,
          alertas: verificacion.alertas.length
        });
      }

      // Ordenar por nivel de cumplimiento (menor primero)
      resultados.sort((a, b) => a.nivelCumplimiento - b.nivelCumplimiento);

      reply.send({
        total: resultados.length,
        promedioNivelCumplimiento: resultados.length > 0
          ? Math.round(resultados.reduce((sum, r) => sum + r.nivelCumplimiento, 0) / resultados.length)
          : 0,
        empleadosConProblemas: resultados.filter(r => !r.cumpleRequisitos).length,
        resultados,
        fechaVerificacion: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al verificar cumplimiento de empleados' });
    }
  });

  // ============================================
  // VERIFICACIÓN DE DOCUMENTOS DE EMPRESAS
  // ============================================

  // Verificar cumplimiento legal de una empresa
  fastify.get('/cumplimiento/empresas/:ruc', async (request, reply) => {
    const { ruc } = request.params;

    try {
      // Validar formato de RUC
      if (!validarRUC(ruc)) {
        return reply.code(400).send({ error: 'RUC ecuatoriano inválido' });
      }

      // Buscar empresa por RUC
      const empresasSnapshot = await db.collection('empresa')
        .where('ruc', '==', ruc)
        .limit(1)
        .get();

      if (empresasSnapshot.empty) {
        return reply.code(404).send({ error: 'Empresa no encontrada' });
      }

      const empresaDoc = empresasSnapshot.docs[0];
      const empresa = empresaDoc.data();
      const verificacion = verificarDocumentosEmpresa(empresa);

      // Guardar verificación en historial
      const verificacionId = generarIdVerificacion('EMP');
      await db.collection('verificaciones_cumplimiento').doc(verificacionId).set({
        id: verificacionId,
        tipo: 'empresa',
        entidadId: ruc,
        resultado: verificacion,
        fechaVerificacion: serverTimestamp()
      });

      reply.send({
        empresaRUC: ruc,
        empresaNombre: empresa.razonSocial || empresa.nombreComercial,
        verificacion,
        verificacionId,
        fechaVerificacion: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al verificar cumplimiento de la empresa' });
    }
  });

  // Verificar cumplimiento de todas las empresas
  fastify.get('/cumplimiento/empresas', async (request, reply) => {
    const { soloIncompletos, tipoEmpresa, limite = 100 } = request.query;

    try {
      let query = db.collection('empresa');

      if (tipoEmpresa) {
        query = query.where('tipoEmpresa', '==', tipoEmpresa);
      }

      const snapshot = await query.limit(parseInt(limite)).get();
      const resultados = [];

      for (const doc of snapshot.docs) {
        const empresa = doc.data();
        const verificacion = verificarDocumentosEmpresa(empresa);

        if (soloIncompletos === 'true' && verificacion.cumpleRequisitos) {
          continue;
        }

        resultados.push({
          ruc: empresa.ruc,
          razonSocial: empresa.razonSocial,
          tipoEmpresa: empresa.tipoEmpresa,
          nivelCumplimiento: verificacion.nivelCumplimiento,
          cumpleRequisitos: verificacion.cumpleRequisitos,
          documentosFaltantes: verificacion.documentosFaltantes.length,
          alertas: verificacion.alertas.length
        });
      }

      resultados.sort((a, b) => a.nivelCumplimiento - b.nivelCumplimiento);

      reply.send({
        total: resultados.length,
        promedioNivelCumplimiento: resultados.length > 0
          ? Math.round(resultados.reduce((sum, r) => sum + r.nivelCumplimiento, 0) / resultados.length)
          : 0,
        empresasConProblemas: resultados.filter(r => !r.cumpleRequisitos).length,
        resultados,
        fechaVerificacion: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al verificar cumplimiento de empresas' });
    }
  });

  // ============================================
  // ALERTAS Y VENCIMIENTOS
  // ============================================

  // Obtener alertas de documentos próximos a vencer
  fastify.get('/cumplimiento/alertas/vencimientos', async (request, reply) => {
    const { dias = 30, tipo } = request.query;

    try {
      const alertas = [];

      // Alertas de empleados
      if (!tipo || tipo === 'empleados') {
        const empleadosSnapshot = await db.collection('empleado').get();
        for (const doc of empleadosSnapshot.docs) {
          const empleado = doc.data();
          const alertasEmpleado = generarAlertasVencimiento(empleado, 'empleado', parseInt(dias));
          if (alertasEmpleado.length > 0) {
            alertas.push({
              tipo: 'empleado',
              id: doc.id,
              nombre: `${empleado.nombres || ''} ${empleado.apellidos || ''}`.trim(),
              alertas: alertasEmpleado
            });
          }
        }
      }

      // Alertas de empresas
      if (!tipo || tipo === 'empresas') {
        const empresasSnapshot = await db.collection('empresa').get();
        for (const doc of empresasSnapshot.docs) {
          const empresa = doc.data();
          const alertasEmpresa = generarAlertasVencimiento(empresa, 'empresa', parseInt(dias));
          if (alertasEmpresa.length > 0) {
            alertas.push({
              tipo: 'empresa',
              id: empresa.ruc,
              nombre: empresa.razonSocial,
              alertas: alertasEmpresa
            });
          }
        }
      }

      // Ordenar por urgencia (días restantes)
      alertas.forEach(a => {
        a.alertas.sort((x, y) => x.diasRestantes - y.diasRestantes);
      });
      alertas.sort((a, b) => {
        const minA = Math.min(...a.alertas.map(x => x.diasRestantes));
        const minB = Math.min(...b.alertas.map(x => x.diasRestantes));
        return minA - minB;
      });

      reply.send({
        diasConsiderados: parseInt(dias),
        totalEntidadesConAlertas: alertas.length,
        totalAlertas: alertas.reduce((sum, a) => sum + a.alertas.length, 0),
        alertas,
        fechaConsulta: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al obtener alertas de vencimiento' });
    }
  });

  // ============================================
  // HISTORIAL DE VERIFICACIONES
  // ============================================

  // Obtener historial de verificaciones
  fastify.get('/cumplimiento/historial', async (request, reply) => {
    const { tipo, entidadId, limite = 50 } = request.query;

    try {
      let query = db.collection('verificaciones_cumplimiento')
        .orderBy('fechaVerificacion', 'desc');

      if (tipo) {
        query = query.where('tipo', '==', tipo);
      }
      if (entidadId) {
        query = query.where('entidadId', '==', entidadId);
      }

      const snapshot = await query.limit(parseInt(limite)).get();
      const verificaciones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      reply.send({
        total: verificaciones.length,
        verificaciones
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al obtener historial de verificaciones' });
    }
  });

  // ============================================
  // VALIDACIONES EN LÍNEA
  // ============================================

  // Validar cédula ecuatoriana
  fastify.post('/cumplimiento/validar/cedula', async (request, reply) => {
    const { cedula } = request.body;

    if (!cedula) {
      return reply.code(400).send({ error: 'Cédula requerida' });
    }

    const esValida = validarCedulaEcuador(cedula);

    reply.send({
      cedula,
      esValida,
      mensaje: esValida ? 'Cédula válida' : 'Cédula inválida'
    });
  });

  // Validar RUC ecuatoriano
  fastify.post('/cumplimiento/validar/ruc', async (request, reply) => {
    const { ruc } = request.body;

    if (!ruc) {
      return reply.code(400).send({ error: 'RUC requerido' });
    }

    const esValido = validarRUC(ruc);

    reply.send({
      ruc,
      esValido,
      mensaje: esValido ? 'RUC válido' : 'RUC inválido'
    });
  });

  // ============================================
  // DASHBOARD DE CUMPLIMIENTO
  // ============================================

  // Dashboard general de cumplimiento
  fastify.get('/cumplimiento/dashboard', async (request, reply) => {
    try {
      const [empleadosSnap, empresasSnap] = await Promise.all([
        db.collection('empleado').get(),
        db.collection('empresa').get()
      ]);

      // Analizar empleados
      let empleadosCumplen = 0;
      let empleadosNoCumplen = 0;
      let sumaEmpleados = 0;

      empleadosSnap.docs.forEach(doc => {
        const verificacion = verificarDocumentosEmpleado(doc.data());
        sumaEmpleados += verificacion.nivelCumplimiento;
        if (verificacion.cumpleRequisitos) {
          empleadosCumplen++;
        } else {
          empleadosNoCumplen++;
        }
      });

      // Analizar empresas
      let empresasCumplen = 0;
      let empresasNoCumplen = 0;
      let sumaEmpresas = 0;

      empresasSnap.docs.forEach(doc => {
        const verificacion = verificarDocumentosEmpresa(doc.data());
        sumaEmpresas += verificacion.nivelCumplimiento;
        if (verificacion.cumpleRequisitos) {
          empresasCumplen++;
        } else {
          empresasNoCumplen++;
        }
      });

      const totalEmpleados = empleadosSnap.size;
      const totalEmpresas = empresasSnap.size;

      reply.send({
        resumen: {
          empleados: {
            total: totalEmpleados,
            cumplen: empleadosCumplen,
            noCumplen: empleadosNoCumplen,
            porcentajeCumplimiento: totalEmpleados > 0
              ? Math.round((empleadosCumplen / totalEmpleados) * 100)
              : 0,
            promedioNivel: totalEmpleados > 0
              ? Math.round(sumaEmpleados / totalEmpleados)
              : 0
          },
          empresas: {
            total: totalEmpresas,
            cumplen: empresasCumplen,
            noCumplen: empresasNoCumplen,
            porcentajeCumplimiento: totalEmpresas > 0
              ? Math.round((empresasCumplen / totalEmpresas) * 100)
              : 0,
            promedioNivel: totalEmpresas > 0
              ? Math.round(sumaEmpresas / totalEmpresas)
              : 0
          }
        },
        nivelGeneralCumplimiento: (totalEmpleados + totalEmpresas) > 0
          ? Math.round((sumaEmpleados + sumaEmpresas) / (totalEmpleados + totalEmpresas))
          : 0,
        fechaGeneracion: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al generar dashboard' });
    }
  });
};
