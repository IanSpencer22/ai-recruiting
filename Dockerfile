# ---- Build frontend (no secrets) ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- API + static SPA ----
FROM node:22-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY server ./server

ENV NODE_ENV=production
# Railway injects PORT at runtime. Keep OPENAI_API_KEY as a runtime env var only.
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/index.mjs"]
