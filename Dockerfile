FROM node:20-slim AS builder

WORKDIR /app

# Install openssl for Prisma compatibility
RUN apt-get update -y && apt-get install -y openssl

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
COPY backend/prisma.config.ts ./

RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src ./src

RUN npx prisma generate
RUN npx tsc -p tsconfig.json

FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

ENV NODE_ENV=production
ENV PORT=5000

COPY backend/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 5000

CMD ["node", "dist/index.js"]
