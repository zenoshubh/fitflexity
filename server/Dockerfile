# ---- 1. Build Stage ----
FROM oven/bun:1.2.19 AS builder

WORKDIR /server

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

# ---- 2. Production Stage ----
FROM oven/bun:1.2.19-alpine AS production

ENV NODE_ENV=production

WORKDIR /server

COPY --from=builder /server/package.json /server/bun.lock ./

RUN bun install --production --frozen-lockfile

COPY --from=builder /server/dist ./dist
# COPY --from=builder /server/src ./src
# COPY --from=builder /server/tsconfig.json ./

EXPOSE 8000

CMD ["bun", "start"]