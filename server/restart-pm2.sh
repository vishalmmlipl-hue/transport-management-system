#!/bin/bash
# Script to restart PM2 and verify the fix

echo "🔄 Restarting PM2 to load updated server.js..."
pm2 stop mmlipl-api
sleep 2
pm2 start mmlipl-api
sleep 2

echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📋 Recent logs (last 10 lines):"
pm2 logs mmlipl-api --lines 10 --nostream

echo ""
echo "✅ PM2 restarted. Try creating a user now!"
