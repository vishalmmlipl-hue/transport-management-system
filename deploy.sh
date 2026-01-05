#!/bin/bash

# TMS Deployment Script for mmlipl.info
# This script builds and deploys the Transport Management System

set -e

echo "🚀 Starting TMS Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build the application
echo -e "${YELLOW}📦 Building production version...${NC}"
npm run build

if [ ! -d "build" ]; then
    echo "❌ Build failed! build/ directory not found."
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"

# Step 2: Check if deployment directory exists
DEPLOY_DIR="/var/www/mmlipl.info"

if [ -d "$DEPLOY_DIR" ]; then
    echo -e "${YELLOW}📂 Backing up existing deployment...${NC}"
    sudo cp -r "$DEPLOY_DIR" "${DEPLOY_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    
    echo -e "${YELLOW}📤 Copying new build to deployment directory...${NC}"
    sudo rm -rf "$DEPLOY_DIR"/*
    sudo cp -r build/* "$DEPLOY_DIR"/
    sudo chown -R www-data:www-data "$DEPLOY_DIR"
else
    echo -e "${YELLOW}📂 Creating deployment directory...${NC}"
    sudo mkdir -p "$DEPLOY_DIR"
    sudo cp -r build/* "$DEPLOY_DIR"/
    sudo chown -R www-data:www-data "$DEPLOY_DIR"
fi

echo -e "${GREEN}✅ Files copied to $DEPLOY_DIR${NC}"

# Step 3: Check Nginx configuration
echo -e "${YELLOW}🔧 Checking Nginx configuration...${NC}"
if [ -f "nginx.conf" ]; then
    echo "Nginx configuration file found. To apply it:"
    echo "  sudo cp nginx.conf /etc/nginx/sites-available/mmlipl.info"
    echo "  sudo ln -s /etc/nginx/sites-available/mmlipl.info /etc/nginx/sites-enabled/"
    echo "  sudo nginx -t"
    echo "  sudo systemctl restart nginx"
fi

# Step 4: Test Nginx configuration (if nginx is installed)
if command -v nginx &> /dev/null; then
    echo -e "${YELLOW}🧪 Testing Nginx configuration...${NC}"
    sudo nginx -t && echo -e "${GREEN}✅ Nginx configuration is valid${NC}" || echo -e "${YELLOW}⚠️  Nginx configuration has issues${NC}"
fi

echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Ensure your domain mmlipl.info points to this server's IP"
echo "2. Configure Nginx (see nginx.conf)"
echo "3. Restart Nginx: sudo systemctl restart nginx"
echo "4. Visit http://mmlipl.info to test"

