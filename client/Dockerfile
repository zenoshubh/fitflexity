FROM oven/bun:latest AS builder

WORKDIR /client

COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

# ---

# Production Stage
FROM oven/bun:latest AS production
WORKDIR /client

COPY package.json bun.lock* ./
RUN bun install --production --frozen-lockfile
COPY --from=builder /client/.next ./.next
COPY --from=builder /client/public ./public     

EXPOSE 3000

CMD ["bun", "run", "start"]