FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json .
RUN npm ci --frozen-lockfile
COPY . .
RUN npm run build

# ── Stage 2: Serve ──────────────────────────────
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA routing fix
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { try_files $uri $uri/ /index.html; } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

