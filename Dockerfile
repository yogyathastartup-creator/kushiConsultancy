# Node.js backend Dockerfile for Render
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY backend/package.json backend/package-lock.json ./
RUN npm install --production

# Copy source code
COPY backend ./

# Expose port (change if your server uses a different port)
EXPOSE 3001

# Start the server
CMD ["node", "index.js"]
