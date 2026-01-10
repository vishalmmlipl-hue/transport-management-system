#!/bin/bash

# Script to prepare project for Netlify deployment

echo "=========================================="
echo "Preparing for Netlify Deployment"
echo "=========================================="
echo ""

# Remove backup files
echo "1. Removing backup files..."
find . -name "*.bak" -type f -delete
echo "   ✅ Backup files removed"
echo ""

# Check git status
echo "2. Checking Git status..."
git status --short
echo ""

# Check if remote is configured
echo "3. Checking Git remote..."
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   Remote URL: $REMOTE_URL"
    if [[ "$REMOTE_URL" == *"YOUR_USERNAME"* ]] || [[ "$REMOTE_URL" == *"YOUR_REPO"* ]]; then
        echo "   ⚠️  WARNING: Remote URL contains placeholder!"
        echo "   Please update it with: git remote set-url origin https://github.com/YOUR_USERNAME/transport-management-system.git"
    else
        echo "   ✅ Remote URL looks good"
    fi
else
    echo "   ⚠️  No remote configured"
    echo "   Add remote with: git remote add origin https://github.com/YOUR_USERNAME/transport-management-system.git"
fi
echo ""

# Test build
echo "4. Testing build..."
if npm run build > /dev/null 2>&1; then
    echo "   ✅ Build successful!"
    echo "   Build folder created: build/"
else
    echo "   ❌ Build failed! Please check errors above"
    exit 1
fi
echo ""

echo "=========================================="
echo "✅ Ready for Deployment!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Commit changes:"
echo "   git add ."
echo "   git commit -m 'Ready for Netlify deployment'"
echo ""
echo "2. Push to GitHub:"
echo "   git push origin main"
echo ""
echo "3. Deploy on Netlify:"
echo "   - Go to https://app.netlify.com"
echo "   - Add new site → Import from GitHub"
echo "   - Select 'transport-management-system'"
echo "   - Click 'Deploy site'"
echo ""

