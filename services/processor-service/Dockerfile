FROM node:20-alpine AS builder

WORKDIR /app

COPY app/package*.json ./
RUN npm ci

COPY app/ ./
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["npm", "run", "start:prod"]

