# ---- 1. Build Stage ----
# Use a specific versioned image instead of :latest
# 'as builder' names this stage
FROM oven/bun:latest AS builder

# Set the working directory
WORKDIR /server

# Copy dependency manifests
# Bun uses a binary lockfile, bun.lock
COPY package.json bun.lock ./

# Install all dependencies (including devDependencies needed for building)
# --frozen-lockfile ensures reproducible builds
RUN bun install --frozen-lockfile

# Copy the rest of your application source code
COPY . .


# ---- 2. Production Stage ----
# Use a slim, secure base image for the final container
FROM oven/bun:latest AS production

# Set NODE_ENV to production
ENV NODE_ENV=production

WORKDIR /server

# Copy only the necessary files from the 'builder' stage
COPY --from=builder /server/package.json /server/bun.lock ./

# Install *only* production dependencies
RUN bun install --production --frozen-lockfile

COPY --from=builder /server/src ./src
COPY --from=builder /server/tsconfig.json ./
COPY --from=builder /server/start.sh .

# Expose the port your application runs on (replace 3000 if needed)
EXPOSE 8000

# Set the command to run your application
CMD ["./start.sh"]