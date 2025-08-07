# ------------ Build Stage ------------
FROM oven/bun:1.2.19 AS base

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package.json bunfig.toml ./
COPY prisma ./prisma/
COPY . .

RUN bun install --frozen-lockfile

# 👇 Ensure dist exists and is writable
RUN mkdir -p dist && chmod 777 dist

# 👇 Build app and force output to dist/index.js
RUN bun build src/index.ts --outfile dist/index.js --target node

# ✅ Add debug: verify file exists
RUN ls -l dist

# ------------ Production Stage ------------
FROM oven/bun:1.2.19-slim AS prod

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=base /app/node_modules/.bin ./node_modules/.bin
COPY --from=base /app/start.sh ./start.sh

# Make startup script executable
RUN chmod +x start.sh

# ✅ Set permissions before switching user
RUN mkdir -p /app/dist && chown -R bun:bun /app

RUN groupadd -g 1001 bun || true
RUN useradd -r -u 1001 -g bun bun || true

USER bun

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["./start.sh"]
