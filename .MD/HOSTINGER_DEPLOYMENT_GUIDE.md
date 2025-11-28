# Hostinger VPS Deployment Guide

This guide explains how to deploy the INTRAK system on a **Hostinger Virtual Private Server (VPS)**. This method gives you full control over the infrastructure and is the most cost-effective solution.

## Prerequisites

1.  **Hostinger VPS:**
    *   **OS:** Ubuntu 22.04 or 24.04 (64-bit).
    *   **Plan:** KVM 1 or higher (at least 2GB RAM recommended).
2.  **Domain Name:** Pointed to your VPS IP address (A Record).
3.  **Tailscale Account:** For NAS connectivity.

## Step 1: Initial Server Setup

1.  **SSH into your VPS:**
    ```bash
    ssh root@<your_vps_ip>
    ```
2.  **Update System:**
    ```bash
    apt update && apt upgrade -y
    ```
3.  **Install Docker & Docker Compose:**
    ```bash
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    ```

## Step 2: Prepare the Project

1.  **Clone your Repository:**
    ```bash
    git clone https://github.com/joash-dev/intrak_v2.git
    cd intrak_v2
    ```
2.  **Create Production Environment File:**
    Create a `.env` file in the root directory:
    ```bash
    nano .env
    ```
    Paste the following (update with your real values):
    ```env
    # Database
    POSTGRES_USER=intrak
    POSTGRES_PASSWORD=secure_password_here
    POSTGRES_DB=intrak_db
    DATABASE_URL=postgresql://intrak:secure_password_here@db:5432/intrak_db
    
    # App Secrets
    JWT_SECRET=generate_a_long_random_string
    
    # NAS / Tailscale
    USE_NAS=true
    TAILSCALE_AUTH_KEY=tskey-auth-xxxxxx-xxxxxx
    NAS_HOST=100.x.x.x
    NAS_SHARE_NAME=Serber
    NAS_USERNAME=nas_user
    NAS_PASSWORD=nas_password
    
    # Client
    VITE_API_URL=http://<your_vps_ip>:5000
    ```
    Save and exit (`Ctrl+X`, `Y`, `Enter`).

## Step 3: Deployment (Docker Compose)

We will use a production-ready Docker Compose file.

1.  **Create `docker-compose.prod.yml`:**
    ```bash
    nano docker-compose.prod.yml
    ```
    Paste the content below:

    ```yaml
    version: '3.8'

    services:
      db:
        image: postgres:14-alpine
        restart: always
        environment:
          POSTGRES_USER: ${POSTGRES_USER}
          POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
          POSTGRES_DB: ${POSTGRES_DB}
        volumes:
          - db_data:/var/lib/postgresql/data

      server:
        build:
          context: ./server
          dockerfile: Dockerfile
        restart: always
        ports:
          - "5000:5000"
        environment:
          - DATABASE_URL=${DATABASE_URL}
          - JWT_SECRET=${JWT_SECRET}
          - USE_NAS=${USE_NAS}
          - TAILSCALE_AUTH_KEY=${TAILSCALE_AUTH_KEY}
          - NAS_HOST=${NAS_HOST}
          - NAS_SHARE_NAME=${NAS_SHARE_NAME}
          - NAS_USERNAME=${NAS_USERNAME}
          - NAS_PASSWORD=${NAS_PASSWORD}
        cap_add:
          - NET_ADMIN
        devices:
          - /dev/net/tun:/dev/net/tun
        depends_on:
          - db

      client:
        build:
          context: ./client
          dockerfile: Dockerfile
        restart: always
        ports:
          - "80:80"
        environment:
          - VITE_API_URL=${VITE_API_URL}
        depends_on:
          - server

    volumes:
      db_data:
    ```

2.  **Start the Application:**
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```

## Step 4: Verification

1.  **Check Logs:**
    ```bash
    docker compose -f docker-compose.prod.yml logs -f server
    ```
    Look for:
    *   `✅ Created /dev/net/tun`
    *   `✅ Tailscale connected successfully`
    *   `✅ NAS mounted successfully`

2.  **Access the App:**
    Open `http://<your_vps_ip>` in your browser.

## Troubleshooting

*   **Tailscale Error:** If you see `/dev/net/tun` errors, ensure your VPS supports it (Hostinger KVM does).
*   **Database Connection:** Ensure the `DATABASE_URL` uses `db` as the hostname (not localhost).
