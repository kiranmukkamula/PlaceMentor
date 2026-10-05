# Stage 1: Build static bundle
FROM node:20 AS build

WORKDIR /app

# Install dependencies using lockfile
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build environment arguments
ARG VITE_BACKEND_URL=/api
ARG VITE_SOCKET_URL=/
ARG VITE_SERVER_URL=

ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL

# Build application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine AS production

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
