# Build documentation website
FROM node:18-alpine AS docs-builder
WORKDIR /docs
COPY docs-website/package*.json ./
RUN npm ci
COPY docs-website/ ./
RUN npm run build

# Backend application
FROM python:3.12-slim
WORKDIR /app
COPY backend/app /app/app
COPY backend/requirements.txt /app
RUN pip install --no-cache-dir -r requirements.txt

# Copy built documentation website
COPY --from=docs-builder /docs/dist /app/docs-website/dist

EXPOSE 8009
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8009", "--proxy-headers", "--forwarded-allow-ips", "*"]


