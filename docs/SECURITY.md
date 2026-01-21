# Seguridad - Bolsa de Empleados

## Resumen de Implementaciones de Seguridad

Este documento describe las medidas de seguridad implementadas en la plataforma Bolsa de Empleados.

---

## 1. Autenticación y Autorización

### Firebase Authentication
- Autenticación basada en tokens JWT
- Soporte para email/password
- Verificación de email obligatoria
- Gestión de sesiones con refresh tokens
- Revocación de tokens en logout

### Middleware de Autenticación
```typescript
// Todas las rutas protegidas validan el token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decodedToken = await auth.verifyIdToken(token);
  req.user = decodedToken;
  next();
};
```

### Control de Acceso Basado en Roles (RBAC)
- **super_admin**: Acceso total al sistema
- **admin**: Gestión de empresas y usuarios
- **manager**: Gestión de empleados de su empresa
- **employee**: Acceso solo lectura a su información

---

## 2. Seguridad en APIs

### Rate Limiting
```nginx
# Límite global: 100 requests por IP por minuto
limit_req_zone $binary_remote_addr zone=global:10m rate=100r/m;

# Límite específico para auth: 10 requests por minuto
limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;
```

### Validación de Entrada
- Validación con Zod en todas las rutas
- Sanitización de inputs
- Validación de tipos estricta

```typescript
const userSchema = z.object({
  email: z.string().email(),
  cedula: z.string().length(10).regex(/^\d+$/),
  displayName: z.string().min(2).max(100),
});
```

### Headers de Seguridad
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'";
```

---

## 3. Seguridad en Base de Datos

### Firestore Security Rules
```javascript
// Solo usuarios autenticados pueden leer/escribir
match /users/{userId} {
  allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
  allow write: if isAuthenticated() && (isOwner(userId) || isAdmin());
}

// Empleados solo visibles por usuarios de la misma empresa
match /employees/{employeeId} {
  allow read: if isAuthenticated() &&
    (isOwner(resource.data.userId) ||
     isSameCompany(resource.data.companyId) ||
     isAdmin());
}
```

### Índices Optimizados
- Índices compuestos para queries frecuentes
- Prevención de full table scans

---

## 4. Seguridad en Comunicaciones

### HTTPS/TLS
- TLS 1.2+ obligatorio
- Certificados SSL válidos
- HSTS habilitado

### CORS
```typescript
fastify.register(cors, {
  origin: [
    'https://bolsa-empleados.web.app',
    'https://bolsa-empleados.firebaseapp.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});
```

---

## 5. Seguridad de Contenedores

### Docker Best Practices
```dockerfile
# Usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Multi-stage builds
FROM node:20-alpine AS builder
FROM node:20-alpine AS production

# Healthchecks
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### Secretos
- Variables de entorno para configuración sensible
- Secret Manager de GCP para producción
- Nunca hardcodear credenciales

---

## 6. Logging y Monitoreo

### Structured Logging
```typescript
logger.info({
  event: 'user_login',
  userId: user.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date().toISOString(),
});
```

### Logs de Auditoría
- Registro de todas las operaciones CRUD
- Logs de acceso y errores
- Integración con Cloud Logging

### Alertas
- Discord webhooks para eventos críticos
- Alertas de rate limiting
- Notificaciones de errores 5xx

---

## 7. Validaciones Específicas Ecuador

### Validación de Cédula
```typescript
function validateCedula(cedula: string): boolean {
  if (cedula.length !== 10) return false;
  const digits = cedula.split('').map(Number);
  const province = parseInt(cedula.substring(0, 2));
  if (province < 1 || province > 24) return false;

  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let value = digits[i] * coefficients[i];
    if (value >= 10) value -= 9;
    sum += value;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[9];
}
```

### Validación de RUC
- Validación de 13 dígitos
- Verificación de dígito verificador
- Consulta con API del SRI

---

## 8. Protección contra Ataques Comunes

### SQL/NoSQL Injection
- Uso exclusivo de SDKs oficiales (Firebase Admin SDK)
- Queries parametrizadas
- Validación de tipos

### XSS (Cross-Site Scripting)
- Escape de salidas en frontend
- Content Security Policy
- HttpOnly cookies

### CSRF (Cross-Site Request Forgery)
- Tokens CSRF en formularios
- SameSite cookies
- Validación de origen

---

## 9. Gestión de Dependencias

### Actualizaciones
```json
{
  "scripts": {
    "audit": "npm audit",
    "audit:fix": "npm audit fix",
    "outdated": "npm outdated"
  }
}
```

### CI/CD Security
- Escaneo de vulnerabilidades en pipeline
- Dependabot habilitado
- Revisión de dependencias en PRs

---

## 10. Respuesta a Incidentes

### Procedimiento
1. Detección y clasificación del incidente
2. Contención inmediata
3. Investigación y análisis
4. Remediación
5. Documentación post-mortem

### Contactos de Emergencia
- Security Team: security@bolsaempleados.ec
- Discord: Canal #security-alerts
- On-call: +593 XXX XXX XXX

---

## Checklist de Seguridad para Despliegue

- [ ] Variables de entorno configuradas correctamente
- [ ] Certificados SSL válidos
- [ ] Rate limiting habilitado
- [ ] CORS configurado correctamente
- [ ] Firestore rules desplegadas
- [ ] Logs de auditoría funcionando
- [ ] Alertas de Discord configuradas
- [ ] Backup de base de datos programado
- [ ] Healthchecks verificados
- [ ] Escaneo de vulnerabilidades ejecutado
