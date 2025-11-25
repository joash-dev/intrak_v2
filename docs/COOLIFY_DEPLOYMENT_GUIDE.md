# Coolify Deployment Guide (Self-Hosted PaaS)

This guide explains how to deploy the INTRAK system using **Coolify**, a self-hosted PaaS alternative to Railway/Fly.io. This is the **recommended** approach for full control over the infrastructure, specifically for enabling the NAS integration via Tailscale.

## Why Coolify?

*   **Full Control:** You own the server (VPS), so you can enable the necessary kernel modules (`tun`) for Tailscale without asking support.
*   **Cost Effective:** You can run the entire stack on a $5-6/mo VPS (e.g., Hetzner, DigitalOcean).
*   **Ease of Use:** Provides a UI similar to Vercel/Railway.

## Prerequisites

1.  **A Virtual Private Server (VPS):**
    *   **Provider:** Hetzner (recommended for price), DigitalOcean, Linode, or Vultr.
    *   **OS:** Ubuntu 22.04 or 24.04 LTS.
    *   **Specs:** Minimum 2GB RAM (4GB recommended for build processes).
2.  **Domain Name:** Pointed to your VPS IP address.

## Step 1: Install Coolify

1.  SSH into your VPS:
    ```bash
    ssh root@<your-vps-ip>
    ```
2.  Run the installation script:
    ```bash
    curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
    ```
3.  Wait for the installation to complete (5-10 minutes).
4.  Access the dashboard at `http://<your-vps-ip>:8000`.
5.  Create your admin account.

## Step 2: Setup Project

1.  **Create a Project:** Click "+ New Project" -> "Production".
2.  **Add Resource:** Select "Application".
3.  **Source:** Select "GitHub/GitLab" (connect your repository) or "Public Repository" if public.
4.  **Repository:** Select `joash-dev/intrak_v2`.
5.  **Build Pack:** Select "Docker Compose" or "Dockerfile".
    *   **Recommended:** Use **Docker Compose** if you want to deploy both Client and Server together easily.
    *   **Alternative:** Deploy Server and Client as separate resources using "Dockerfile".

### Option A: Deploying Server (Backend)

1.  Select the `server` directory as the **Base Directory**.
2.  **Configuration:**
    *   **Port:** 5000
    *   **Build Pack:** Dockerfile
    *   **Docker Image:** `node:18` (or let it auto-detect from Dockerfile)
3.  **Environment Variables:**
    Add the following secrets in the "Environment Variables" tab:
    ```env
    DATABASE_URL=postgresql://... (Your Render/Supabase DB or a local DB in Coolify)
    DIRECT_URL=postgresql://...
    JWT_SECRET=your_secret
    
    # NAS / Tailscale Config
    USE_NAS=true
    TAILSCALE_AUTH_KEY=tskey-auth-...
    NAS_HOST=100.x.x.x (Tailscale IP of NAS)
    NAS_SHARE_NAME=Serber
    NAS_USERNAME=your_nas_user
    NAS_PASSWORD=your_nas_password
    ```

### Step 3: Enable TUN Device (CRITICAL)

This is the most important step for NAS integration.

1.  In your Coolify Application settings, go to **"Docker Options"** or **"Advanced"**.
2.  Look for **"Docker Run Options"** or **"Custom Docker Options"**.
3.  Add the following flags to give the container network privileges:
    ```bash
    --cap-add=NET_ADMIN --device=/dev/net/tun
    ```
    *If Coolify's UI doesn't have a direct field for this yet, you may need to use a `docker-compose.yml` deployment instead.*

#### Using Docker Compose (Recommended for Privileges)

If the UI options are limited, switch your deployment type to **Docker Compose**.

1.  Create a `docker-compose.yml` in your project root (or copy this into Coolify's editor):

```yaml
version: '3.8'
services:
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    image: intrak-server
    container_name: intrak-server
    cap_add:
      - NET_ADMIN
    devices:
      - /dev/net/tun:/dev/net/tun
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - DIRECT_URL=${DIRECT_URL}
      - JWT_SECRET=${JWT_SECRET}
      - USE_NAS=true
      - TAILSCALE_AUTH_KEY=${TAILSCALE_AUTH_KEY}
      - NAS_HOST=${NAS_HOST}
      - NAS_SHARE_NAME=${NAS_SHARE_NAME}
      - NAS_USERNAME=${NAS_USERNAME}
      - NAS_PASSWORD=${NAS_PASSWORD}
    ports:
      - "5000:5000"
    restart: always

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - server
```

## Step 4: Deploy

1.  Click **"Deploy"**.
2.  Watch the "Build Logs".
3.  Once deployed, check "Application Logs" to verify Tailscale connection:
    ```
    ✅ Created /dev/net/tun
    ✅ tailscaled socket ready
    ✅ Tailscale connected successfully
    ✅ NAS mounted successfully
    ```

## Troubleshooting

*   **"Operation not permitted"**: Ensure `--cap-add=NET_ADMIN` is active.
*   **"/dev/net/tun not found"**: Ensure `--device=/dev/net/tun` is active.
*   **Database Connection**: If using a database hosted *outside* Coolify (like Render), ensure "Public Access" is enabled or whitelist the VPS IP.
