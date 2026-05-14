# ══════════════════════════════════════════════════════════════════
# CFO Sentinel Web — Dockerfile
# Multi-stage: Build React → Serve dengan Nginx
# ══════════════════════════════════════════════════════════════════

# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files dulu (layer caching)
COPY package*.json ./
RUN npm ci

# Copy semua source code
COPY . .

# Build untuk production
# VITE_API_URL akan di-inject saat build
ARG VITE_API_URL=https://cfosentinel.my.id/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve dengan Nginx ringan
FROM nginx:alpine AS production

# Copy hasil build dari stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy konfigurasi Nginx custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]