#!/bin/bash
# Check branches on Render.com server

echo "🔍 Checking branches on Render.com server..."
echo ""

API_URL="https://transport-management-system-wzhx.onrender.com/api"

# Fetch branches
response=$(curl -s "${API_URL}/branches")

# Check if curl succeeded
if [ $? -eq 0 ]; then
  echo "✅ Connected to server"
  echo ""
  echo "Response:"
  echo "$response" | head -c 2000
  echo ""
  echo ""
  echo "💡 For formatted output, run:"
  echo "   curl -s '${API_URL}/branches' | python3 -m json.tool"
else
  echo "❌ Failed to connect to server"
fi
