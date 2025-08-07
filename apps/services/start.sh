#!/bin/bash

# Ensure Prisma client is generated
echo "🔧 Generating Prisma client..."
bunx prisma generate

# Start the server
echo "🚀 Starting Aluuna Services..."
bun run start 