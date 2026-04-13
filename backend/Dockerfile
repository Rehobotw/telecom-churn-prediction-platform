FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY README.md ./

RUN mkdir -p /app/uploads

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server.js"]
