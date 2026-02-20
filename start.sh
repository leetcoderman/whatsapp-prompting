#!/bin/bash
# ─────────────────────────────────────────────
# WhatsApp Personal Bot — Background Launcher
# ─────────────────────────────────────────────
# This script:
# 1. Prevents Mac from sleeping (via caffeinate)
# 2. Starts the bot with PM2 (auto-restarts on crash)

BOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Starting Personal Bot in background..."

# Start the bot with PM2 (or restart if already running)
cd "$BOT_DIR"
pm2 start bot.js --name "personal-bot" --update-env 2>/dev/null || pm2 restart personal-bot

# Prevent Mac from sleeping while on power adapter
# -s = prevent system sleep (works when lid is closed IF on charger)
# -i = prevent idle sleep
caffeinate -s -i -w $(pm2 pid personal-bot) &

echo ""
echo "✅ Personal Bot is running in the background!"
echo ""
echo "📋 Useful commands:"
echo "   pm2 logs personal-bot     # View live logs"
echo "   pm2 status                # Check if bot is running"
echo "   pm2 restart personal-bot  # Restart the bot"
echo "   pm2 stop personal-bot     # Stop the bot"
echo ""
echo "⚡ The Mac will stay awake while plugged in."
echo "   If you close the lid ON BATTERY, the bot will pause."
echo "   It auto-resumes when you open the lid or plug in."
