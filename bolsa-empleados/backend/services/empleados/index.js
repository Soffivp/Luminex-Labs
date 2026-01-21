'use strict';

const fastify = require('fastify')({ logger: true });
const admin = require('firebase-admin');

// 🔹 Helpers Firestore
const { getNextSequentialId, serverTimestamp } = require('./functions');

// 🔹 Inicializar Firebase
admin.initializeApp();
const db = admin.firestore();

// 🔹 Puerto compatible con Cloud Run
const PORT = process.env.PORT || 8080;

/* =========================
   HEALTH CHECK
========================= */
fastify.get('/health', async () => ({
  ok: true,
  service: 'empleados'
}));

/* =========================
   EMPLEADOS
========================= */

// Listar empleados
fastify.get('/empleados', async () => {
  const snapshot = await db.collection('empleado').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

// Actualizar empleado
fastify.patch('/empleados/:cedula', async (request) => {
  const { cedula } = request.params;

  await db
    .collection('empleado')
    .doc(String(cedula))
    .set(request.body, { merge: true });

  return { id: cedula, actualizado: true };
});

// Eliminar empleado
fastify.delete('/empleados/:cedula', async (request) => {
  const { cedula } = request.params;

  await db
    .collection('empleado')
    .doc(String(cedula))
    .delete();

  return { id: cedula, eliminado: true };
});

// Crear perfil completo
fastify.post('/empleados/perfil-completo', async (request, reply) => {
  const data = request.body;

  if (!data.cedula) {
    return reply.code(400).send({ error: 'El campo cedula es obligatorio' });
  }

  const { historiaLaboral, competencias, ...datosEmpleado } = data;
  const cedula = String(data.cedula);

  if (!datosEmpleado.fechaPublicacion) {
    datosEmpleado.fechaPublicacion = serverTimestamp();
  }

  const empleadoRef = db.collection('empleado').doc(cedula);
  await empleadoRef.set(datosEmpleado, { merge: true });

  // Historial laboral
  if (historiaLaboral) {
    let idHistorial = historiaLaboral.idHistoriaLaboral;

    if (!idHistorial) {
      idHistorial = await getNextSequentialId(
        db,
        `empleado/${cedula}/historialLaboral`,
        'hist',
        3
      );
      historiaLaboral.idHistoriaLaboral = idHistorial;
    }

    if (!historiaLaboral.fechaIngreso) {
      historiaLaboral.fechaIngreso = serverTimestamp();
    }

    await empleadoRef
      .collection('historialLaboral')
      .doc(idHistorial)
      .set(historiaLaboral, { merge: true });
  }

  // Competencias
  if (competencias) {
    let idCompetencias = competencias.idCompetencias;

    if (!idCompetencias) {
      idCompetencias = await getNextSequentialId(
        db,
        `empleado/${cedula}/competencias`,
        'comp',
        3
      );
      competencias.idCompetencias = idCompetencias;
    }

    await empleadoRef
      .collection('competencias')
      .doc(idCompetencias)
      .set(competencias, { merge: true });
  }

  return {
    idEmpleado: cedula,
    creadoHistorial: !!historiaLaboral,
    creadoCompetencias: !!competencias
  };
});

/* =========================
   HISTORIAL LABORAL
========================= */

// Obtener historial laboral
fastify.get('/empleados/:cedula/historial-laboral', async (request) => {
  const { cedula } = request.params;

  const snapshot = await db
    .collection('empleado')
    .doc(String(cedula))
    .collection('historialLaboral')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

// Actualizar historial laboral
fastify.patch('/empleados/:cedula/historial-laboral/:idHistorial', async (request) => {
  const { cedula, idHistorial } = request.params;

  await db
    .collection('empleado')
    .doc(String(cedula))
    .collection('historialLaboral')
    .doc(String(idHistorial))
    .set(request.body, { merge: true });

  return { idHistorial, actualizado: true };
});

// Eliminar historial laboral
fastify.delete('/empleados/:cedula/historial-laboral/:idHistorial', async (request) => {
  const { cedula, idHistorial } = request.params;

  await db
    .collection('empleado')
    .doc(String(cedula))
    .collection('historialLaboral')
    .doc(String(idHistorial))
    .delete();

  return { idHistorial, eliminado: true };
});

/* =========================
   COMPETENCIAS
========================= */

// Obtener competencias
fastify.get('/empleados/:cedula/competencias', async (request) => {
  const { cedula } = request.params;

  const snapshot = await db
    .collection('empleado')
    .doc(String(cedula))
    .collection('competencias')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

// Actualizar competencias
fastify.patch('/empleados/:cedula/competencias/:idCompetencias', async (request) => {
  const { cedula, idCompetencias } = request.params;

  await db
    .collection('empleado')
    .doc(String(cedula))
    .collection('competencias')
    .doc(String(idCompetencias))
    .set(request.body, { merge: true });

  return { idCompetencias, actualizado: true };
});

// Eliminar competencias
fastify.delete('/empleados/:cedula/competencias/:idCompetencias', async (request) => {
  const { cedula, idCompetencias } = request.params;

  await db
    .collection('empleado')
    .doc(String(cedula))
    .collection('competencias')
    .doc(String(idCompetencias))
    .delete();

  return { idCompetencias, eliminado: true };
});

/* =========================
   START SERVER
========================= */
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 empleados-service corriendo en ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
