import requests
import json

BOT_TOKEN = "8400954528:AAFSgBJyWAbAFUa9I_r5FBPmkDBHXW_Ures"
# Telegram strictly requires an HTTPS URL for Mini Apps. 
# If you are testing locally, you can use an ngrok HTTPS URL here.
# If you deployed to Vercel, put your vercel URL here (e.g., "https://temari-exam.vercel.app")
WEB_APP_URL = "YOUR_HTTPS_URL_HERE" 

if WEB_APP_URL == "YOUR_HTTPS_URL_HERE":
    print("❌ Please edit this script and replace 'YOUR_HTTPS_URL_HERE' with your actual HTTPS URL.")
    exit(1)

# 1. Set the Menu Button (The big button on the bottom left)
print("Configuring Menu Button...")
menu_res = requests.post(
    f"https://api.telegram.org/bot{BOT_TOKEN}/setChatMenuButton",
    json={
        "menu_button": {
            "type": "web_app",
            "text": "Open App 🚀",
            "web_app": {"url": WEB_APP_URL}
        }
    }
)
print("Menu Button Response:", menu_res.json())

# 2. Set the default Bot Commands (optional but good for UX)
print("Configuring Bot Commands...")
commands_res = requests.post(
    f"https://api.telegram.org/bot{BOT_TOKEN}/setMyCommands",
    json={
        "commands": [
            {"command": "start", "description": "Launch the Mini App"}
        ]
    }
)
print("Commands Response:", commands_res.json())

print("\n✅ Bot configuration complete! If the URL is valid, the 'Open App' button will now appear in your bot.")
