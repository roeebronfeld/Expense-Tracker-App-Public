# ============================================
# Stage 1: Development (for local development)
# ============================================
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use ci for reproducible builds)
RUN npm ci

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Run dev server (accessible from outside container)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ============================================
# Stage 2: Builder (builds static files)
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use ci for reproducible builds)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ============================================
# Stage 3: Production (serves with nginx)
# ============================================
FROM nginxinc/nginx-unprivileged:stable-alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# nginx runs in foreground
CMD ["nginx", "-g", "daemon off;"]
