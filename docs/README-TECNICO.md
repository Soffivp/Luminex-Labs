# Documentación Técnica - Bolsa de Empleados

## Stack Tecnológico

- **Frontend Web**: React + TypeScript + Vite + TailwindCSS
- **Mobile**: React Native (Expo) + TypeScript
- **Backend**: Node.js + Fastify (Microservicios)
- **Base de Datos**: Firebase Firestore
- **Autenticación**: Firebase Authentication
- **Infraestructura**: Docker + Google Cloud Run
- **CI/CD**: GitHub Actions

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTES                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Web App   │  │  Mobile App │  │   Admin     │          │
│  │   (React)   │  │   (Expo)    │  │   Panel     │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Nginx)                       │
│     Rate Limiting │ Load Balancing │ SSL Termination         │
└─────────────────────────────┬───────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Auth Service │    │ User Service │    │Company Service│
│    :3001     │    │    :3002     │    │    :3003     │
└──────────────┘    └──────────────┘    └──────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ SRI Service  │    │Registro Civil│    │ Notification │
│    :3004     │    │    :3005     │    │    :3006     │
└──────────────┘    └──────────────┘    └──────────────┘
                              │
                              ▼
                    ┌──────────────┐
                    │   Realtime   │
                    │    :3007     │
                    └──────────────┘
```

## Microservicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| API Gateway | 8080 | Punto de entrada, routing, rate limiting |
| Auth Service | 3001 | Autenticación con Firebase |
| User Service | 3002 | Gestión de usuarios |
| Company Service | 3003 | Gestión de empresas y empleados |
| SRI Service | 3004 | Integración con SRI Ecuador |
| Registro Civil | 3005 | Validación de cédulas |
| Notification | 3006 | Notificaciones y Discord webhooks |
| Realtime | 3007 | WebSockets y eventos en tiempo real |

## Inicio Rápido

### Prerrequisitos

- Node.js 20+
- Docker y Docker Compose
- Firebase CLI
- Cuenta de Google Cloud (para producción)

### Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar con Docker
docker-compose up -d

# O iniciar servicios individualmente
npm run dev
```

### Web App

```bash
cd web-app
npm install
npm run dev
# Abre http://localhost:5173
```

### Mobile App

```bash
cd mobile-app
npm install
npx expo start
# Escanea el QR con Expo Go
```

## Estructura del Proyecto

```
bolsa-empleados/
├── services/
│   ├── api-gateway/        # API Gateway (Fastify)
│   ├── auth-service/       # Autenticación
│   ├── user-service/       # Usuarios
│   ├── company-service/    # Empresas
│   ├── sri-service/        # Integración SRI
│   ├── registro-civil-service/  # Registro Civil
│   ├── notification-service/    # Notificaciones
│   └── realtime-service/   # WebSockets
├── web-app/                # React Web App
├── mobile-app/             # Expo Mobile App
├── shared/                 # Código compartido
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   └── firebase/
├── docs/                   # Documentación
└── .github/
    └── workflows/          # CI/CD
```

## Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar todos los servicios en modo desarrollo

# Build
npm run build            # Compilar todos los servicios

# Testing
npm run test             # Ejecutar tests
npm run test:coverage    # Tests con cobertura

# Linting
npm run lint             # Ejecutar ESLint
npm run lint:fix         # Corregir errores de lint

# Docker
docker-compose up -d     # Iniciar contenedores
docker-compose down      # Detener contenedores
docker-compose logs -f   # Ver logs
```

## Despliegue

### Firebase Hosting (Web)

```bash
cd web-app
npm run build
firebase deploy --only hosting
```

### Google Cloud Run (Backend)

```bash
# Deploy automático via GitHub Actions en push a main
# O manualmente:
gcloud run deploy api-gateway --image gcr.io/PROJECT/api-gateway
```

### Mobile (APK/IPA)

```bash
cd mobile-app
eas build --platform android --profile production
eas build --platform ios --profile production
```

## Integraciones Ecuador

### SRI (Servicio de Rentas Internas)
- Validación de RUC
- Generación de claves de acceso
- Facturación electrónica

### Registro Civil
- Validación de cédulas de identidad
- Verificación de datos personales

## API Endpoints

### Auth
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verificar token

### Users
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Companies
- `GET /api/companies` - Listar empresas
- `POST /api/companies` - Crear empresa
- `GET /api/companies/:id` - Obtener empresa
- `GET /api/companies/verify-ruc/:ruc` - Verificar RUC

### Employees
- `GET /api/companies/:companyId/employees` - Listar empleados
- `POST /api/companies/:companyId/employees` - Agregar empleado

## Documentación Adicional

- [Arquitectura](../architecture/ARQUITECTURA.md)
- [Seguridad](./SECURITY.md)
- [Despliegue](./DEPLOYMENT.md)
