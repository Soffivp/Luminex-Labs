FROM node:18-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Puerto
EXPOSE 8080

# Usuario no-root
USER node

# Comando de inicio
CMD ["node", "index.js"]
