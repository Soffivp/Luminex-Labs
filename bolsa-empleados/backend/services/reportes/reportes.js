// routes/reportes.js
const {
  serverTimestamp,
  calcularFechaInicio,
  parseFirestoreDate,
  calcularPorcentaje,
  agruparPorMes,
  generarTendenciasMensuales,
  calcularEstadisticas
} = require('./utils/functions');

module.exports = (fastify, db) => {
  // ============================================
  // REPORTES DE MATCHING
  // ============================================

  // Reporte general de matchings con filtros avanzados
  fastify.get('/reportes/matchings', async (request, reply) => {
    const {
      periodo,
      fechaInicio,
      fechaFin,
      estadoMatch,
      empresaRUC,
      minScore,
      maxScore,
      limite = 100
    } = request.query;

    try {
      let query = db.collection('matching');

      // Filtro por estado
      if (estadoMatch) {
        query = query.where('estadoMatch', '==', estadoMatch);
      }

      // Filtro por empresa
      if (empresaRUC) {
        query = query.where('empresaRUC', '==', empresaRUC);
      }

      const snapshot = await query.get();
      let matchings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filtros post-query
      // Filtro por período
      if (periodo || fechaInicio) {
        const inicio = fechaInicio ? new Date(fechaInicio) : calcularFechaInicio(periodo);
        const fin = fechaFin ? new Date(fechaFin) : new Date();

        matchings = matchings.filter(m => {
          const fecha = parseFirestoreDate(m.fechaMatching);
          return fecha && fecha >= inicio && fecha <= fin;
        });
      }

      // Filtro por score
      if (minScore) {
        matchings = matchings.filter(m => m.scoreCoincidencia >= parseFloat(minScore));
      }
      if (maxScore) {
        matchings = matchings.filter(m => m.scoreCoincidencia <= parseFloat(maxScore));
      }

      // Limitar resultados
      matchings = matchings.slice(0, parseInt(limite));

      // Calcular estadísticas
      const scores = matchings.map(m => m.scoreCoincidencia || 0);
      const estadisticasScores = calcularEstadisticas(scores);

      const resumen = {
        total: matchings.length,
        porEstado: {
          pendiente: matchings.filter(m => m.estadoMatch === 'pendiente').length,
          aprobado: matchings.filter(m => m.estadoMatch === 'aprobado').length,
          rechazado: matchings.filter(m => m.estadoMatch === 'rechazado').length,
          contratado: matchings.filter(m => m.estadoMatch === 'contratado').length,
          precargada: matchings.filter(m => m.estadoMatch === 'precargada').length
        },
        scores: estadisticasScores,
        tasaExito: calcularPorcentaje(
          matchings.filter(m => ['aprobado', 'contratado'].includes(m.estadoMatch)).length,
          matchings.length
        ),
        tasaRechazo: calcularPorcentaje(
          matchings.filter(m => m.estadoMatch === 'rechazado').length,
          matchings.length
        )
      };

      reply.send({
        filtros: { periodo, fechaInicio, fechaFin, estadoMatch, empresaRUC, minScore, maxScore },
        resumen,
        matchings,
        generadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al generar reporte de matchings' });
    }
  });

  // Matchings exitosos (aprobados y contratados)
  fastify.get('/reportes/matchings/exitosos', async (request, reply) => {
    const { periodo, empresaRUC, limite = 50 } = request.query;

    try {
      const snapshot = await db.collection('matching').get();
      let matchings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filtrar solo exitosos
      matchings = matchings.filter(m =>
        ['aprobado', 'contratado'].includes(m.estadoMatch)
      );

      // Filtro por empresa
      if (empresaRUC) {
        matchings = matchings.filter(m => m.empresaRUC === empresaRUC);
      }

      // Filtro por período
      if (periodo) {
        const fechaInicio = calcularFechaInicio(periodo);
        matchings = matchings.filter(m => {
          const fecha = parseFirestoreDate(m.fechaMatching);
          return fecha && fecha >= fechaInicio;
        });
      }

      // Ordenar por score descendente
      matchings.sort((a, b) => (b.scoreCoincidencia || 0) - (a.scoreCoincidencia || 0));

      // Limitar
      matchings = matchings.slice(0, parseInt(limite));

      // Estadísticas
      const contratados = matchings.filter(m => m.estadoMatch === 'contratado');
      const aprobados = matchings.filter(m => m.estadoMatch === 'aprobado');

      reply.send({
        total: matchings.length,
        contratados: contratados.length,
        aprobados: aprobados.length,
        tasaContratacion: calcularPorcentaje(contratados.length, matchings.length),
        promedioScore: matchings.length > 0
          ? Math.round(matchings.reduce((sum, m) => sum + (m.scoreCoincidencia || 0), 0) / matchings.length)
          : 0,
        matchings,
        generadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al obtener matchings exitosos' });
    }
  });

  // Matchings pendientes con alta compatibilidad
  fastify.get('/reportes/matchings/pendientes-alta-compatibilidad', async (request, reply) => {
    const { minScore = 80, limite = 20 } = request.query;

    try {
      const snapshot = await db.collection('matching')
        .where('estadoMatch', '==', 'pendiente')
        .get();

      let matchings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filtrar por score mínimo
      matchings = matchings.filter(m => (m.scoreCoincidencia || 0) >= parseInt(minScore));

      // Ordenar por score descendente
      matchings.sort((a, b) => (b.scoreCoincidencia || 0) - (a.scoreCoincidencia || 0));

      // Limitar
      matchings = matchings.slice(0, parseInt(limite));

      reply.send({
        total: matchings.length,
        scoreMinimo: parseInt(minScore),
        promedioScore: matchings.length > 0
          ? Math.round(matchings.reduce((sum, m) => sum + (m.scoreCoincidencia || 0), 0) / matchings.length)
          : 0,
        matchings,
        generadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al obtener matchings pendientes' });
    }
  });

  // Tendencias de matching por mes
  fastify.get('/reportes/matchings/tendencias', async (request, reply) => {
    const { meses = 6 } = request.query;

    try {
      const snapshot = await db.collection('matching').get();
      const matchings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Agrupar por mes
      const porMes = agruparPorMes(matchings, 'fechaMatching');
      const tendencias = generarTendenciasMensuales(porMes);

      // Tomar últimos N meses
      const ultimosMeses = tendencias.slice(-parseInt(meses));

      // Calcular tendencias por estado
      const tendenciasPorEstado = {};
      ultimosMeses.forEach(({ mes }) => {
        const matchingsMes = porMes[mes] || [];
        tendenciasPorEstado[mes] = {
          total: matchingsMes.length,
          exitosos: matchingsMes.filter(m => ['aprobado', 'contratado'].includes(m.estadoMatch)).length,
          rechazados: matchingsMes.filter(m => m.estadoMatch === 'rechazado').length,
          pendientes: matchingsMes.filter(m => m.estadoMatch === 'pendiente').length
        };
      });

      reply.send({
        periodoMeses: parseInt(meses),
        tendencias: ultimosMeses,
        tendenciasPorEstado,
        generadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al generar tendencias' });
    }
  });

  // ============================================
  // REPORTES DE EMPRESAS
  // ============================================

  // Reporte de empresas con estadísticas de matching
  fastify.get('/reportes/empresas', async (request, reply) => {
    const { tipo, estado, ordenarPor = 'matchings' } = request.query;

    try {
      let queryEmpresas = db.collection('empresa');

      if (tipo) {
        queryEmpresas = queryEmpresas.where('tipoEmpresa', '==', tipo);
      }
      if (estado) {
        queryEmpresas = queryEmpresas.where('estado', '==', estado);
      }

      const empresasSnapshot = await queryEmpresas.get();
      const matchingsSnapshot = await db.collection('matching').get();
      const vacantesSnapshot = await db.collection('vacante').get();

      const matchings = matchingsSnapshot.docs.map(doc => doc.data());
      const vacantes = vacantesSnapshot.docs.map(doc => doc.data());

      const empresasConStats = empresasSnapshot.docs.map(doc => {
        const empresa = { id: doc.id, ...doc.data() };
        const ruc = empresa.ruc;

        const matchingsEmpresa = matchings.filter(m => m.empresaRUC === ruc);
        const vacantesEmpresa = vacantes.filter(v => v.empresaRUC === ruc);

        return {
          id: empresa.id,
          ruc: empresa.ruc,
          razonSocial: empresa.razonSocial,
          tipoEmpresa: empresa.tipoEmpresa,
          estado: empresa.estado,
          estadisticas: {
            totalMatchings: matchingsEmpresa.length,
            matchingsExitosos: matchingsEmpresa.filter(m => ['aprobado', 'contratado'].includes(m.estadoMatch)).length,
            matchingsPendientes: matchingsEmpresa.filter(m => m.estadoMatch === 'pendiente').length,
            matchingsRechazados: matchingsEmpresa.filter(m => m.estadoMatch === 'rechazado').length,
            contrataciones: matchingsEmpresa.filter(m => m.estadoMatch === 'contratado').length,
            vacantesActivas: vacantesEmpresa.filter(v => v.estadoVacante === 'Activa').length,
            vacantesTotales: vacantesEmpresa.length,
            tasaExito: calcularPorcentaje(
              matchingsEmpresa.filter(m => ['aprobado', 'contratado'].includes(m.estadoMatch)).length,
              matchingsEmpresa.length
            ),
            promedioScore: matchingsEmpresa.length > 0
              ? Math.round(matchingsEmpresa.reduce((sum, m) => sum + (m.scoreCoincidencia || 0), 0) / matchingsEmpresa.length)
              : 0
          }
        };
      });

      // Ordenar
      if (ordenarPor === 'matchings') {
        empresasConStats.sort((a, b) => b.estadisticas.totalMatchings - a.estadisticas.totalMatchings);
      } else if (ordenarPor === 'tasaExito') {
        empresasConStats.sort((a, b) => b.estadisticas.tasaExito - a.estadisticas.tasaExito);
      } else if (ordenarPor === 'contrataciones') {
        empresasConStats.sort((a, b) => b.estadisticas.contrataciones - a.estadisticas.contrataciones);
      }

      reply.send({
        total: empresasConStats.length,
        empresas: empresasConStats,
        generadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al generar reporte de empresas' });
    }
  });

  // Top empresas por contrataciones
  fastify.get('/reportes/empresas/top-contrataciones', async (request, reply) => {
    const { limite = 10, periodo } = request.query;

    try {
      const empresasSnapshot = await db.collection('empresa').get();
      const matchingsSnapshot = await db.collection('matching')
        .where('estadoMatch', '==', 'contratado')
        .get();

      let matchings = matchingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filtro por período
      if (periodo) {
        const fechaInicio = calcularFechaInicio(periodo);
        matchings = matchings.filter(m => {
          const fecha = parseFirestoreDate(m.fechaContratacion || m.fechaMatching);
          return fecha && fecha >= fechaInicio;
        });
      }

      // Contar por empresa
      const contratacionesPorEmpresa = {};
      matchings.forEach(m => {
        const ruc = m.empresaRUC;
        if (!contratacionesPorEmpresa[ruc]) {
          contratacionesPorEmpresa[ruc] = 0;
        }
        contratacionesPorEmpresa[ruc]++;
      });

      // Crear ranking
      const empresasMap = {};
      empresasSnapshot.docs.forEach(doc => {
        const data = doc.data();
        empresasMap[data.ruc] = {
          id: doc.id,
          ruc: data.ruc,
          razonSocial: data.razonSocial,
          tipoEmpresa: data.tipoEmpresa
        };
      });

      const ranking = Object.entries(contratacionesPorEmpresa)
        .map(([ruc, contrataciones]) => ({
          ...empresasMap[ruc],
          contrataciones
        }))
        .filter(e => e.razonSocial)
        .sort((a, b) => b.contrataciones - a.contrataciones)
        .slice(0, parseInt(limite));

      reply.send({
        periodo: periodo || 'todo',
        totalContrataciones: matchings.length,
        ranking,
        generadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al generar ranking de empresas' });
    }
  });

  // ============================================
  // REPORTES DE EMPLEADOS
  // ============================================

  // Empleados más solicitados (con más matchings)
  fastify.get('/reportes/empleados/mas-solicitados', async (request, reply) => {
    const { limite = 10, minMatchings = 1 } = request.query;

    try {
      const matchingsSnapshot = await db.collection('matching').get();
      const empleadosSnapshot = await db.collection('empleado').get();

      const matchings = matchingsSnapshot.docs.map(doc => doc.data());

      // Contar matchings por empleado
      const matchingsPorEmpleado = {};
      matchings.forEach(m => {
        const cedula = m.empleadoCedula;
        if (!matchingsPorEmpleado[cedula]) {
          matchingsPorEmpleado[cedula] = {
            total: 0,
            exitosos: 0,
            pendientes: 0,
            rechazados: 0
          };
        }
        matchingsPorEmpleado[cedula].total++;
        if (['aprobado', 'contratado'].includes(m.estadoMatch)) {
          matchingsPorEmpleado[cedula].exitosos++;
        } else if (m.estadoMatch === 'pendiente') {
          matchingsPorEmpleado[cedula].pendientes++;
        } else if (m.estadoMatch === 'rechazado') {
          matchingsPorEmpleado[cedula].rechazados++;
        }
      });

      // Crear mapa de empleados
      const empleadosMap = {};
      empleadosSnapshot.docs.forEach(doc => {
        const data = doc.data();
        empleadosMap[doc.id] = {
          cedula: doc.id,
          nombres: data.nombres,
          apellidos: data.apellidos,
          nivelLaboral: data.nivelLaboral,
          estadoPublicacion: data.estadoPublicacion
        };
      });

      // Crear ranking
      const ranking = Object.entries(matchingsPorEmpleado)
        .filter(([, stats]) => stats.total >= parseInt(minMatchings))
        .map(([cedula, stats]) => ({
          ...empleadosMap[cedula],
          ...stats,
          tasaExito: calcularPorcentaje(stats.exitosos, stats.total)
        }))
        .filter(e => e.nombres)
        .sort((a, b) => b.total - a.total)
        .slice(0, parseInt(limite));

      reply.send({
        total: ranking.length,
        ranking,
        generadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al generar reporte de empleados' });
    }
  });

  // ============================================
  // REPORTES DE VACANTES
  // ============================================

  // Vacantes con más matchings
  fastify.get('/reportes/vacantes/mas-demandadas', async (request, reply) => {
    const { limite = 10, soloActivas = true } = request.query;

    try {
      const matchingsSnapshot = await db.collection('matching').get();
      const vacantesSnapshot = await db.collection('vacante').get();

      const matchings = matchingsSnapshot.docs.map(doc => doc.data());

      // Contar matchings por vacante
      const matchingsPorVacante = {};
      matchings.forEach(m => {
        const vacanteId = m.vacanteId;
        if (!matchingsPorVacante[vacanteId]) {
          matchingsPorVacante[vacanteId] = {
            total: 0,
            exitosos: 0,
            contratados: 0
          };
        }
        matchingsPorVacante[vacanteId].total++;
        if (['aprobado', 'contratado'].includes(m.estadoMatch)) {
          matchingsPorVacante[vacanteId].exitosos++;
        }
        if (m.estadoMatch === 'contratado') {
          matchingsPorVacante[vacanteId].contratados++;
        }
      });

      // Crear mapa de vacantes
      const vacantesMap = {};
      vacantesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        vacantesMap[doc.id] = {
          id: doc.id,
          tituloCargo: data.tituloCargo,
          empresaRUC: data.empresaRUC,
          empresaNombre: data.empresaNombre,
          estadoVacante: data.estadoVacante,
          nivelLaboralRequerido: data.nivelLaboralRequerido
        };
      });

      // Crear ranking
      let ranking = Object.entries(matchingsPorVacante)
        .map(([vacanteId, stats]) => ({
          ...vacantesMap[vacanteId],
          ...stats,
          tasaExito: calcularPorcentaje(stats.exitosos, stats.total)
        }))
        .filter(v => v.tituloCargo);

      // Filtrar solo activas si se solicita
      if (soloActivas === 'true' || soloActivas === true) {
        ranking = ranking.filter(v => v.estadoVacante === 'Activa');
      }

      ranking = ranking
        .sort((a, b) => b.total - a.total)
        .slice(0, parseInt(limite));

      reply.send({
        total: ranking.length,
        ranking,
        generadoEn: serverTimestamp()
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al generar reporte de vacantes' });
    }
  });

  // ============================================
  // DASHBOARD GENERAL
  // ============================================

  // Dashboard resumen ejecutivo
  fastify.get('/reportes/dashboard', async (request, reply) => {
    const { periodo = 'mes' } = request.query;

    try {
      const fechaInicio = calcularFechaInicio(periodo);

      // Obtener todos los datos
      const [empresasSnap, empleadosSnap, vacantesSnap, matchingsSnap] = await Promise.all([
        db.collection('empresa').get(),
        db.collection('empleado').get(),
        db.collection('vacante').get(),
        db.collection('matching').get()
      ]);

      const empresas = empresasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const empleados = empleadosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const vacantes = vacantesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      let matchings = matchingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filtrar matchings por período
      const matchingsPeriodo = matchings.filter(m => {
        const fecha = parseFirestoreDate(m.fechaMatching);
        return fecha && fecha >= fechaInicio;
      });

      // Calcular métricas
      const dashboard = {
        periodo,
        fechaInicio: fechaInicio.toISOString(),
        metricas: {
          empresas: {
            total: empresas.length,
            activas: empresas.filter(e => e.estado === 'Activa').length,
            emisoras: empresas.filter(e => e.tipoEmpresa === 'Emisora').length,
            receptoras: empresas.filter(e => e.tipoEmpresa === 'Receptora').length
          },
          empleados: {
            total: empleados.length,
            publicados: empleados.filter(e => e.estadoPublicacion === 'Publicado').length,
            disponibles: empleados.filter(e => e.estadoDisponibilidad === 'Disponible').length
          },
          vacantes: {
            total: vacantes.length,
            activas: vacantes.filter(v => v.estadoVacante === 'Activa').length,
            cerradas: vacantes.filter(v => v.estadoVacante === 'Cerrada').length
          },
          matchings: {
            totalHistorico: matchings.length,
            enPeriodo: matchingsPeriodo.length,
            pendientes: matchings.filter(m => m.estadoMatch === 'pendiente').length,
            aprobados: matchings.filter(m => m.estadoMatch === 'aprobado').length,
            contratados: matchings.filter(m => m.estadoMatch === 'contratado').length,
            rechazados: matchings.filter(m => m.estadoMatch === 'rechazado').length,
            tasaExito: calcularPorcentaje(
              matchings.filter(m => ['aprobado', 'contratado'].includes(m.estadoMatch)).length,
              matchings.length
            ),
            promedioScore: matchings.length > 0
              ? Math.round(matchings.reduce((sum, m) => sum + (m.scoreCoincidencia || 0), 0) / matchings.length)
              : 0
          }
        },
        alertas: {
          matchingsPendientesAltos: matchings.filter(m =>
            m.estadoMatch === 'pendiente' && (m.scoreCoincidencia || 0) >= 80
          ).length,
          vacantessinMatchings: vacantes.filter(v =>
            v.estadoVacante === 'Activa' && !matchings.some(m => m.vacanteId === v.id)
          ).length
        },
        generadoEn: serverTimestamp()
      };

      reply.send(dashboard);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al generar dashboard' });
    }
  });

  // ============================================
  // EXPORTACIÓN DE DATOS
  // ============================================

  // Exportar matchings a formato JSON estructurado
  fastify.get('/reportes/exportar/matchings', async (request, reply) => {
    const { formato = 'json', estadoMatch, empresaRUC, fechaInicio, fechaFin } = request.query;

    try {
      let query = db.collection('matching');

      if (estadoMatch) {
        query = query.where('estadoMatch', '==', estadoMatch);
      }
      if (empresaRUC) {
        query = query.where('empresaRUC', '==', empresaRUC);
      }

      const snapshot = await query.get();
      let matchings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filtros de fecha
      if (fechaInicio || fechaFin) {
        const inicio = fechaInicio ? new Date(fechaInicio) : new Date(0);
        const fin = fechaFin ? new Date(fechaFin) : new Date();

        matchings = matchings.filter(m => {
          const fecha = parseFirestoreDate(m.fechaMatching);
          return fecha && fecha >= inicio && fecha <= fin;
        });
      }

      if (formato === 'csv') {
        // Generar CSV
        const headers = ['ID', 'Empleado', 'Vacante', 'Empresa', 'Score', 'Estado', 'Fecha'];
        const rows = matchings.map(m => [
          m.id,
          m.empleadoNombre || m.empleadoCedula,
          m.vacanteTitulo,
          m.empresaRUC,
          m.scoreCoincidencia,
          m.estadoMatch,
          parseFirestoreDate(m.fechaMatching)?.toISOString() || ''
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', 'attachment; filename="matchings.csv"');
        return reply.send(csv);
      }

      // Por defecto JSON
      reply.send({
        total: matchings.length,
        exportadoEn: serverTimestamp(),
        datos: matchings
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error al exportar datos' });
    }
  });
};
