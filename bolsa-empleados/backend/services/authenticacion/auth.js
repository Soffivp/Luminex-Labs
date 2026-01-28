const bcrypt = require('bcryptjs');
const {
  serverTimestamp,
  generarTokens,
  generarPassword,
  validarPassword
} = require('./utils/functions');

module.exports = function (fastify, db) {
  const usersCollection = db.collection('users');
  const sessionsCollection = db.collection('sessions');
  const empleadoCollection = db.collection('empleado');
  const empresaCollection = db.collection('empresa');

  // ============================================
  // MIDDLEWARE: Verificar rol de administrador
  // ============================================
  const verificarAdmin = async (request, reply) => {
    try {
      await request.jwtVerify();
      if (request.user.tipoUsuario !== 'administrador') {
        return reply.status(403).send({ error: 'Acceso denegado. Se requiere rol de administrador.' });
      }
    } catch (err) {
      return reply.status(401).send({ error: 'Token inválido o expirado' });
    }
  };

  // ============================================
  // CREAR USUARIO (Solo Admin)
  // ============================================
  fastify.post('/auth/usuarios', {
    preHandler: verificarAdmin,
    schema: {
      body: {
        type: 'object',
        required: ['cedula', 'nombre', 'tipoUsuario'],
        properties: {
          cedula: { type: 'string', minLength: 10, maxLength: 13 },
          nombre: { type: 'string', minLength: 2 },
          email: { type: 'string', format: 'email' },
          tipoUsuario: { type: 'string', enum: ['empleado', 'empresa', 'administrador'] },
          empresaRUC: { type: 'string' },
          password: { type: 'string' },
          longitudPassword: { type: 'number', minimum: 8, maximum: 20 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const {
        cedula,
        nombre,
        email,
        tipoUsuario,
        empresaRUC,
        password: customPassword,
        longitudPassword = 12
      } = request.body;

      // Verificar si el usuario ya existe por cédula
      const existingUser = await usersCollection.where('cedula', '==', cedula).get();
      if (!existingUser.empty) {
        return reply.status(409).send({ error: 'Ya existe un usuario con esta cédula' });
      }

      // Si es empleado, verificar que exista en la colección de empleados
      if (tipoUsuario === 'empleado') {
        const empleadoSnapshot = await empleadoCollection.where('cedula', '==', cedula).get();
        if (empleadoSnapshot.empty) {
          return reply.status(404).send({
            error: 'No existe un empleado registrado con esta cédula. Primero debe registrar al empleado.'
          });
        }
      }

      // Si es empresa, verificar que exista y que la cédula pertenezca a la empresa
      if (tipoUsuario === 'empresa') {
        if (!empresaRUC) {
          return reply.status(400).send({ error: 'El RUC de la empresa es requerido' });
        }
        const empresaSnapshot = await empresaCollection.doc(empresaRUC).get();
        if (!empresaSnapshot.exists) {
          return reply.status(404).send({
            error: 'No existe una empresa registrada con este RUC'
          });
        }
      }

      // Generar o usar contraseña personalizada
      const passwordPlano = customPassword || generarPassword(longitudPassword);

      // Validar contraseña si es personalizada
      if (customPassword) {
        const passwordValidation = validarPassword(customPassword);
        if (!passwordValidation.valido) {
          return reply.status(400).send({ error: passwordValidation.mensaje });
        }
      }

      const hashedPassword = await bcrypt.hash(passwordPlano, 12);

      // Crear usuario
      const userId = `USR-${Date.now()}`;
      const userData = {
        id: userId,
        cedula,
        nombre,
        email: email ? email.toLowerCase() : null,
        password: hashedPassword,
        tipoUsuario,
        empresaRUC: empresaRUC || null,
        activo: true,
        primerLogin: true,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        creadoPor: request.user.id,
        ultimoLogin: null
      };

      await usersCollection.doc(userId).set(userData);

      // Retornar usuario con contraseña en texto plano (solo esta vez)
      const { password: _, ...userWithoutPassword } = userData;

      return reply.status(201).send({
        mensaje: 'Usuario creado exitosamente',
        usuario: userWithoutPassword,
        credenciales: {
          cedula,
          passwordTemporal: passwordPlano,
          nota: 'Guarde esta contraseña. El usuario deberá cambiarla en su primer inicio de sesión.'
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al crear usuario' });
    }
  });

  // ============================================
  // LISTAR USUARIOS (Solo Admin)
  // ============================================
  fastify.get('/auth/usuarios', {
    preHandler: verificarAdmin
  }, async (request, reply) => {
    try {
      const { tipoUsuario, empresaRUC, activo } = request.query;

      let query = usersCollection;

      if (tipoUsuario) {
        query = query.where('tipoUsuario', '==', tipoUsuario);
      }

      const snapshot = await query.get();

      let usuarios = snapshot.docs.map(doc => {
        const data = doc.data();
        const { password, ...userWithoutPassword } = data;
        return userWithoutPassword;
      });

      // Filtros adicionales
      if (empresaRUC) {
        usuarios = usuarios.filter(u => u.empresaRUC === empresaRUC);
      }
      if (activo !== undefined) {
        usuarios = usuarios.filter(u => u.activo === (activo === 'true'));
      }

      return reply.send(usuarios);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al listar usuarios' });
    }
  });

  // ============================================
  // OBTENER USUARIO POR ID (Solo Admin)
  // ============================================
  fastify.get('/auth/usuarios/:id', {
    preHandler: verificarAdmin
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      const userDoc = await usersCollection.doc(id).get();

      if (!userDoc.exists) {
        return reply.status(404).send({ error: 'Usuario no encontrado' });
      }

      const { password, ...userWithoutPassword } = userDoc.data();

      return reply.send(userWithoutPassword);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al obtener usuario' });
    }
  });

  // ============================================
  // ACTUALIZAR USUARIO (Solo Admin)
  // ============================================
  fastify.patch('/auth/usuarios/:id', {
    preHandler: verificarAdmin,
    schema: {
      body: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          email: { type: 'string', format: 'email' },
          activo: { type: 'boolean' },
          empresaRUC: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updates = request.body;

      const userDoc = await usersCollection.doc(id).get();

      if (!userDoc.exists) {
        return reply.status(404).send({ error: 'Usuario no encontrado' });
      }

      const updateData = {
        ...updates,
        fechaActualizacion: serverTimestamp(),
        actualizadoPor: request.user.id
      };

      if (updates.email) {
        updateData.email = updates.email.toLowerCase();
      }

      await usersCollection.doc(id).update(updateData);

      return reply.send({ mensaje: 'Usuario actualizado exitosamente' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al actualizar usuario' });
    }
  });

  // ============================================
  // RESETEAR CONTRASEÑA (Solo Admin)
  // ============================================
  fastify.post('/auth/usuarios/:id/resetear-password', {
    preHandler: verificarAdmin,
    schema: {
      body: {
        type: 'object',
        properties: {
          password: { type: 'string' },
          longitudPassword: { type: 'number', minimum: 8, maximum: 20 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { password: customPassword, longitudPassword = 12 } = request.body || {};

      const userDoc = await usersCollection.doc(id).get();

      if (!userDoc.exists) {
        return reply.status(404).send({ error: 'Usuario no encontrado' });
      }

      const passwordPlano = customPassword || generarPassword(longitudPassword);

      if (customPassword) {
        const passwordValidation = validarPassword(customPassword);
        if (!passwordValidation.valido) {
          return reply.status(400).send({ error: passwordValidation.mensaje });
        }
      }

      const hashedPassword = await bcrypt.hash(passwordPlano, 12);

      await usersCollection.doc(id).update({
        password: hashedPassword,
        primerLogin: true,
        fechaActualizacion: serverTimestamp()
      });

      // Invalidar todas las sesiones del usuario
      const sessionsSnapshot = await sessionsCollection.where('userId', '==', id).get();
      const batch = db.batch();
      sessionsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      return reply.send({
        mensaje: 'Contraseña reseteada exitosamente',
        credenciales: {
          passwordTemporal: passwordPlano,
          nota: 'El usuario deberá cambiar esta contraseña en su próximo inicio de sesión.'
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al resetear contraseña' });
    }
  });

  // ============================================
  // DESACTIVAR/ACTIVAR USUARIO (Solo Admin)
  // ============================================
  fastify.patch('/auth/usuarios/:id/estado', {
    preHandler: verificarAdmin,
    schema: {
      body: {
        type: 'object',
        required: ['activo'],
        properties: {
          activo: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { activo } = request.body;

      const userDoc = await usersCollection.doc(id).get();

      if (!userDoc.exists) {
        return reply.status(404).send({ error: 'Usuario no encontrado' });
      }

      await usersCollection.doc(id).update({
        activo,
        fechaActualizacion: serverTimestamp()
      });

      // Si se desactiva, cerrar todas las sesiones
      if (!activo) {
        const sessionsSnapshot = await sessionsCollection.where('userId', '==', id).get();
        const batch = db.batch();
        sessionsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      return reply.send({
        mensaje: activo ? 'Usuario activado' : 'Usuario desactivado'
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al cambiar estado del usuario' });
    }
  });

  // ============================================
  // LOGIN CON CÉDULA Y CONTRASEÑA
  // ============================================
  fastify.post('/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['cedula', 'password'],
        properties: {
          cedula: { type: 'string' },
          password: { type: 'string' }
        }
      }
    },
    config: {
      rateLimit: {
        max: 5, // Máximo 5 intentos de login
        timeWindow: '1 minute' // Por minuto
      }
    }
  }, async (request, reply) => {
    try {
      const { cedula, password } = request.body;

      // Buscar usuario por cédula
      const userSnapshot = await usersCollection.where('cedula', '==', cedula).get();

      if (userSnapshot.empty) {
        return reply.status(401).send({ error: 'Credenciales inválidas' });
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();

      // Verificar si está activo
      if (!userData.activo) {
        return reply.status(403).send({ error: 'Usuario desactivado. Contacte al administrador.' });
      }

      // Verificar password
      const passwordValid = await bcrypt.compare(password, userData.password);
      if (!passwordValid) {
        return reply.status(401).send({ error: 'Credenciales inválidas' });
      }

      // Si es usuario de empresa, verificar que la empresa siga activa
      if (userData.tipoUsuario === 'empresa' && userData.empresaRUC) {
        const empresaDoc = await empresaCollection.doc(userData.empresaRUC).get();
        if (!empresaDoc.exists) {
          return reply.status(403).send({ error: 'La empresa asociada no existe' });
        }
        const empresaData = empresaDoc.data();
        if (empresaData.estado === 'Inactiva') {
          return reply.status(403).send({ error: 'La empresa está inactiva. Contacte al administrador.' });
        }
      }

      // Si es empleado, verificar que siga registrado
      if (userData.tipoUsuario === 'empleado') {
        const empleadoSnapshot = await empleadoCollection.where('cedula', '==', cedula).get();
        if (empleadoSnapshot.empty) {
          return reply.status(403).send({ error: 'No se encontró registro de empleado asociado' });
        }
      }

      // Actualizar último login
      await usersCollection.doc(userDoc.id).update({
        ultimoLogin: serverTimestamp()
      });

      // Generar tokens
      const tokens = await generarTokens(fastify, {
        id: userData.id,
        cedula: userData.cedula,
        tipoUsuario: userData.tipoUsuario,
        empresaRUC: userData.empresaRUC
      });

      // Guardar sesión
      await sessionsCollection.doc(tokens.sessionId).set({
        userId: userData.id,
        refreshToken: tokens.refreshToken,
        userAgent: request.headers['user-agent'] || 'unknown',
        ip: request.ip,
        fechaCreacion: serverTimestamp(),
        fechaExpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      const { password: _, ...userWithoutPassword } = userData;

      return reply.send({
        mensaje: 'Login exitoso',
        usuario: userWithoutPassword,
        primerLogin: userData.primerLogin,
        ...tokens
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error en el login' });
    }
  });

  // ============================================
  // CAMBIAR CONTRASEÑA (Usuario autenticado)
  // ============================================
  fastify.patch('/auth/cambiar-password', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({ error: 'Token inválido o expirado' });
      }
    },
    schema: {
      body: {
        type: 'object',
        required: ['passwordActual', 'passwordNuevo'],
        properties: {
          passwordActual: { type: 'string' },
          passwordNuevo: { type: 'string', minLength: 8 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.user;
      const { passwordActual, passwordNuevo } = request.body;

      // Validar nueva contraseña
      const passwordValidation = validarPassword(passwordNuevo);
      if (!passwordValidation.valido) {
        return reply.status(400).send({ error: passwordValidation.mensaje });
      }

      const userDoc = await usersCollection.doc(id).get();

      if (!userDoc.exists) {
        return reply.status(404).send({ error: 'Usuario no encontrado' });
      }

      const userData = userDoc.data();

      // Verificar contraseña actual
      const passwordValid = await bcrypt.compare(passwordActual, userData.password);
      if (!passwordValid) {
        return reply.status(400).send({ error: 'Contraseña actual incorrecta' });
      }

      // Actualizar contraseña
      const hashedPassword = await bcrypt.hash(passwordNuevo, 12);
      await usersCollection.doc(id).update({
        password: hashedPassword,
        primerLogin: false,
        fechaActualizacion: serverTimestamp()
      });

      return reply.send({ mensaje: 'Contraseña cambiada exitosamente' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al cambiar contraseña' });
    }
  });

  // ============================================
  // OBTENER USUARIO ACTUAL
  // ============================================
  fastify.get('/auth/me', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send({ error: 'Token inválido o expirado' });
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.user;

      const userDoc = await usersCollection.doc(id).get();

      if (!userDoc.exists) {
        return reply.status(404).send({ error: 'Usuario no encontrado' });
      }

      const userData = userDoc.data();
      const { password: _, ...userWithoutPassword } = userData;

      // Agregar información adicional según tipo
      let infoAdicional = {};

      if (userData.tipoUsuario === 'empleado') {
        const empleadoSnapshot = await empleadoCollection.where('cedula', '==', userData.cedula).get();
        if (!empleadoSnapshot.empty) {
          infoAdicional.empleado = empleadoSnapshot.docs[0].data();
        }
      }

      if (userData.tipoUsuario === 'empresa' && userData.empresaRUC) {
        const empresaDoc = await empresaCollection.doc(userData.empresaRUC).get();
        if (empresaDoc.exists) {
          infoAdicional.empresa = empresaDoc.data();
        }
      }

      return reply.send({
        ...userWithoutPassword,
        ...infoAdicional
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al obtener usuario' });
    }
  });

  // ============================================
  // LOGOUT
  // ============================================
  fastify.post('/auth/logout', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        // Permitir logout aunque el token sea inválido
      }
    }
  }, async (request, reply) => {
    try {
      const { sessionId } = request.body || {};

      if (sessionId) {
        await sessionsCollection.doc(sessionId).delete();
      }

      reply.clearCookie('refreshToken');

      return reply.send({ mensaje: 'Logout exitoso' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error en logout' });
    }
  });

  // ============================================
  // REFRESH TOKEN
  // ============================================
  fastify.post('/auth/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' }
        }
      }
    },
    config: {
      rateLimit: {
        max: 10, // Máximo 10 refreshes
        timeWindow: '1 minute' // Por minuto
      }
    }
  }, async (request, reply) => {
    try {
      const { refreshToken } = request.body;

      const sessionSnapshot = await sessionsCollection
        .where('refreshToken', '==', refreshToken)
        .get();

      if (sessionSnapshot.empty) {
        return reply.status(401).send({ error: 'Refresh token inválido' });
      }

      const sessionDoc = sessionSnapshot.docs[0];
      const sessionData = sessionDoc.data();

      if (new Date(sessionData.fechaExpiracion) < new Date()) {
        await sessionsCollection.doc(sessionDoc.id).delete();
        return reply.status(401).send({ error: 'Sesión expirada' });
      }

      const userDoc = await usersCollection.doc(sessionData.userId).get();

      if (!userDoc.exists || !userDoc.data().activo) {
        return reply.status(401).send({ error: 'Usuario no válido' });
      }

      const userData = userDoc.data();

      const tokens = await generarTokens(fastify, {
        id: userData.id,
        cedula: userData.cedula,
        tipoUsuario: userData.tipoUsuario,
        empresaRUC: userData.empresaRUC
      });

      await sessionsCollection.doc(sessionDoc.id).delete();
      await sessionsCollection.doc(tokens.sessionId).set({
        userId: userData.id,
        refreshToken: tokens.refreshToken,
        userAgent: request.headers['user-agent'] || 'unknown',
        ip: request.ip,
        fechaCreacion: serverTimestamp(),
        fechaExpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      return reply.send({
        mensaje: 'Tokens renovados',
        ...tokens
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al renovar tokens' });
    }
  });

  // ============================================
  // VERIFICAR SI CÉDULA PERTENECE A EMPRESA
  // ============================================
  fastify.get('/auth/verificar-empresa/:cedula', async (request, reply) => {
    try {
      const { cedula } = request.params;

      // Buscar usuario con esta cédula
      const userSnapshot = await usersCollection.where('cedula', '==', cedula).get();

      if (userSnapshot.empty) {
        return reply.send({
          existe: false,
          mensaje: 'No existe usuario registrado con esta cédula'
        });
      }

      const userData = userSnapshot.docs[0].data();

      if (userData.tipoUsuario !== 'empresa') {
        return reply.send({
          existe: true,
          esEmpresa: false,
          tipoUsuario: userData.tipoUsuario,
          mensaje: 'El usuario no es de tipo empresa'
        });
      }

      // Obtener información de la empresa
      let empresaInfo = null;
      if (userData.empresaRUC) {
        const empresaDoc = await empresaCollection.doc(userData.empresaRUC).get();
        if (empresaDoc.exists) {
          const empresa = empresaDoc.data();
          empresaInfo = {
            ruc: userData.empresaRUC,
            nombreComercial: empresa.nombreComercial,
            razonSocial: empresa.razonSocial,
            estado: empresa.estado
          };
        }
      }

      return reply.send({
        existe: true,
        esEmpresa: true,
        activo: userData.activo,
        empresa: empresaInfo
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al verificar cédula' });
    }
  });

  // ============================================
  // CREAR ADMIN INICIAL (Solo si no existe ninguno)
  // ============================================
  fastify.post('/auth/setup-admin', {
    schema: {
      body: {
        type: 'object',
        required: ['cedula', 'nombre', 'password', 'claveSetup'],
        properties: {
          cedula: { type: 'string' },
          nombre: { type: 'string' },
          email: { type: 'string' },
          password: { type: 'string', minLength: 8 },
          claveSetup: { type: 'string' }
        }
      }
    },
    config: {
      rateLimit: {
        max: 3, // Máximo 3 intentos de setup
        timeWindow: '5 minutes' // Por 5 minutos (muy restringido)
      }
    }
  }, async (request, reply) => {
    try {
      const { cedula, nombre, email, password, claveSetup } = request.body;

      // Verificar clave de setup
      if (!process.env.ADMIN_SETUP_KEY) {
        return reply.status(500).send({
          error: 'ADMIN_SETUP_KEY no está configurado en el servidor'
        });
      }

      if (claveSetup !== process.env.ADMIN_SETUP_KEY) {
        return reply.status(403).send({ error: 'Clave de setup inválida' });
      }

      // Verificar si ya existe un admin
      const adminSnapshot = await usersCollection.where('tipoUsuario', '==', 'administrador').get();
      if (!adminSnapshot.empty) {
        return reply.status(400).send({ error: 'Ya existe un administrador. Use el panel de admin para crear más.' });
      }

      const passwordValidation = validarPassword(password);
      if (!passwordValidation.valido) {
        return reply.status(400).send({ error: passwordValidation.mensaje });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const userId = `USR-ADMIN-${Date.now()}`;
      const userData = {
        id: userId,
        cedula,
        nombre,
        email: email ? email.toLowerCase() : null,
        password: hashedPassword,
        tipoUsuario: 'administrador',
        empresaRUC: null,
        activo: true,
        primerLogin: false,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        creadoPor: 'SETUP',
        ultimoLogin: null
      };

      await usersCollection.doc(userId).set(userData);

      const { password: _, ...userWithoutPassword } = userData;

      return reply.status(201).send({
        mensaje: 'Administrador inicial creado exitosamente',
        usuario: userWithoutPassword
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al crear administrador' });
    }
  });
};
