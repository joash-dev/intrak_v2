FROM node:18

WORKDIR /app

# Install system dependencies as root
USER root
RUN apt-get update && \
    apt-get install -y curl cifs-utils ca-certificates gnupg && \
    curl -fsSL https://pkgs.tailscale.com/stable/debian/bookworm.noarmor.gpg | tee /usr/share/keyrings/tailscale-archive-keyring.gpg >/dev/null && \
    curl -fsSL https://pkgs.tailscale.com/stable/debian/bookworm.tailscale-keyring.list | tee /etc/apt/sources.list.d/tailscale.list >/dev/null && \
    apt-get update && \
    apt-get install -y tailscale || echo "⚠️ Tailscale installation failed - will continue without it" && \
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

# Build TypeScript
RUN npm run build

# Copy startup script (switch to root for mounting, but keep app owned by node)
USER root
COPY scripts/render-start.sh /app/scripts/
RUN chmod +x /app/scripts/render-start.sh

# Expose port
EXPOSE 5000

# Run as root to allow mounting (container is isolated, so this is safe)
USER root

# Use startup script
CMD ["bash", "scripts/render-start.sh"]

