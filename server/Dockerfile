FROM node:22-slim

WORKDIR /app

# Switch to root for system setup
USER root
RUN apt-get update && \
    apt-get install -y curl ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    chown -R node:node /app

# Switch to node user for npm operations
USER node

# Copy package files
COPY --chown=node:node package*.json ./

# Install dependencies as node user
RUN npm install

# Copy source code
COPY --chown=node:node . .

# Generate Prisma Client (needed for TypeScript types)
RUN npx prisma generate

# Build TypeScript (using build config that allows implicit any for deployment)
RUN npx tsc -p tsconfig.build.json

# Copy templates to dist folder (templates are needed at runtime)
RUN mkdir -p dist/templates && cp -r src/templates/* dist/templates/

# Copy startup script
USER root
COPY scripts/aws-start.sh /app/scripts/aws-start.sh
RUN chmod +x /app/scripts/aws-start.sh

# Expose port
EXPOSE 5000

# Start the server
CMD ["bash", "scripts/aws-start.sh"]
