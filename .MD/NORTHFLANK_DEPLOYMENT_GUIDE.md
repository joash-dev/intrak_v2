# Northflank Deployment Guide

This guide explains how to deploy the INTRAK system using **Northflank**, a managed PaaS provider that offers native integration with Tailscale, making it the ideal choice for our NAS architecture.

## Why Northflank?

*   **Native Tailscale Support:** Northflank has built-in support for Tailscale. You don't need to manage sidecar containers or complex permissions. You simply link your Tailscale account, and your services join your private network.
*   **Managed Infrastructure:** Like Railway/Render, Northflank manages the servers for you. You don't need to worry about OS updates or security patches.
*   **Cost Effective:** Offers a generous free tier and competitive pricing for persistent workloads.

## Prerequisites

1.  **Northflank Account:** Sign up at [northflank.com](https://northflank.com).
2.  **Tailscale Account:** Ensure you have a Tailscale account and your NAS is connected to it.
3.  **GitHub Repository:** Your `intrak_v2` code should be pushed to GitHub.

## Step 1: Create a Project

1.  Log in to Northflank.
2.  Click **"Create Project"**.
3.  Name it `intrak-v2` and select a region close to you (e.g., Asia).

## Step 2: Configure Tailscale Integration

This is the most critical step.

1.  In your Northflank Project, go to **"Integrations"**.
2.  Select **"Tailscale"**.
3.  Click **"Connect Tailscale"**.
4.  You will be redirected to Tailscale to authorize Northflank.
5.  Once authorized, you can configure which services in this project will join your Tailscale network.

## Step 3: Deploy the Database

1.  In your project, click **"Create New"** -> **"Addon"**.
2.  Select **"PostgreSQL"**.
3.  Name: `intrak-db`.
4.  Plan: Select the appropriate plan (Development or Production).
5.  Click **"Create Addon"**.
6.  Once created, go to the **"Connection Details"** tab to get your `DATABASE_URL`.

## Step 4: Deploy the Backend (Server)

1.  Click **"Create New"** -> **"Service"**.
2.  **Service Type:** Combined Service (Build & Run).
3.  **Repository:** Select your `intrak_v2` repository.
4.  **Build Settings:**
    *   **Context:** `server` (Important: Point to the server folder).
    *   **Dockerfile:** `Dockerfile` (It should auto-detect `server/Dockerfile`).
5.  **Environment Variables:**
    *   `DATABASE_URL`: (Paste from Step 3)
    *   `DIRECT_URL`: (Paste same as DATABASE_URL)
    *   `JWT_SECRET`: (Generate a secure random string)
    *   `USE_NAS`: `true`
    *   `NAS_HOST`: (Your NAS Tailscale IP, e.g., `100.x.x.x`)
    *   `NAS_SHARE_NAME`: `Serber`
    *   `NAS_USERNAME`: (Your NAS user)
    *   `NAS_PASSWORD`: (Your NAS password)
6.  **Networking:**
    *   **Port:** 5000
    *   **Public Access:** Enabled (HTTP/HTTPS).
7.  **Tailscale Network:**
    *   Enable the **"Join Tailscale Network"** toggle.
    *   This automatically injects the necessary sidecars/permissions.
8.  Click **"Create Service"**.

## Step 5: Deploy the Frontend (Client)

1.  Click **"Create New"** -> **"Service"**.
2.  **Service Type:** Combined Service.
3.  **Repository:** Select `intrak_v2`.
4.  **Build Settings:**
    *   **Context:** `client`.
    *   **Dockerfile:** `Dockerfile`.
5.  **Environment Variables:**
    *   `VITE_API_URL`: The public URL of your Backend service (from Step 4).
6.  **Networking:**
    *   **Port:** 80 (or 3000, depending on your Dockerfile).
    *   **Public Access:** Enabled.
7.  Click **"Create Service"**.

## Step 6: Verification

1.  Check the **Logs** of your Backend service.
2.  You should see messages indicating successful NAS connection:
    ```
    ✅ NAS mounted successfully at /mnt/nas/intrak
    ```
    *Note: Since Northflank handles Tailscale natively, you might not see the specific "Tailscale connected" logs from our custom script, but the NAS mount should succeed if the network is active.*

## Troubleshooting

*   **NAS Connection Failed:**
    *   Verify the `NAS_HOST` IP is correct (check Tailscale admin console).
    *   Ensure the NAS is online and the "Serber" share is accessible.
    *   Check Northflank's "Integrations" page to ensure the Tailscale link is "Healthy".
