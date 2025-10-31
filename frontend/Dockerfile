# --- Build stage ---
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json ./
# Copy lockfiles if present (COPY fails on missing files, so copy conditionally)
# Do not copy lockfiles; we want npm to resolve fresh versions inside the container

# Install deps robustly: prefer npm ci when lockfile exists; fall back to npm install
RUN set -eux; npm install --no-audit --no-fund

# Build-time API base (optional). Example override:
# docker build --build-arg VITE_API_BASE=/api -t frontend .
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=${VITE_API_BASE}
ENV NODE_ENV=production

# Copy the rest of the app and build
COPY . .
RUN set -eux; npm run build


# --- Runtime stage ---
FROM nginx:alpine AS runtime

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Simple SPA router support: fall back to index.html
RUN printf '%s\n' \
  'server {' \
  '  listen 80;' \
  '  server_name _;' \
  '  root /usr/share/nginx/html;' \
  '  index index.html;' \
  '  location / {' \
  '    try_files $uri /index.html;' \
  '  }' \
  '  location /api/ {' \
  '    proxy_pass http://backend:8009/;' \
  '    proxy_set_header Host $host;' \
  '    proxy_set_header X-Real-IP $remote_addr;' \
  '    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' \
  '    proxy_set_header X-Forwarded-Proto $scheme;' \
  '  }' \
  '  # Static assets caching (short TTL, explicit headers)' \
  '  location ~* \.(?:css|js|png|jpg|jpeg|gif|ico|svg|webp)$ {' \
  '    expires 1h;' \
  '    add_header Cache-Control "public, max-age=3600, immutable" always;' \
  '  }' \
  '  # Do not cache SPA entry point' \
  '  location = /index.html {' \
  '    expires -1;' \
  '    add_header Cache-Control "no-store" always;' \
  '  }' \
  '}' > /etc/nginx/conf.d/default.conf

# Give nginx user read access (in case of different uid mapping)
RUN chown -R nginx:nginx /usr/share/nginx/html || true

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://api.hremsoftconsulting.com:8009/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]


