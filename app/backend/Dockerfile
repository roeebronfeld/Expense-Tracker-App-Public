# ============================================
# Stage 1: Development (for docker-compose)
# ============================================
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies
RUN npm ci

# Copy application files
COPY prisma ./prisma
COPY src ./src

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Development command (with hot reload)
CMD ["npm", "run", "dev"]

# ============================================
# Stage 2: Builder (for production build)
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY prisma ./prisma
COPY src ./src

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# ============================================
# Stage 3: Production (for deployment)
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy Prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Build DATABASE_URL from individual env vars if not provided, escaping credentials safely.
# Schema migrations are handled by the dedicated Kubernetes migration job.
CMD ["sh", "-c", "if [ -z \"$DATABASE_URL\" ]; then export DATABASE_URL=$(node -e 'const user=encodeURIComponent(process.env.DB_USER||\"\"); const pass=encodeURIComponent(process.env.DB_PASSWORD||\"\"); const host=process.env.DB_HOST||\"localhost\"; const port=process.env.DB_PORT||\"5432\"; const name=process.env.DB_NAME||\"postgres\"; process.stdout.write(`postgresql://${user}:${pass}@${host}:${port}/${name}?schema=public`)'); fi && node dist/index.js"]
