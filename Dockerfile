# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json package-lock.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
COPY drizzle.config.ts ./

RUN npm run build

# ── Stage 2: Production ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install production deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy migrations so the app can run them on startup
COPY --from=builder /app/src/db/migrations ./dist/db/migrations

# Non-root user for security
RUN addgroup -S flarely && adduser -S flarely -G flarely
USER flarely

# SQLite data directory — mount a persistent volume here in production
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "dist/index.js"]
