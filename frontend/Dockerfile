FROM node:22-alpine

WORKDIR /app

COPY package.json tsconfig.json tsconfig.node.json vite.config.ts ./
COPY src ./src
COPY public ./public

RUN npm install

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

