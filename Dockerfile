# Multi-Stage: Frontend bauen, dann Node-Runtime mit Backend + Static-Build.

# 1) Frontend-Build
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 2) Backend-Build
FROM node:20-alpine AS backend
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# 3) Runtime
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=backend /app/dist ./dist
# schema.sql wird zur Laufzeit gelesen → mitkopieren
COPY src/db/schema.sql ./dist/db/schema.sql
COPY --from=frontend /app/frontend/dist ./frontend/dist
EXPOSE 8002
CMD ["node", "dist/server.js"]
