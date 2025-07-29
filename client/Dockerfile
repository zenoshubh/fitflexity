FROM oven/bun:1.2.19-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /client

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /client
COPY --from=deps /client/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN bun run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /client

ENV NODE_ENV=production

COPY --from=builder /client/public ./public

COPY --from=builder  /client/.next/standalone ./
COPY --from=builder  /client/.next/static ./.next/static


EXPOSE 3000


# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
CMD ["bun", "run", "server.js"]