FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm config set registry https://registry.npmmirror.com \
    && npm config set fetch-retries 2 \
    && npm config set fetch-retry-mintimeout 10000 \
    && npm config set fetch-retry-maxtimeout 30000 \
    && npm config set fetch-timeout 60000 \
    && npm ci --omit=dev --no-audit --no-fund --prefer-offline

COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]