## 🛠 Troubleshooting: "Bad Request: bad webhook"

Cloudflare Quick Tunnels (`trycloudflare.com`) are free and temporary. If your laptop goes to sleep or sits idle for several hours, Cloudflare will kill the tunnel connection. 
When this happens, Telegram cannot reach your n8n server, and you will get a `Bad Request: bad webhook: Failed to resolve host` error in n8n.

Here is exactly how to fix it yourself from the terminal on this laptop:

**Step 1: Restart the Cloudflare Tunnel**
```bash
cd ~/temari-server
docker restart cloudflare_anonymous_tunnel
```

**Step 2: Get your NEW Cloudflare URL**
```bash
sleep 3
docker logs cloudflare_anonymous_tunnel 2>&1 | grep trycloudflare | tail -n 1
```
*(Copy the `https://....trycloudflare.com` URL that it prints out. This is your new dashboard link).*

**Step 3: Update n8n with the New URL**
Open your docker config file in a text editor:
```bash
nano docker-compose.yml
```
Look under the `n8n` environment variables for the line that says `- WEBHOOK_URL=https://...`. 
Delete the old URL and paste your NEW Cloudflare URL there. 
Save and exit (Press `Ctrl+O`, hit `Enter`, then press `Ctrl+X`).

**Step 4: Restart n8n to apply the changes**
```bash
docker compose up -d
```
That's it! Your webhooks are fixed. You can now open the new URL in your browser and resume working.
