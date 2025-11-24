FROM node:18

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y cifs-utils tailscale && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Copy startup script
COPY scripts/render-start.sh /app/scripts/
RUN chmod +x /app/scripts/render-start.sh

# Expose port
EXPOSE 5000

# Use startup script
CMD ["bash", "scripts/render-start.sh"]

