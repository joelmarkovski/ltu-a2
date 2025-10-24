# ---------- 1) deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts

# ---------- 2) build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Make the deps available
COPY --from=deps /app/node_modules ./node_modules

# Copy the app source
COPY . .

# >>> ADD: allow build-time injection of the public env var <<<
ARG NEXT_PUBLIC_PUBLISH_URL
ENV NEXT_PUBLIC_PUBLISH_URL=${NEXT_PUBLIC_PUBLISH_URL}

# (optional but nice)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build
RUN npm run postinstall
RUN npm run build

# ---------- 3) runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Your SQLite location for Prisma at runtime
ENV DATABASE_URL="file:./prisma/dev.db"

# If you ever need it at runtime too (SSR/Edge) you can keep it here as well
# (harmless even if not strictly required)
ARG NEXT_PUBLIC_PUBLISH_URL
ENV NEXT_PUBLIC_PUBLISH_URL=${NEXT_PUBLIC_PUBLISH_URL}

# Bring in the built app + runtime bits
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package*.json ./

EXPOSE 3000

# Push schema (creates prisma/dev.db if missing), then start Next
CMD ["sh", "-c", "npx prisma db push && npm start"]
