FROM node:18

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y curl cifs-utils ca-certificates && \
    curl -fsSL -o /tmp/tailscale.deb https://pkgs.tailscale.com/stable/tailscale_latest_amd64.deb && \
    dpkg -i /tmp/tailscale.deb || apt-get install -f -y && \
    rm -rf /var/lib/apt/lists/* /tmp/tailscale.deb

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

# Run as root to allow mounting (container is isolated, so this is safe)
USER root

# Use startup script
CMD ["bash", "scripts/render-start.sh"]

