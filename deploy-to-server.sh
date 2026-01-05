#!/bin/bash

# Deploy TMS to mmlipl.info server
# Usage: ./deploy-to-server.sh username@ip-address
# Example: ./deploy-to-server.sh root@75.2.60.5

if [ -z "$1" ]; then
    echo "Usage: $0 username@ip-address"
    echo "Example: $0 root@75.2.60.5"
    echo ""
    echo "Your server IPs:"
    echo "  - 75.2.60.5"
    echo "  - 99.83.190.102"
    exit 1
fi

SERVER="$1"
BUILD_DIR="/Users/macbook/transport-management-system/build"
NGINX_CONF="/Users/macbook/transport-management-system/nginx.conf"

echo "🚀 Deploying TMS to $SERVER"
echo ""

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found: $BUILD_DIR"
    echo "Run: npm run build"
    exit 1
fi

# Check if nginx.conf exists
if [ ! -f "$NGINX_CONF" ]; then
    echo "❌ nginx.conf not found: $NGINX_CONF"
    exit 1
fi

echo "📦 Step 1: Copying build files..."
scp -r "$BUILD_DIR"/* "$SERVER:/tmp/tms-build/" || {
    echo "❌ Failed to copy files. Check SSH connection."
    exit 1
}

echo "✅ Files copied"
echo ""

echo "📄 Step 2: Copying nginx configuration..."
scp "$NGINX_CONF" "$SERVER:/tmp/nginx.conf" || {
    echo "❌ Failed to copy nginx.conf"
    exit 1
}

echo "✅ Nginx config copied"
echo ""

echo "⚙️  Step 3: Setting up on server..."
echo "Run these commands on your server:"
echo ""
echo "ssh $SERVER"
echo ""
echo "Then run:"
echo "sudo mkdir -p /var/www/mmlipl.info"
echo "sudo cp -r /tmp/tms-build/* /var/www/mmlipl.info/"
echo "sudo chown -R www-data:www-data /var/www/mmlipl.info"
echo "sudo chmod -R 755 /var/www/mmlipl.info"
echo "sudo mv /tmp/nginx.conf /etc/nginx/sites-available/mmlipl.info"
echo "sudo ln -s /etc/nginx/sites-available/mmlipl.info /etc/nginx/sites-enabled/"
echo "sudo nginx -t"
echo "sudo systemctl restart nginx"
echo ""
echo "Or run this all-in-one command:"
echo "ssh $SERVER 'sudo mkdir -p /var/www/mmlipl.info && sudo cp -r /tmp/tms-build/* /var/www/mmlipl.info/ && sudo chown -R www-data:www-data /var/www/mmlipl.info && sudo chmod -R 755 /var/www/mmlipl.info && sudo mv /tmp/nginx.conf /etc/nginx/sites-available/mmlipl.info && sudo ln -s /etc/nginx/sites-available/mmlipl.info /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl restart nginx'"

