# Production stage - run TypeScript directly with tsx
FROM node:20-alpine

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ build-base

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root package files for monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy backend package.json
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Rebuild better-sqlite3 for the current platform
RUN cd /app/node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && npm run build-release

# Copy backend source code
COPY apps/backend ./apps/backend

# Create directories for data and uploads
RUN mkdir -p /app/apps/backend/data /app/apps/backend/uploads

# Copy entrypoint script
COPY apps/backend/docker-entrypoint.sh /app/apps/backend/docker-entrypoint.sh
RUN chmod +x /app/apps/backend/docker-entrypoint.sh

WORKDIR /app/apps/backend

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Use entrypoint script to run migrations then start server
ENTRYPOINT ["/app/apps/backend/docker-entrypoint.sh"]
