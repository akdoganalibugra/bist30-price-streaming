# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace configuration
COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/socket-server ./apps/socket-server
COPY libs ./libs

# Build the application
RUN npm run build socket-server

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Environment
ENV NODE_ENV=production
ENV SOCKET_SERVER_PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/apps/socket-server/main.js"]
