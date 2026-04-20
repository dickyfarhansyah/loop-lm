#!/bin/sh
set -e

echo "🔄 Running database migrations..."
pnpm db:push

echo "🚀 Starting server..."
exec npx tsx src/index.ts
