# INTRAK - Raspberry Pi Deployment Guide

This guide details how to host the INTRAK system on a Raspberry Pi 4 (or 5) at home, using Cloudflare Tunnel for secure internet access and a local network connection to your NAS.

## Prerequisites

*   **Raspberry Pi 4/5** (4GB+ RAM recommended)
*   User account with `sudo` privileges.
*   **NAS** on the same local network.
*   **Cloudflare Account** (Free tier is sufficient).
*   **Domain Name** managed by active on Cloudflare.

---

## Part 1: System Preparation

### 1. Install Docker
Run the following commands on your Raspberry Pi:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (avoid sudo for docker commands)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install -y docker-compose-plugin
```
*Logout and log back in for the group changes to take effect.*

### 2. Prepare Directories
Navigate to where you want to store the project (e.g., `~/intrak_v2`):

```bash
mkdir -p ~/intrak_v2
cd ~/intrak_v2
# Clone your repo or copy files here
```

---

## Part 2: Connect the NAS

We will mount the NAS directly to the Raspberry Pi's operating system. This is more stable than mounting it inside Docker.

### 1. Create Mount Point
```bash
sudo mkdir -p /mnt/nas-intrak
```

### 2. Manual Test Mount
Replace `NAS_IP`, `SHARE_NAME`, `USERNAME`, and `PASSWORD` with your details.
**Crucial:** We use `uid=1000,gid=1000` so the Docker container (running as user 1000) can read/write.

```bash
sudo mount -t cifs //NAS_IP/SHARE_NAME /mnt/nas-intrak -o username=USERNAME,password=PASSWORD,uid=1000,gid=1000,file_mode=0777,dir_mode=0777
```

Check if it works:
```bash
ls -l /mnt/nas-intrak
touch /mnt/nas-intrak/test_file
rm /mnt/nas-intrak/test_file
```

### 3. Persistent Mount (Auto-mount on boot)
Edit `/etc/fstab`:
```bash
sudo nano /etc/fstab
```
Add this line at the end (keep it on one line):
```text
//NAS_IP/SHARE_NAME /mnt/nas-intrak cifs username=USERNAME,password=PASSWORD,uid=1000,gid=1000,file_mode=0777,dir_mode=0777,_netdev 0 0
```
*Note: For better security, consider using a credentials file instead of putting passwords in fstab.*

Test the auto-mount:
```bash
sudo umount /mnt/nas-intrak
sudo mount -a
ls /mnt/nas-intrak
```

---

## Part 3: Cloudflare Tunnel Setup

1.  Go to **Cloudflare Zero Trust Dashboard** > **Networks** > **Tunnels**.
2.  Click **Create a Tunnel**.
3.  Name it (e.g., "intrak-pi") and save.
4.  copy the **Token** shown (The installed command looks like `cloudflared service install <TOKEN>`). You ONLY need the token string.
5.  In the Dashboard, configure the **Public Hostname**:
    *   **Domain**: `intrak.site` (or your subdomain)
    *   **Service**:
        *   Type: `HTTP`
        *   URL: `client:80` (This points to the client container in Docker)

---

## Part 4: Deployment

### 1. Configure Environment
Create a `.env` file in your project directory (copy from `.env.example` if available).
Ensure these values are set:

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_db_password
POSTGRES_DB=intrak

# App URLs
CLIENT_URL=https://intrak.site
CORS_ORIGIN=https://intrak.site

# Cloudflare
TUNNEL_TOKEN=eyJhIjoi... (Your Token from Part 3)

# AI & Email Keys (Same as before)
GEMINI_API_KEY=...
RESEND_API_KEY=...
```

### 2. Start the System
Use the new RPi compose file:

```bash
docker compose -f docker-compose.rpi.yml up -d --build
```

### 3. Verify
*   Check containers: `docker compose -f docker-compose.rpi.yml ps`
*   Check logs: `docker compose -f docker-compose.rpi.yml logs -f`
*   Visit: `https://intrak.site`

---

## Troubleshooting

**"Permission Denied" on uploads:**
Ensure your NAS mount has `uid=1000,gid=1000`. Run `ls -l /mnt/nas-intrak` on the Pi. The owner should be your user (1000), not root.

**Cloudflare "Bad Gateway":**
Check if the `tunnel` container is running. Check if `client` container is running.
Verify in Cloudflare Dashboard that the Service URL is `client:80`.

**Database errors:**
If moving from VPS to Pi, you are starting with an **empty database**. You need to run migrations inside the container if they didn't run automatically:
```bash
docker compose -f docker-compose.rpi.yml exec server npx prisma migrate deploy
```
