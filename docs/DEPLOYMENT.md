# Guía de Despliegue - Bolsa de Empleados

## Requisitos Previos

- Node.js 20+
- Docker y Docker Compose
- Firebase CLI (`npm i -g firebase-tools`)
- Google Cloud SDK (`gcloud`)
- EAS CLI para mobile (`npm i -g eas-cli`)

---

## 1. Configuración Inicial

### Clonar y configurar el proyecto
```bash
git clone https://github.com/tu-org/bolsa-empleados.git
cd bolsa-empleados
npm install
```

### Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con las credenciales correctas
```

### Variables requeridas
```env
# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# JWT
JWT_SECRET=your-secret-key

# APIs Externas
SRI_API_URL=https://srienlinea.sri.gob.ec/...
SRI_API_KEY=your-sri-api-key
REGISTRO_CIVIL_API_URL=https://www.registrocivil.gob.ec/...
REGISTRO_CIVIL_API_KEY=your-api-key

# Discord Webhooks
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

---

## 2. Desarrollo Local

### Iniciar todos los servicios con Docker
```bash
docker-compose up -d
```

### Iniciar servicios individualmente
```bash
# API Gateway
cd services/api-gateway && npm run dev

# Auth Service
cd services/auth-service && npm run dev

# ... otros servicios
```

### Web App (React)
```bash
cd web-app
npm install
npm run dev
```

### Mobile App (Expo)
```bash
cd mobile-app
npm install
npx expo start
```

---

## 3. Firebase

### Inicializar Firebase
```bash
firebase login
firebase init
```

### Desplegar reglas de Firestore
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Desplegar web app a Firebase Hosting
```bash
cd web-app
npm run build
firebase deploy --only hosting
```

---

## 4. Google Cloud Run

### Autenticación
```bash
gcloud auth login
gcloud config set project your-project-id
```

### Construir y subir imagen
```bash
# Construir imagen
docker build -t gcr.io/your-project/api-gateway ./services/api-gateway

# Push a Container Registry
docker push gcr.io/your-project/api-gateway
```

### Desplegar servicio
```bash
gcloud run deploy api-gateway \
  --image gcr.io/your-project/api-gateway \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production"
```

### Desplegar todos los microservicios
```bash
# Script automatizado
./scripts/deploy-all.sh production
```

---

## 5. CI/CD con GitHub Actions

### Configurar secretos en GitHub
Ir a Settings > Secrets and variables > Actions:

- `GCP_PROJECT_ID`
- `GCP_SA_KEY` (Service Account JSON)
- `FIREBASE_TOKEN`
- `DISCORD_WEBHOOK_URL`

### Workflows disponibles

**ci-cd.yml** - Pipeline principal
- Ejecuta en push a `main` y `develop`
- Lint, test, build, deploy

**pr-checks.yml** - Validación de PRs
- Ejecuta en pull requests
- Lint, test, build

---

## 6. Mobile Build (APK/IPA)

### Configurar EAS
```bash
cd mobile-app
eas login
eas build:configure
```

### Build Android APK
```bash
# Preview build (para testing)
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

### Build iOS
```bash
# Requiere cuenta de Apple Developer
eas build --platform ios --profile production
```

### Descargar builds
```bash
eas build:list
# Los links de descarga aparecen en la salida o en expo.dev
```

---

## 7. Comandos Útiles

### Docker
```bash
# Ver logs
docker-compose logs -f api-gateway

# Reconstruir un servicio
docker-compose up -d --build api-gateway

# Limpiar contenedores
docker-compose down -v
```

### Firebase
```bash
# Ver logs de funciones
firebase functions:log

# Emulador local
firebase emulators:start
```

### Google Cloud
```bash
# Ver logs de Cloud Run
gcloud run services logs read api-gateway

# Ver estado de servicios
gcloud run services list
```

---

## 8. Monitoreo

### Health Checks
Todos los servicios exponen `/health`:
```bash
curl http://localhost:8080/health
```

### Métricas
- Cloud Monitoring para métricas de infraestructura
- Custom metrics en `/metrics` (opcional)

### Logs
```bash
# Logs estructurados en formato JSON
# Visualizar en Cloud Logging
gcloud logging read "resource.type=cloud_run_revision"
```

---

## 9. Rollback

### Cloud Run
```bash
# Listar revisiones
gcloud run revisions list --service api-gateway

# Rollback a revisión anterior
gcloud run services update-traffic api-gateway \
  --to-revisions api-gateway-00005-abc=100
```

### Firebase Hosting
```bash
# Ver historial de despliegues
firebase hosting:channel:list

# Rollback
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL TARGET_SITE_ID:live
```

---

## 10. Troubleshooting

### Errores comunes

**Error: PERMISSION_DENIED**
- Verificar que el service account tiene los permisos correctos
- Revisar Firestore security rules

**Error: Container failed to start**
- Verificar que el puerto expuesto es correcto
- Revisar logs: `gcloud run services logs read SERVICE_NAME`

**Error: Build failed in EAS**
- Verificar dependencias nativas
- Revisar `eas.json` y `app.json`

### Comandos de diagnóstico
```bash
# Verificar conexión a Firebase
firebase projects:list

# Verificar servicios de Cloud Run
gcloud run services describe api-gateway

# Verificar conectividad
curl -I https://api.bolsaempleados.ec/health
```
