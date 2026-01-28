/**
 * Módulo de Auditoría y Logging de Seguridad
 * Registra eventos sensibles para compliance y seguridad
 */

/**
 * Tipos de eventos de auditoría
 */
const AUDIT_EVENTS = {
  // Autenticación
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Gestión de usuarios
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_ACTIVATED: 'USER_ACTIVATED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET: 'PASSWORD_RESET',

  // Acceso a datos
  DATA_ACCESS: 'DATA_ACCESS',
  DATA_EXPORT: 'DATA_EXPORT',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',

  // Modificación de datos críticos
  SENSITIVE_DATA_MODIFIED: 'SENSITIVE_DATA_MODIFIED',
  BULK_OPERATION: 'BULK_OPERATION',

  // Seguridad
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CSRF_VIOLATION: 'CSRF_VIOLATION',
  INVALID_TOKEN: 'INVALID_TOKEN'
};

/**
 * Niveles de severidad
 */
const SEVERITY_LEVELS = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

/**
 * Clase para gestionar logs de auditoría
 */
class AuditLogger {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
    this.collection = 'audit_logs';
  }

  /**
   * Registra un evento de auditoría
   * @param {Object} eventData - Datos del evento
   */
  async log(eventData) {
    const {
      event,
      severity = SEVERITY_LEVELS.INFO,
      userId = null,
      userEmail = null,
      userType = null,
      ip = null,
      userAgent = null,
      resource = null,
      resourceId = null,
      action = null,
      result = 'SUCCESS',
      details = {},
      metadata = {}
    } = eventData;

    const auditLog = {
      event,
      severity,
      timestamp: new Date().toISOString(),
      user: {
        id: userId,
        email: userEmail,
        type: userType
      },
      request: {
        ip,
        userAgent
      },
      resource: {
        type: resource,
        id: resourceId,
        action
      },
      result,
      details,
      metadata,
      service: process.env.SERVICE_NAME || 'unknown'
    };

    try {
      // Guardar en Firestore
      if (this.db) {
        await this.db.collection(this.collection).add(auditLog);
      }

      // Log en consola según severidad
      const logMessage = this.formatLogMessage(auditLog);

      switch (severity) {
        case SEVERITY_LEVELS.CRITICAL:
        case SEVERITY_LEVELS.ERROR:
          this.logger.error(logMessage);
          break;
        case SEVERITY_LEVELS.WARNING:
          this.logger.warn(logMessage);
          break;
        default:
          this.logger.info(logMessage);
      }
    } catch (error) {
      // No fallar si el logging falla, pero registrar el error
      this.logger.error('Error al guardar audit log:', error);
    }
  }

  /**
   * Formatea el mensaje de log para consola
   */
  formatLogMessage(auditLog) {
    return `[AUDIT] ${auditLog.event} | User: ${auditLog.user.id || 'anonymous'} | IP: ${auditLog.request.ip} | Result: ${auditLog.result}`;
  }

  /**
   * Logs específicos para eventos comunes
   */

  async logLogin(userId, email, userType, ip, userAgent, success = true) {
    await this.log({
      event: success ? AUDIT_EVENTS.LOGIN_SUCCESS : AUDIT_EVENTS.LOGIN_FAILED,
      severity: success ? SEVERITY_LEVELS.INFO : SEVERITY_LEVELS.WARNING,
      userId,
      userEmail: email,
      userType,
      ip,
      userAgent,
      result: success ? 'SUCCESS' : 'FAILED'
    });
  }

  async logLogout(userId, email, userType, ip, userAgent) {
    await this.log({
      event: AUDIT_EVENTS.LOGOUT,
      severity: SEVERITY_LEVELS.INFO,
      userId,
      userEmail: email,
      userType,
      ip,
      userAgent
    });
  }

  async logPasswordChange(userId, email, ip, userAgent, changedByAdmin = false) {
    await this.log({
      event: AUDIT_EVENTS.PASSWORD_CHANGED,
      severity: SEVERITY_LEVELS.WARNING,
      userId,
      userEmail: email,
      ip,
      userAgent,
      details: { changedByAdmin }
    });
  }

  async logPasswordReset(userId, email, resetByUserId, ip, userAgent) {
    await this.log({
      event: AUDIT_EVENTS.PASSWORD_RESET,
      severity: SEVERITY_LEVELS.WARNING,
      userId,
      userEmail: email,
      ip,
      userAgent,
      details: { resetByUserId }
    });
  }

  async logUserCreated(newUserId, newUserEmail, createdByUserId, ip, userAgent) {
    await this.log({
      event: AUDIT_EVENTS.USER_CREATED,
      severity: SEVERITY_LEVELS.INFO,
      userId: createdByUserId,
      ip,
      userAgent,
      resource: 'user',
      resourceId: newUserId,
      action: 'create',
      details: { newUserEmail }
    });
  }

  async logUnauthorizedAccess(userId, resource, resourceId, ip, userAgent) {
    await this.log({
      event: AUDIT_EVENTS.UNAUTHORIZED_ACCESS,
      severity: SEVERITY_LEVELS.ERROR,
      userId,
      ip,
      userAgent,
      resource,
      resourceId,
      result: 'DENIED'
    });
  }

  async logDataExport(userId, userType, exportType, recordCount, ip, userAgent) {
    await this.log({
      event: AUDIT_EVENTS.DATA_EXPORT,
      severity: SEVERITY_LEVELS.WARNING,
      userId,
      userType,
      ip,
      userAgent,
      details: { exportType, recordCount }
    });
  }

  async logRateLimitExceeded(ip, endpoint, userAgent) {
    await this.log({
      event: AUDIT_EVENTS.RATE_LIMIT_EXCEEDED,
      severity: SEVERITY_LEVELS.WARNING,
      ip,
      userAgent,
      details: { endpoint }
    });
  }

  async logSecurityViolation(type, details, ip, userAgent, userId = null) {
    await this.log({
      event: AUDIT_EVENTS.SECURITY_VIOLATION,
      severity: SEVERITY_LEVELS.CRITICAL,
      userId,
      ip,
      userAgent,
      details: { type, ...details }
    });
  }
}

/**
 * Extrae información del request de Fastify
 */
function extractRequestInfo(request) {
  return {
    ip: request.ip,
    userAgent: request.headers['user-agent'],
    userId: request.user?.id || request.user?.cedula,
    userEmail: request.user?.email,
    userType: request.user?.tipoUsuario
  };
}

/**
 * Middleware para logging automático de requests
 */
function auditLoggerHook(auditLogger) {
  return async (request, reply) => {
    // Solo log de operaciones que modifican datos
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (mutatingMethods.includes(request.method)) {
      const requestInfo = extractRequestInfo(request);

      reply.addHook('onSend', async (request, reply, payload) => {
        const statusCode = reply.statusCode;
        const success = statusCode >= 200 && statusCode < 300;

        await auditLogger.log({
          event: 'API_REQUEST',
          severity: success ? SEVERITY_LEVELS.INFO : SEVERITY_LEVELS.WARNING,
          userId: requestInfo.userId,
          userEmail: requestInfo.userEmail,
          userType: requestInfo.userType,
          ip: requestInfo.ip,
          userAgent: requestInfo.userAgent,
          resource: request.routerPath,
          action: request.method,
          result: success ? 'SUCCESS' : 'FAILED',
          details: {
            statusCode,
            method: request.method,
            path: request.url
          }
        });
      });
    }
  };
}

module.exports = {
  AuditLogger,
  AUDIT_EVENTS,
  SEVERITY_LEVELS,
  extractRequestInfo,
  auditLoggerHook
};
