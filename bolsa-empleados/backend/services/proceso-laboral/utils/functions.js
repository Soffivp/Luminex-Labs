// utils/functions.js - Funciones auxiliares para proceso laboral

const path = require('path');
const fs = require('fs');

/**
 * Timestamp del servidor
 */
const serverTimestamp = () => new Date().toISOString();

/**
 * Genera un ID único para documentos
 */
const generarIdDocumento = () => {
  return `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Genera un ID único para procesos laborales
 */
const generarIdProceso = () => {
  return `PROC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Tipos de documentos requeridos para contratación
 */
const TIPOS_DOCUMENTOS = {
  CONTRATO: {
    codigo: 'contrato',
    nombre: 'Contrato de Trabajo',
    requerido: true,
    extensiones: ['.pdf'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  CEDULA: {
    codigo: 'cedula',
    nombre: 'Copia de Cédula',
    requerido: true,
    extensiones: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 2 * 1024 * 1024 // 2MB
  },
  CERTIFICADO_VOTACION: {
    codigo: 'certificado_votacion',
    nombre: 'Certificado de Votación',
    requerido: false,
    extensiones: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 2 * 1024 * 1024
  },
  TITULO_ACADEMICO: {
    codigo: 'titulo_academico',
    nombre: 'Título Académico',
    requerido: false,
    extensiones: ['.pdf'],
    maxSize: 5 * 1024 * 1024
  },
  CERTIFICADO_LABORAL: {
    codigo: 'certificado_laboral',
    nombre: 'Certificado Laboral Anterior',
    requerido: false,
    extensiones: ['.pdf'],
    maxSize: 5 * 1024 * 1024
  },
  MECANIZADO_IESS: {
    codigo: 'mecanizado_iess',
    nombre: 'Mecanizado IESS',
    requerido: false,
    extensiones: ['.pdf'],
    maxSize: 2 * 1024 * 1024
  },
  FOTO: {
    codigo: 'foto',
    nombre: 'Foto Tamaño Carnet',
    requerido: false,
    extensiones: ['.jpg', '.jpeg', '.png'],
    maxSize: 1 * 1024 * 1024 // 1MB
  },
  OTRO: {
    codigo: 'otro',
    nombre: 'Otro Documento',
    requerido: false,
    extensiones: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
    maxSize: 10 * 1024 * 1024
  }
};

/**
 * Estados del proceso laboral
 */
const ESTADOS_PROCESO = {
  PENDIENTE_DOCUMENTOS: 'pendiente_documentos',
  DOCUMENTOS_EN_REVISION: 'documentos_en_revision',
  DOCUMENTOS_APROBADOS: 'documentos_aprobados',
  DOCUMENTOS_RECHAZADOS: 'documentos_rechazados',
  EN_PROCESO_CONTRATACION: 'en_proceso_contratacion',
  CONTRATADO: 'contratado',
  CANCELADO: 'cancelado'
};

/**
 * Valida el tipo de archivo
 */
const validarTipoArchivo = (nombreArchivo, tipoDocumento) => {
  const extension = path.extname(nombreArchivo).toLowerCase();
  const tipoConfig = TIPOS_DOCUMENTOS[tipoDocumento.toUpperCase()] || TIPOS_DOCUMENTOS.OTRO;

  if (!tipoConfig.extensiones.includes(extension)) {
    return {
      valido: false,
      error: `Extensión no permitida. Extensiones válidas: ${tipoConfig.extensiones.join(', ')}`
    };
  }

  return { valido: true };
};

/**
 * Valida el tamaño del archivo
 */
const validarTamanoArchivo = (tamano, tipoDocumento) => {
  const tipoConfig = TIPOS_DOCUMENTOS[tipoDocumento.toUpperCase()] || TIPOS_DOCUMENTOS.OTRO;

  if (tamano > tipoConfig.maxSize) {
    const maxMB = tipoConfig.maxSize / (1024 * 1024);
    return {
      valido: false,
      error: `El archivo excede el tamaño máximo permitido (${maxMB}MB)`
    };
  }

  return { valido: true };
};

/**
 * Genera la ruta de almacenamiento para un documento
 */
const generarRutaAlmacenamiento = (matchingId, tipoDocumento, nombreArchivo) => {
  const extension = path.extname(nombreArchivo);
  const nombreSeguro = `${tipoDocumento}_${Date.now()}${extension}`;
  return `documentos/${matchingId}/${nombreSeguro}`;
};

/**
 * Verifica si todos los documentos requeridos están completos
 */
const verificarDocumentosCompletos = (documentos) => {
  const requeridos = Object.values(TIPOS_DOCUMENTOS)
    .filter(tipo => tipo.requerido)
    .map(tipo => tipo.codigo);

  const subidos = documentos
    .filter(doc => doc.estado === 'aprobado' || doc.estado === 'pendiente_revision')
    .map(doc => doc.tipoDocumento);

  const faltantes = requeridos.filter(req => !subidos.includes(req));

  return {
    completos: faltantes.length === 0,
    faltantes,
    totalRequeridos: requeridos.length,
    totalSubidos: subidos.filter(s => requeridos.includes(s)).length
  };
};

/**
 * Calcula el progreso del proceso de documentación
 */
const calcularProgreso = (documentos) => {
  const requeridos = Object.values(TIPOS_DOCUMENTOS)
    .filter(tipo => tipo.requerido)
    .map(tipo => tipo.codigo);

  const aprobados = documentos
    .filter(doc => doc.estado === 'aprobado' && requeridos.includes(doc.tipoDocumento))
    .length;

  const porcentaje = requeridos.length > 0
    ? Math.round((aprobados / requeridos.length) * 100)
    : 0;

  return {
    porcentaje,
    aprobados,
    total: requeridos.length,
    estado: porcentaje === 100 ? 'completo' : porcentaje > 0 ? 'en_progreso' : 'sin_iniciar'
  };
};

/**
 * Genera un resumen del proceso laboral
 */
const generarResumenProceso = (proceso, documentos) => {
  const verificacion = verificarDocumentosCompletos(documentos);
  const progreso = calcularProgreso(documentos);

  return {
    id: proceso.id,
    matchingId: proceso.matchingId,
    empleadoCedula: proceso.empleadoCedula,
    empleadoNombre: proceso.empleadoNombre,
    empresaRUC: proceso.empresaRUC,
    estado: proceso.estado,
    progreso,
    documentos: {
      total: documentos.length,
      aprobados: documentos.filter(d => d.estado === 'aprobado').length,
      pendientes: documentos.filter(d => d.estado === 'pendiente_revision').length,
      rechazados: documentos.filter(d => d.estado === 'rechazado').length
    },
    documentosRequeridos: verificacion,
    fechaInicio: proceso.fechaInicio,
    fechaActualizacion: proceso.fechaActualizacion
  };
};

/**
 * Convierte buffer a Base64
 */
const bufferToBase64 = (buffer) => {
  return buffer.toString('base64');
};

/**
 * Convierte Base64 a Buffer
 */
const base64ToBuffer = (base64) => {
  return Buffer.from(base64, 'base64');
};

/**
 * Valida que el contenido sea un PDF válido
 */
const validarPDF = (buffer) => {
  // Los PDFs comienzan con %PDF-
  const header = buffer.slice(0, 5).toString();
  return header === '%PDF-';
};

module.exports = {
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
  bufferToBase64,
  base64ToBuffer,
  validarPDF
};
