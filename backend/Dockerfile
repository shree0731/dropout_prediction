FROM node:20-alpine

WORKDIR /app

# Copy package manifests and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Expose Gateway API port
EXPOSE 5001

ENV PORT=5001 \
    NODE_ENV=production

CMD ["sh", "-c", "node scripts/check-env.js && node server.js"]
