#!/bin/bash
# Script to verify user creation fix is working

DB_PATH="/home/mmlipl/htdocs/mmlipl.in/server/tms_database.db"
API_URL="https://mmlipl.in/api/users"

echo "🔍 Verifying User Creation Fix..."
echo ""

# 1. Check if server.js has the fix
echo "1️⃣ Checking server.js fix..."
if grep -q "skipFields.*lastLogin" /home/mmlipl/htdocs/mmlipl.in/server/server.js; then
    echo "   ✅ Fix found in server.js"
    grep -n "skipFields.*lastLogin" /home/mmlipl/htdocs/mmlipl.in/server/server.js | head -1
else
    echo "   ❌ Fix NOT found in server.js"
    exit 1
fi
echo ""

# 2. Check PM2 status
echo "2️⃣ Checking PM2 status..."
pm2 status mmlipl-api
echo ""

# 3. Check recent server logs for errors
echo "3️⃣ Recent server logs (last 20 lines)..."
pm2 logs mmlipl-api --lines 20 --nostream
echo ""

# 4. Test creating a user via API
echo "4️⃣ Testing user creation via API..."
TEST_USER='{
  "username": "test_'$(date +%s)'",
  "password": "test123",
  "userRole": "Admin",
  "code": "TEST'$(date +%s)'",
  "status": "Active",
  "email": "test@example.com",
  "mobile": "1234567890",
  "branch": "",
  "linkedStaff": "",
  "accessPermissions": {"lr": true},
  "remarks": "Test user"
}'

echo "   Sending POST request..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$TEST_USER")

echo "   Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# 5. Check user count
echo "5️⃣ Current user count:"
COUNT=$(curl -s "$API_URL" | jq '.data | length' 2>/dev/null || echo "0")
echo "   Users via API: $COUNT"
DB_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
echo "   Users in database: $DB_COUNT"
echo ""

# 6. List all users
if [ "$DB_COUNT" -gt 0 ]; then
    echo "6️⃣ Users in database:"
    sqlite3 "$DB_PATH" "SELECT id, username, userRole, status, createdAt FROM users ORDER BY createdAt DESC;" 2>/dev/null
else
    echo "6️⃣ No users found in database"
fi
echo ""

echo "✅ Verification complete!"
