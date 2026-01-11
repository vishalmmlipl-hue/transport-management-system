#!/bin/bash
# Fresh Deployment Script for mmlipl.in on Hostinger

echo "🚀 Starting fresh deployment for mmlipl.in"
echo ""

# Site root path
SITE_ROOT="/home/mmlipl/htdocs/mmlipl.in"
SERVER_DIR="$SITE_ROOT/server"
PUBLIC_DIR="$SITE_ROOT/public"

echo "📍 Site location: $SITE_ROOT"
echo ""

# Step 1: Check/create directories
echo "📁 Step 1: Creating directory structure..."
mkdir -p "$PUBLIC_DIR"
mkdir -p "$SERVER_DIR"
echo "✅ Directories created"
echo ""

# Step 2: Check current contents
echo "📋 Step 2: Current directory contents..."
ls -la "$SITE_ROOT" 2>/dev/null || echo "  Directory doesn't exist yet"
echo ""

# Step 3: Set permissions
echo "🔐 Step 3: Setting permissions..."
chown -R mmlipl:mmlipl "$SITE_ROOT"
chmod -R 755 "$SITE_ROOT"
echo "✅ Permissions set"
echo ""

echo "✅ Ready for file upload!"
echo ""
echo "Next steps:"
echo "1. Upload backend: scp -r server root@31.97.107.232:$SERVER_DIR/"
echo "2. Upload frontend: scp -r build/* root@31.97.107.232:$PUBLIC_DIR/"
echo "3. Install backend: cd $SERVER_DIR && npm install && npm run init-db"
echo "4. Start PM2: pm2 start server.js --name mmlipl-api"
echo "5. Configure Nginx: Add /api proxy to /etc/nginx/sites-enabled/mmlipl.in.conf"
