#!/bin/bash

# 1. Setup n8n server
mkdir -p ~/temari-server
cd ~/temari-server

cat << 'INNER_EOF' > docker-compose.yml
version: '3.8'
volumes:
  n8n_data:
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    container_name: n8n_production
    restart: always
    ports:
      - "5678:5678"
    environment:
      - NODE_ENV=production
    volumes:
      - n8n_data:/home/node/.n8n
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflare_anonymous_tunnel
    restart: always
    command: tunnel --url http://n8n:5678
    depends_on:
      - n8n
INNER_EOF

# Start Docker using sudo with the password
echo "lalaqwk12" | sudo -S docker compose up -d

# 2. Clone the Next.js app (if it doesn't exist)
cd ~
if [ ! -d "ethio-exam-app" ]; then
  git clone https://github.com/devAbdujs/weather-app-tutorial.git ethio-exam-app
fi

# 3. Install NPM dependencies
cd ethio-exam-app
npm install

# 4. Extract the Cloudflare URL
echo "Waiting for Cloudflare tunnel to stabilize..."
sleep 10
echo "lalaqwk12" | sudo -S docker compose -f ~/temari-server/docker-compose.yml logs cloudflared | grep "trycloudflare.com" | tail -n 1 > ~/cloudflare_url.txt
