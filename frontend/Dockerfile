# Stage 1: Build production React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install dependencies using clean install
RUN npm ci

# Copy application code
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve through Nginx with reverse proxy & SPA fallback
FROM nginx:alpine

# Copy custom nginx configuration with reverse proxy for /geofences, /vehicles, /ws, etc.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
