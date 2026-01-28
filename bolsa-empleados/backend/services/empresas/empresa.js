// empresa.js
const { generarPasswordSeguro, hashearPassword, serverTimestamp } = require('./utils/functions');
const crypto = require('crypto');

/**
 * Genera ID único para usuarios
 */
function generarUserId() {
  return `USR-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

module.exports = (fastify, db) => {
  // Colección de usuarios (para autenticación)
  const usersCollection = db.collection('users');
  const empresaCollection = db.collection('empresa');

  // Listar todas las empresas
  fastify.get('/empresas', async (request, reply) => {
    const snapshot = await empresaCollection.get();
    const empresas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reply.send(empresas);
  });

  // Obtener empresa por RUC
  fastify.get('/empresas/:ruc', async (request, reply) => {
    const { ruc } = request.params;
    const docRef = empresaCollection.doc(String(ruc));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Empresa no encontrada' });
    }

    reply.send({ id: doc.id, ...doc.data() });
  });

  // Crear nueva empresa (también crea usuario para login)
  fastify.post('/empresas', async (request, reply) => {
    const data = request.body;

    // Validaciones requeridas
    if (!data.ruc) {
      return reply.code(400).send({ error: 'El campo ruc es obligatorio' });
    }
    if (!data.razonSocial) {
      return reply.code(400).send({ error: 'El campo razonSocial es obligatorio' });
    }
    if (!data.email) {
      return reply.code(400).send({ error: 'El campo email es obligatorio' });
    }
    if (!data.cedulaRepresentante) {
      return reply.code(400).send({ error: 'El campo cedulaRepresentante es obligatorio' });
    }
    if (!data.nombreRepresentante) {
      return reply.code(400).send({ error: 'El campo nombreRepresentante es obligatorio' });
    }

    // Verificar si ya existe la empresa
    const existingDoc = await empresaCollection.doc(String(data.ruc)).get();
    if (existingDoc.exists) {
      return reply.code(409).send({ error: 'Ya existe una empresa con este RUC' });
    }

    // Verificar si ya existe un usuario con esa cédula
    const existingUser = await usersCollection.where('cedula', '==', data.cedulaRepresentante).get();
    if (!existingUser.empty) {
      return reply.code(409).send({ error: 'Ya existe un usuario con esta cédula' });
    }

    // Generar contraseña
    const passwordPlano = data.password || generarPasswordSeguro(12);
    const passwordHash = await hashearPassword(passwordPlano);

    // Crear usuario para autenticación
    const userId = generarUserId();
    const fechaActual = new Date().toISOString();

    const userData = {
      id: userId,
      cedula: data.cedulaRepresentante,
      nombre: data.nombreRepresentante,
      email: data.email,
      password: passwordHash,
      tipoUsuario: 'empresa',
      empresaRUC: data.ruc,
      activo: true,
      primerLogin: true,
      fechaCreacion: fechaActual,
      fechaActualizacion: fechaActual,
      creadoPor: data.creadoPor || 'SISTEMA',
      ultimoLogin: null
    };

    // Preparar documento de empresa
    const empresaData = {
      ruc: data.ruc,
      razonSocial: data.razonSocial,
      direccion: data.direccion || '',
      telefono: data.telefono || '',
      email: data.email,
      sectorIndustrial: data.sectorIndustrial || '',
      actividad: data.actividad || 0,
      idAdministrador: data.idAdministrador || null,
      cedulaRepresentante: data.cedulaRepresentante,
      nombreRepresentante: data.nombreRepresentante,
      usuarioId: userId,
      estado: 'activo',
      fechaRegistro: serverTimestamp(),
      fechaActualizacion: serverTimestamp()
    };

    // Guardar ambos documentos
    const batch = db.batch();
    batch.set(empresaCollection.doc(String(data.ruc)), empresaData);
    batch.set(usersCollection.doc(userId), userData);
    await batch.commit();

    reply.code(201).send({
      id: data.ruc,
      usuarioId: userId,
      mensaje: 'Empresa y usuario creados exitosamente',
      credenciales: {
        cedula: data.cedulaRepresentante,
        password: passwordPlano,
        nota: 'Guarde esta contraseña, no se mostrará nuevamente'
      }
    });
  });

  // Actualizar empresa
  fastify.patch('/empresas/:ruc', async (request, reply) => {
    const { ruc } = request.params;
    const data = request.body;

    // Verificar que existe
    const docRef = empresaCollection.doc(String(ruc));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Empresa no encontrada' });
    }

    // Campos permitidos para actualizar
    const camposPermitidos = ['razonSocial', 'direccion', 'telefono', 'email', 'sectorIndustrial', 'actividad', 'idAdministrador', 'estado'];
    const actualizacion = {};

    for (const campo of camposPermitidos) {
      if (data[campo] !== undefined) {
        actualizacion[campo] = data[campo];
      }
    }

    actualizacion.fechaActualizacion = serverTimestamp();

    await docRef.update(actualizacion);

    // Si se actualiza el email, también actualizar en users
    if (data.email) {
      const empresaData = doc.data();
      if (empresaData.usuarioId) {
        await usersCollection.doc(empresaData.usuarioId).update({
          email: data.email,
          fechaActualizacion: new Date().toISOString()
        });
      }
    }

    reply.code(200).send({
      id: ruc,
      mensaje: 'Empresa actualizada exitosamente',
      actualizado: true
    });
  });

  // Actualizar contraseña de empresa (también actualiza en users)
  fastify.patch('/empresas/:ruc/password', async (request, reply) => {
    const { ruc } = request.params;
    const { nuevaPassword } = request.body;

    const docRef = empresaCollection.doc(String(ruc));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Empresa no encontrada' });
    }

    const empresaData = doc.data();
    const password = nuevaPassword || generarPasswordSeguro(12);
    const passwordHash = await hashearPassword(password);

    // Actualizar en users si existe el usuario asociado
    if (empresaData.usuarioId) {
      await usersCollection.doc(empresaData.usuarioId).update({
        password: passwordHash,
        primerLogin: true,
        fechaActualizacion: new Date().toISOString()
      });
    }

    await docRef.update({
      fechaActualizacion: serverTimestamp()
    });

    reply.code(200).send({
      id: ruc,
      mensaje: 'Contraseña actualizada',
      passwordGenerado: password
    });
  });

  // Eliminar empresa (también elimina usuario asociado)
  fastify.delete('/empresas/:ruc', async (request, reply) => {
    const { ruc } = request.params;

    const docRef = empresaCollection.doc(String(ruc));
    const doc = await docRef.get();

    if (!doc.exists) {
      return reply.code(404).send({ error: 'Empresa no encontrada' });
    }

    const empresaData = doc.data();

    // Eliminar usuario asociado si existe
    const batch = db.batch();
    batch.delete(docRef);

    if (empresaData.usuarioId) {
      batch.delete(usersCollection.doc(empresaData.usuarioId));
    }

    await batch.commit();

    reply.code(200).send({
      id: ruc,
      mensaje: 'Empresa y usuario eliminados exitosamente',
      eliminado: true
    });
  });

  // Buscar empresas por sector
  fastify.get('/empresas/sector/:sector', async (request, reply) => {
    const { sector } = request.params;
    const snapshot = await empresaCollection
      .where('sectorIndustrial', '==', sector)
      .get();

    const empresas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    reply.send(empresas);
  });

  // Agregar usuario adicional a una empresa
  fastify.post('/empresas/:ruc/usuarios', async (request, reply) => {
    const { ruc } = request.params;
    const data = request.body;

    // Verificar que la empresa existe
    const empresaDoc = await empresaCollection.doc(String(ruc)).get();
    if (!empresaDoc.exists) {
      return reply.code(404).send({ error: 'Empresa no encontrada' });
    }

    // Validaciones
    if (!data.cedula) {
      return reply.code(400).send({ error: 'El campo cedula es obligatorio' });
    }
    if (!data.nombre) {
      return reply.code(400).send({ error: 'El campo nombre es obligatorio' });
    }
    if (!data.email) {
      return reply.code(400).send({ error: 'El campo email es obligatorio' });
    }

    // Verificar si ya existe usuario con esa cédula
    const existingUser = await usersCollection.where('cedula', '==', data.cedula).get();
    if (!existingUser.empty) {
      return reply.code(409).send({ error: 'Ya existe un usuario con esta cédula' });
    }

    // Generar contraseña y crear usuario
    const passwordPlano = data.password || generarPasswordSeguro(12);
    const passwordHash = await hashearPassword(passwordPlano);
    const userId = generarUserId();
    const fechaActual = new Date().toISOString();

    const userData = {
      id: userId,
      cedula: data.cedula,
      nombre: data.nombre,
      email: data.email,
      password: passwordHash,
      tipoUsuario: 'empresa',
      empresaRUC: ruc,
      rol: data.rol || 'usuario',
      activo: true,
      primerLogin: true,
      fechaCreacion: fechaActual,
      fechaActualizacion: fechaActual,
      creadoPor: data.creadoPor || 'EMPRESA',
      ultimoLogin: null
    };

    await usersCollection.doc(userId).set(userData);

    reply.code(201).send({
      id: userId,
      mensaje: 'Usuario de empresa creado exitosamente',
      credenciales: {
        cedula: data.cedula,
        password: passwordPlano,
        nota: 'Guarde esta contraseña, no se mostrará nuevamente'
      }
    });
  });

  // Listar usuarios de una empresa
  fastify.get('/empresas/:ruc/usuarios', async (request, reply) => {
    const { ruc } = request.params;

    // Verificar que la empresa existe
    const empresaDoc = await empresaCollection.doc(String(ruc)).get();
    if (!empresaDoc.exists) {
      return reply.code(404).send({ error: 'Empresa no encontrada' });
    }

    // Obtener usuarios de la empresa
    const usersSnapshot = await usersCollection
      .where('empresaRUC', '==', ruc)
      .get();

    const usuarios = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      // No devolver password
      const { password, ...safeData } = data;
      return safeData;
    });

    reply.send(usuarios);
  });
};
