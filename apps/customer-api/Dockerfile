# ========================
# Stage 1: Builder
# ========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copy shared libraries
COPY libs/ ./libs/

# Copy customer-api source
COPY apps/customer-api/ ./apps/customer-api/

# Install all dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate --schema=./apps/customer-api/prisma/schema.prisma

# Build the customer-api application
RUN npm run build customer-api

# ========================
# Stage 2: Production
# ========================
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy Prisma schema and generate client
COPY apps/customer-api/prisma ./apps/customer-api/prisma
RUN npx prisma generate --schema=./apps/customer-api/prisma/schema.prisma

# Copy built application from builder
COPY --from=builder /app/dist/apps/customer-api ./dist/apps/customer-api

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start application
CMD ["node", "dist/apps/customer-api/main.js"]
