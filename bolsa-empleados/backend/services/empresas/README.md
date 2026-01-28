# 🏢 Empresas Service

Microservicio de gestión de empresas para la Bolsa de Empleados CAIL.

## Stack Tecnológico

- **Runtime:** Node.js 18
- **Framework:** Fastify 5.x
- **Base de datos:** Firebase Firestore
- **Container:** Docker
- **Cloud:** Google Cloud Run
- **CI/CD:** GitHub Actions
- **Tests:** Jest
- **Proxy:** Nginx

## Estructura del Proyecto

```
empresas/
├── __tests__/           # Tests con Jest
│   ├── setup.js
│   └── empresa.test.js
├── nginx/               # Configuración Nginx
│   └── nginx.conf
├── public/              # Firebase Hosting
│   └── index.html
├── index.js             # Entry point del microservicio
├── empresa.js           # Rutas y lógica de empresas
├── package.json
├── Dockerfile
├── docker-compose.yml
├── cloudrun.yaml        # Configuración Cloud Run
├── firebase.json        # Firebase Hosting config
├── jest.config.js
├── deploy.sh            # Script de deploy
└── .env.example
```

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/empresas` | Listar todas las empresas |
| POST | `/empresas` | Crear nueva empresa |
| PATCH | `/empresas/:ruc` | Actualizar empresa |
| DELETE | `/empresas/:ruc` | Eliminar empresa |
| GET | `/health` | Health check |

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Ejecutar en desarrollo
npm run dev

# Ejecutar tests
npm test

# Ejecutar con Docker
docker-compose up --build
```

## Deploy

### Manual a Cloud Run

```bash
# Configurar proyecto GCP
gcloud config set project tu-proyecto-id

# Ejecutar script de deploy
chmod +x deploy.sh
./deploy.sh
```

### Automático con GitHub Actions

El deploy se ejecuta automáticamente al hacer push a `main`.

**Secrets requeridos en GitHub:**
- `GCP_PROJECT_ID`
- `GCP_SA_KEY` (Service Account JSON)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_SERVICE_ACCOUNT`

## Configuración de Secrets en GCP

```bash
# Crear secrets
echo -n "tu-project-id" | gcloud secrets create firebase-project-id --data-file=-
echo -n "tu-client-email" | gcloud secrets create firebase-client-email --data-file=-
echo -n "tu-private-key" | gcloud secrets create firebase-private-key --data-file=-
```

## Docker

```bash
# Build
docker build -t empresas-service .

# Run
docker run -p 3001:8080 --env-file .env empresas-service

# Con docker-compose
docker-compose up -d
```

## Tests

```bash
# Ejecutar todos los tests
npm test

# Con cobertura
npm test -- --coverage

# Watch mode
npm run test:watch
```

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `NODE_ENV` | Entorno (development/production) | development |
| `PORT` | Puerto del servidor | 8080 |
| `FIREBASE_PROJECT_ID` | ID del proyecto Firebase | - |
| `FIREBASE_PRIVATE_KEY` | Clave privada Firebase | - |
| `FIREBASE_CLIENT_EMAIL` | Email del service account | - |
| `CORS_ORIGIN` | Origen CORS permitido | * |

## Licencia

ISC © CAIL
