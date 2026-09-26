
## 🛠 Troubleshooting: "The DNS server returned an error"

When your server laptop goes to sleep, changes WiFi networks, or temporarily loses internet connection, the laptop itself reconnects fine, but Docker's internal networking (DNS cache) can sometimes get stuck. 
This causes nodes like Google Gemini or HTTP Request to fail with a "DNS server returned an error" message because n8n can't resolve external web addresses.

Here is exactly how to fix it yourself from the terminal:

**Step 1: Restart the n8n Container**
Restarting the container flushes its network cache and reconnects it to the internet. Run this:
```bash
cd ~/temari-server
docker compose restart n8n
```

**Step 2: Refresh your Browser**
Wait about 5 seconds for n8n to boot back up, then refresh your n8n browser tab. Your nodes will now be able to reach the internet perfectly.
