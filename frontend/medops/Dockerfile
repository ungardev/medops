# Etapa 1: build con Node
FROM node:22-alpine AS build
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# ✅ Pass environment variables to Vite build
ARG VITE_API_URL=http://localhost:8080/api
ARG VITE_DEV_TOKEN
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DEV_TOKEN=$VITE_DEV_TOKEN

# Copiar código fuente y compilar
COPY . .
RUN npm run build

# Etapa 2: servir con Nginx
FROM nginx:alpine

# Copiar el resultado del build (ajusta según tu framework: dist/ o build/)
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración Nginx para SPA con fallback a index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]