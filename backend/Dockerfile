FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

FROM node:20-alpine

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

RUN mkdir -p /app/uploads /app/src/data \
  && chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=3000

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD node -e "require('http').get('http://127.0.0.1:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

EXPOSE 3000

CMD ["node", "src/server.js"]
