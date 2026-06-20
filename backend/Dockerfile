FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund --registry=https://registry.npmmirror.com

COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]
