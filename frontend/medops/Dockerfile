# Etapa 1: build con Node
FROM node:22-alpine AS build
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

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