// utils/functions.js - Funciones de Cumplimiento Legal

/**
 * Genera timestamp del servidor
 */
const serverTimestamp = () => new Date().toISOString();

/**
 * Genera ID único para verificación
 */
const generarIdVerificacion = (prefijo = 'VER') => {
  const fecha = new Date();
  const timestamp = fecha.getTime();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefijo}-${timestamp}-${random}`;
};

/**
 * Valida cédula ecuatoriana (10 dígitos)
 * Implementa algoritmo de módulo 10
 * @param {string} cedula - Número de cédula
 * @returns {boolean}
 */
const validarCedulaEcuador = (cedula) => {
  if (!cedula || typeof cedula !== 'string') return false;

  // Limpiar espacios y guiones
  cedula = cedula.replace(/[\s-]/g, '');

  // Debe tener 10 dígitos
  if (!/^\d{10}$/.test(cedula)) return false;

  // Primeros 2 dígitos = código de provincia (01-24, o 30 para extranjeros)
  const provincia = parseInt(cedula.substring(0, 2));
  if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;

  // Tercer dígito debe ser menor a 6 para personas naturales
  const tercerDigito = parseInt(cedula.charAt(2));
  if (tercerDigito >= 6) return false;

  // Algoritmo de validación (módulo 10)
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula.charAt(i)) * coeficientes[i];
    if (valor > 9) valor -= 9;
    suma += valor;
  }

  const digitoVerificador = parseInt(cedula.charAt(9));
  const residuo = suma % 10;
  const resultado = residuo === 0 ? 0 : 10 - residuo;

  return digitoVerificador === resultado;
};

/**
 * Valida RUC ecuatoriano (13 dígitos)
 * @param {string} ruc - Número de RUC
 * @returns {boolean}
 */
const validarRUC = (ruc) => {
  if (!ruc || typeof ruc !== 'string') return false;

  // Limpiar espacios y guiones
  ruc = ruc.replace(/[\s-]/g, '');

  // Debe tener 13 dígitos
  if (!/^\d{13}$/.test(ruc)) return false;

  // Los 3 últimos dígitos deben ser 001 o mayor
  const establecimiento = parseInt(ruc.substring(10, 13));
  if (establecimiento < 1) return false;

  // Primeros 2 dígitos = código de provincia
  const provincia = parseInt(ruc.substring(0, 2));
  if (provincia < 1 || provincia > 24) return false;

  // Tercer dígito indica tipo de contribuyente
  const tercerDigito = parseInt(ruc.charAt(2));

  // Persona natural: tercerDigito < 6
  if (tercerDigito < 6) {
    // Validar como cédula los primeros 10 dígitos
    return validarCedulaEcuador(ruc.substring(0, 10));
  }

  // Sociedad privada: tercerDigito = 9
  if (tercerDigito === 9) {
    const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      suma += parseInt(ruc.charAt(i)) * coeficientes[i];
    }

    const residuo = suma % 11;
    const digitoVerificador = parseInt(ruc.charAt(9));
    const resultado = residuo === 0 ? 0 : 11 - residuo;

    return digitoVerificador === resultado;
  }

  // Sector público: tercerDigito = 6
  if (tercerDigito === 6) {
    const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;

    for (let i = 0; i < 8; i++) {
      suma += parseInt(ruc.charAt(i)) * coeficientes[i];
    }

    const residuo = suma % 11;
    const digitoVerificador = parseInt(ruc.charAt(8));
    const resultado = residuo === 0 ? 0 : 11 - residuo;

    return digitoVerificador === resultado;
  }

  return false;
};

/**
 * Documentos requeridos para empleados según legislación ecuatoriana
 */
const DOCUMENTOS_EMPLEADO = {
  obligatorios: [
    { campo: 'cedula', nombre: 'Cédula de identidad', descripcion: 'Documento de identidad válido' },
    { campo: 'direccion', nombre: 'Dirección domiciliaria', descripcion: 'Dirección de residencia' },
    { campo: 'telefono', nombre: 'Teléfono de contacto', descripcion: 'Número telefónico' },
    { campo: 'email', nombre: 'Correo electrónico', descripcion: 'Email de contacto' }
  ],
  recomendados: [
    { campo: 'titulos', nombre: 'Títulos académicos', descripcion: 'Certificados de estudios' },
    { campo: 'certificadosLaborales', nombre: 'Certificados laborales', descripcion: 'Referencias de empleos anteriores' },
    { campo: 'antecedentes', nombre: 'Record policial', descripcion: 'Certificado de antecedentes penales' },
    { campo: 'cuentaBancaria', nombre: 'Cuenta bancaria', descripcion: 'Datos para pago de nómina' }
  ],
  conVencimiento: [
    { campo: 'certificadoSalud', nombre: 'Certificado de salud', descripcion: 'Certificado médico ocupacional' },
    { campo: 'licenciaConducir', nombre: 'Licencia de conducir', descripcion: 'Si aplica al cargo' }
  ]
};

/**
 * Documentos requeridos para empresas según legislación ecuatoriana
 */
const DOCUMENTOS_EMPRESA = {
  obligatorios: [
    { campo: 'ruc', nombre: 'RUC', descripcion: 'Registro Único de Contribuyentes' },
    { campo: 'razonSocial', nombre: 'Razón social', descripcion: 'Nombre legal de la empresa' },
    { campo: 'direccion', nombre: 'Dirección', descripcion: 'Domicilio fiscal' },
    { campo: 'representanteLegal', nombre: 'Representante legal', descripcion: 'Datos del representante' },
    { campo: 'telefono', nombre: 'Teléfono', descripcion: 'Contacto empresarial' }
  ],
  recomendados: [
    { campo: 'escrituraConstitucion', nombre: 'Escritura de constitución', descripcion: 'Documento notarial' },
    { campo: 'nombreamientoRepresentante', nombre: 'Nombramiento', descripcion: 'Del representante legal' },
    { campo: 'certificadoCumplimiento', nombre: 'Certificado de cumplimiento tributario', descripcion: 'SRI' },
    { campo: 'certificadoIESS', nombre: 'Certificado IESS', descripcion: 'Cumplimiento de obligaciones' }
  ],
  conVencimiento: [
    { campo: 'permisoFuncionamiento', nombre: 'Permiso de funcionamiento', descripcion: 'Municipal o ministerial' },
    { campo: 'patente', nombre: 'Patente municipal', descripcion: 'Licencia de actividad' },
    { campo: 'certificadoBomberos', nombre: 'Certificado de bomberos', descripcion: 'Permiso de seguridad' }
  ]
};

/**
 * Verifica documentos de un empleado
 * @param {Object} empleado - Datos del empleado
 * @returns {Object} Resultado de verificación
 */
const verificarDocumentosEmpleado = (empleado) => {
  if (!empleado) {
    return {
      cumpleRequisitos: false,
      nivelCumplimiento: 0,
      documentosPresentes: [],
      documentosFaltantes: DOCUMENTOS_EMPLEADO.obligatorios.map(d => d.nombre),
      alertas: ['No se encontraron datos del empleado']
    };
  }

  const documentosPresentes = [];
  const documentosFaltantes = [];
  const alertas = [];

  // Verificar obligatorios
  DOCUMENTOS_EMPLEADO.obligatorios.forEach(doc => {
    if (empleado[doc.campo] && empleado[doc.campo].toString().trim() !== '') {
      documentosPresentes.push({ ...doc, estado: 'presente' });
    } else {
      documentosFaltantes.push(doc.nombre);
    }
  });

  // Verificar recomendados
  let recomendadosPresentes = 0;
  DOCUMENTOS_EMPLEADO.recomendados.forEach(doc => {
    if (empleado[doc.campo]) {
      recomendadosPresentes++;
      documentosPresentes.push({ ...doc, estado: 'presente', tipo: 'recomendado' });
    }
  });

  // Verificar documentos con vencimiento
  const ahora = new Date();
  DOCUMENTOS_EMPLEADO.conVencimiento.forEach(doc => {
    if (empleado[doc.campo]) {
      const vencimiento = empleado[`${doc.campo}Vencimiento`];
      if (vencimiento) {
        const fechaVenc = new Date(vencimiento);
        if (fechaVenc < ahora) {
          alertas.push(`${doc.nombre} vencido`);
        } else {
          const diasRestantes = Math.ceil((fechaVenc - ahora) / (1000 * 60 * 60 * 24));
          if (diasRestantes <= 30) {
            alertas.push(`${doc.nombre} vence en ${diasRestantes} días`);
          }
        }
      }
      documentosPresentes.push({ ...doc, estado: 'presente', tipo: 'con_vencimiento' });
    }
  });

  // Validar cédula si existe
  if (empleado.cedula && !validarCedulaEcuador(empleado.cedula)) {
    alertas.push('Cédula con formato inválido');
  }

  // Calcular nivel de cumplimiento
  const totalObligatorios = DOCUMENTOS_EMPLEADO.obligatorios.length;
  const obligatoriosPresentes = totalObligatorios - documentosFaltantes.length;
  const porcentajeObligatorios = (obligatoriosPresentes / totalObligatorios) * 100;

  // Bonificación por recomendados (máximo 20%)
  const bonificacionRecomendados = (recomendadosPresentes / DOCUMENTOS_EMPLEADO.recomendados.length) * 20;

  const nivelCumplimiento = Math.min(Math.round(porcentajeObligatorios * 0.8 + bonificacionRecomendados), 100);

  return {
    cumpleRequisitos: documentosFaltantes.length === 0 && alertas.filter(a => a.includes('vencido')).length === 0,
    nivelCumplimiento,
    documentosPresentes,
    documentosFaltantes,
    alertas,
    resumen: {
      obligatorios: `${obligatoriosPresentes}/${totalObligatorios}`,
      recomendados: `${recomendadosPresentes}/${DOCUMENTOS_EMPLEADO.recomendados.length}`
    }
  };
};

/**
 * Verifica documentos de una empresa
 * @param {Object} empresa - Datos de la empresa
 * @returns {Object} Resultado de verificación
 */
const verificarDocumentosEmpresa = (empresa) => {
  if (!empresa) {
    return {
      cumpleRequisitos: false,
      nivelCumplimiento: 0,
      documentosPresentes: [],
      documentosFaltantes: DOCUMENTOS_EMPRESA.obligatorios.map(d => d.nombre),
      alertas: ['No se encontraron datos de la empresa']
    };
  }

  const documentosPresentes = [];
  const documentosFaltantes = [];
  const alertas = [];

  // Verificar obligatorios
  DOCUMENTOS_EMPRESA.obligatorios.forEach(doc => {
    if (empresa[doc.campo] && empresa[doc.campo].toString().trim() !== '') {
      documentosPresentes.push({ ...doc, estado: 'presente' });
    } else {
      documentosFaltantes.push(doc.nombre);
    }
  });

  // Verificar recomendados
  let recomendadosPresentes = 0;
  DOCUMENTOS_EMPRESA.recomendados.forEach(doc => {
    if (empresa[doc.campo]) {
      recomendadosPresentes++;
      documentosPresentes.push({ ...doc, estado: 'presente', tipo: 'recomendado' });
    }
  });

  // Verificar documentos con vencimiento
  const ahora = new Date();
  DOCUMENTOS_EMPRESA.conVencimiento.forEach(doc => {
    if (empresa[doc.campo]) {
      const vencimiento = empresa[`${doc.campo}Vencimiento`];
      if (vencimiento) {
        const fechaVenc = new Date(vencimiento);
        if (fechaVenc < ahora) {
          alertas.push(`${doc.nombre} vencido`);
        } else {
          const diasRestantes = Math.ceil((fechaVenc - ahora) / (1000 * 60 * 60 * 24));
          if (diasRestantes <= 30) {
            alertas.push(`${doc.nombre} vence en ${diasRestantes} días`);
          }
        }
      }
      documentosPresentes.push({ ...doc, estado: 'presente', tipo: 'con_vencimiento' });
    }
  });

  // Validar RUC si existe
  if (empresa.ruc && !validarRUC(empresa.ruc)) {
    alertas.push('RUC con formato inválido');
  }

  // Calcular nivel de cumplimiento
  const totalObligatorios = DOCUMENTOS_EMPRESA.obligatorios.length;
  const obligatoriosPresentes = totalObligatorios - documentosFaltantes.length;
  const porcentajeObligatorios = (obligatoriosPresentes / totalObligatorios) * 100;

  const bonificacionRecomendados = (recomendadosPresentes / DOCUMENTOS_EMPRESA.recomendados.length) * 20;

  const nivelCumplimiento = Math.min(Math.round(porcentajeObligatorios * 0.8 + bonificacionRecomendados), 100);

  return {
    cumpleRequisitos: documentosFaltantes.length === 0 && alertas.filter(a => a.includes('vencido')).length === 0,
    nivelCumplimiento,
    documentosPresentes,
    documentosFaltantes,
    alertas,
    resumen: {
      obligatorios: `${obligatoriosPresentes}/${totalObligatorios}`,
      recomendados: `${recomendadosPresentes}/${DOCUMENTOS_EMPRESA.recomendados.length}`
    }
  };
};

/**
 * Calcula nivel de cumplimiento general
 * @param {number} obligatorios - Porcentaje de obligatorios cumplidos
 * @param {number} recomendados - Porcentaje de recomendados cumplidos
 * @returns {number} Nivel de 0-100
 */
const calcularNivelCumplimiento = (obligatorios, recomendados) => {
  return Math.min(Math.round(obligatorios * 0.8 + recomendados * 0.2), 100);
};

/**
 * Genera alertas de vencimiento para una entidad
 * @param {Object} entidad - Empleado o empresa
 * @param {string} tipo - 'empleado' o 'empresa'
 * @param {number} diasAnticipacion - Días de anticipación para alertar
 * @returns {Array} Lista de alertas
 */
const generarAlertasVencimiento = (entidad, tipo, diasAnticipacion = 30) => {
  const alertas = [];
  const ahora = new Date();
  const limite = new Date();
  limite.setDate(limite.getDate() + diasAnticipacion);

  const documentos = tipo === 'empleado'
    ? DOCUMENTOS_EMPLEADO.conVencimiento
    : DOCUMENTOS_EMPRESA.conVencimiento;

  documentos.forEach(doc => {
    const vencimiento = entidad[`${doc.campo}Vencimiento`];
    if (vencimiento) {
      const fechaVenc = new Date(vencimiento);

      if (fechaVenc < ahora) {
        alertas.push({
          documento: doc.nombre,
          estado: 'vencido',
          fechaVencimiento: vencimiento,
          diasRestantes: -Math.ceil((ahora - fechaVenc) / (1000 * 60 * 60 * 24)),
          urgencia: 'critica'
        });
      } else if (fechaVenc <= limite) {
        const diasRestantes = Math.ceil((fechaVenc - ahora) / (1000 * 60 * 60 * 24));
        alertas.push({
          documento: doc.nombre,
          estado: 'proximo_vencer',
          fechaVencimiento: vencimiento,
          diasRestantes,
          urgencia: diasRestantes <= 7 ? 'alta' : diasRestantes <= 15 ? 'media' : 'baja'
        });
      }
    }
  });

  return alertas;
};

module.exports = {
  serverTimestamp,
  generarIdVerificacion,
  validarCedulaEcuador,
  validarRUC,
  verificarDocumentosEmpleado,
  verificarDocumentosEmpresa,
  calcularNivelCumplimiento,
  generarAlertasVencimiento,
  DOCUMENTOS_EMPLEADO,
  DOCUMENTOS_EMPRESA
};
