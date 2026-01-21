#!/bin/bash
# Script de deploy para Empresas Service en Google Cloud Run

set -e

# Variables
PROJECT_ID="${GCP_PROJECT_ID:-cail-bolsa-empleados}"
SERVICE_NAME="empresas-service"
REGION="${GCP_REGION:-us-central1}"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Iniciando deploy de ${SERVICE_NAME}..."

# 1. Build de la imagen Docker
echo "📦 Construyendo imagen Docker..."
docker build -t ${IMAGE}:latest .

# 2. Push a Container Registry
echo "⬆️ Subiendo imagen a GCR..."
docker push ${IMAGE}:latest

# 3. Deploy a Cloud Run
echo "☁️ Desplegando a Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE}:latest \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80 \
  --timeout 60s \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "FIREBASE_PROJECT_ID=firebase-project-id:latest,FIREBASE_CLIENT_EMAIL=firebase-client-email:latest,FIREBASE_PRIVATE_KEY=firebase-private-key:latest"

# 4. Obtener URL del servicio
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')
echo ""
echo "✅ Deploy completado!"
echo "🌐 URL del servicio: ${SERVICE_URL}"
echo ""

# 5. Test del health check
echo "🔍 Verificando health check..."
curl -s "${SERVICE_URL}/health" | jq .

echo ""
echo "🎉 ¡Listo! El microservicio está funcionando."
