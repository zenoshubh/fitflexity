FROM oven/bun:1.2.19 AS builder

WORKDIR /client

COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN bun run build

# Production Stage
FROM oven/bun:1.2.19-alpine AS production

WORKDIR /client

COPY package.json bun.lock* ./
RUN bun install --production --frozen-lockfile
COPY --from=builder /client/.next ./.next
COPY --from=builder /client/public ./public     

EXPOSE 3000

CMD ["bun", "run", "start"]