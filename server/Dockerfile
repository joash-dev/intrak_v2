FROM node:18

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y curl cifs-utils ca-certificates gnupg && \
    curl -fsSL https://pkgs.tailscale.com/stable/debian/bookworm.noarmor.gpg | tee /usr/share/keyrings/tailscale-archive-keyring.gpg >/dev/null && \
    curl -fsSL https://pkgs.tailscale.com/stable/debian/bookworm.tailscale-keyring.list | tee /etc/apt/sources.list.d/tailscale.list >/dev/null && \
    apt-get update && \
    apt-get install -y tailscale || echo "⚠️ Tailscale installation failed - will continue without it" && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies (as root, then fix ownership and permissions)
RUN npm install && \
    chown -R node:node /app && \
    chmod -R +x node_modules/.bin || true

# Copy source code and fix ownership
COPY --chown=node:node . .

# Ensure we're running as node user for build
USER node

# Build TypeScript
RUN npm run build

# Copy startup script (switch back to root temporarily)
USER root
COPY scripts/render-start.sh /app/scripts/
RUN chmod +x /app/scripts/render-start.sh && \
    chown -R node:node /app

# Expose port
EXPOSE 5000

# Run as root to allow mounting (container is isolated, so this is safe)
USER root

# Use startup script
CMD ["bash", "scripts/render-start.sh"]

