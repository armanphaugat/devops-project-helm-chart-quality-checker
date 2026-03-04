FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 3000
# vite dev server with proxy forwarding /api to backend:8080
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "3000"]