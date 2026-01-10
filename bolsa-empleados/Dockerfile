# devops/docker/docker-compose.dev.yml
FROM node:18

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (incluidas devDependencies para compilar)
RUN npm install


# Compilar TypeScript
RUN npm run build


COPY . . 

EXPOSE 3000

CMD ["node", "backend/index.js"]


