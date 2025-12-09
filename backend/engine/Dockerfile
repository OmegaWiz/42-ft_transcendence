FROM node:24-alpine as base

FROM base as installer
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base as builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY ./tsconfig.json ./tsconfig.json
COPY ./srcs ./srcs
RUN npm run build

FROM base as runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=installer /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
