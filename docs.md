# Temari Backend Server (n8n & Cloudflare)

This directory (`~/temari-server`) contains the infrastructure that powers your automation backend. Because I set it up automatically, this document explains exactly what is running under the hood so it no longer feels like a black box.

## The Architecture
We are using **Docker Compose** to run two synchronized services on this Ubuntu laptop. The instructions for these services are located in the `docker-compose.yml` file.

### 1. n8n (The Brain)
- **What it is:** An advanced workflow automation tool (like Zapier, but self-hosted and unlimited).
- **How it runs:** It runs inside a secure Docker container (`n8n_production`).
- **Where the data lives:** Your workflows, credentials, and settings are NOT stored temporarily. They are saved in a persistent Docker volume called `n8n_data`. Even if the laptop restarts or the container crashes, you will not lose your workflows.
- **Local Access:** It runs on port `5678`. If you are physically on this laptop, you can view it at `http://localhost:5678`.

### 2. Cloudflare Tunnel (The Bridge)
- **What it is:** A reverse proxy (`cloudflare_anonymous_tunnel`). 
- **Why we need it:** Telegram Webhooks (which we need for the bot to send us files) *require* a public `https://` URL. Since this is a local laptop on a home network, it doesn't have a public IP. Cloudflare securely bridges your local port 5678 to a public `trycloudflare.com` URL without you needing to hack your router or mess with port forwarding.
- **Security:** It only exposes n8n, nothing else on your laptop.

## Cheat Sheet (Server Commands)
If you ever need to manage the server, open the terminal on this laptop and run these commands from inside the `~/temari-server` folder:

- **Check if it's running:** `docker ps`
- **Stop the server:** `docker-compose down`
- **Start the server:** `docker-compose up -d`
- **Find the public URL:** `docker-compose logs cloudflared | grep trycloudflare`
