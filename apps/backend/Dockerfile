# Development Dockerfile for NestJS
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (without frozen lockfile for development)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start in development mode with hot reload
CMD ["npm", "run", "start:dev"]
