FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc -p tsconfig.json
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist/index.js"]