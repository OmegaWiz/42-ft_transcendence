FROM node:24-alpine as base

FROM base as installer
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base as builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base as runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV ENGINE_URL=http://engine:3001

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
