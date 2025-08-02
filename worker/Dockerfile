# ---- 1. Build Stage ----
FROM oven/bun:1.2.19 AS builder

WORKDIR /worker

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

# ---- 2. Production Stage ----
FROM oven/bun:1.2.19-alpine AS production

WORKDIR /worker

COPY --from=builder /worker/package.json /worker/bun.lock ./

RUN bun install --production --frozen-lockfile

COPY --from=builder /worker/dist ./dist

CMD ["bun", "run", "start"]