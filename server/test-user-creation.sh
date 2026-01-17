#!/bin/bash
# Test script to create a user via API and verify it's saved

DB_PATH="/home/mmlipl/htdocs/mmlipl.in/server/tms_database.db"
API_URL="https://mmlipl.in/api/users"

echo "🧪 Testing User Creation..."
echo ""

# Test 1: Check current user count
echo "📊 Current users in database:"
sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0"
echo ""

# Test 2: Create a test user via API
echo "📝 Creating test user via API..."
TEST_USER='{
  "username": "testuser_'$(date +%s)'",
  "password": "testpass123",
  "userRole": "Admin",
  "code": "TEST001",
  "status": "Active",
  "email": "test@example.com",
  "mobile": "1234567890",
  "branch": "",
  "linkedStaff": "",
  "accessPermissions": {"lr": true, "invoice": true},
  "remarks": "Test user created by script"
}'

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$TEST_USER")

echo "API Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 3: Check user count after creation
echo "📊 Users in database after creation:"
sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0"
echo ""

# Test 4: List all users
echo "👥 All users in database:"
sqlite3 "$DB_PATH" "SELECT id, username, userRole, status, createdAt FROM users ORDER BY createdAt DESC;" 2>/dev/null
echo ""

echo "✅ Test complete!"
