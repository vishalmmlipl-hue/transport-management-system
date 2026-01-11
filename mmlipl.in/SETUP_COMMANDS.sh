#!/bin/bash
# Setup commands for mmlipl.in fresh deployment

echo "🔍 Step 1: Finding site location..."
echo ""

# Check common locations
echo "Checking /home/cloudpanel/htdocs/mmlipl.in/..."
ls -la /home/cloudpanel/htdocs/mmlipl.in/ 2>/dev/null || echo "  ❌ Not found"

echo ""
echo "Checking /home/clp/htdocs/..."
ls -la /home/clp/htdocs/ 2>/dev/null || echo "  ❌ Not found"

echo ""
echo "Checking /home/clp/htdocs/app/..."
ls -la /home/clp/htdocs/app/ 2>/dev/null || echo "  ❌ Not found"

echo ""
echo "Checking for nginx config..."
grep -r "mmlipl.in" /etc/nginx/sites-enabled/ 2>/dev/null | head -5

echo ""
echo "✅ Run these commands to find the site root:"
echo "   find /home -name 'index.html' -type f 2>/dev/null | grep -i mmlipl"
echo "   grep -r 'root' /etc/nginx/sites-enabled/ | grep mmlipl"
