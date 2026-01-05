#!/bin/bash

# Import TMS from mega directory

echo "🔄 Importing from ~/Desktop/mega..."

# Backup current files
echo "📦 Backing up current files..."
mkdir -p backup_$(date +%Y%m%d_%H%M%S)
cp -r src/* backup_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null

# Copy main app file
echo "📄 Copying transport-management-app.jsx..."
cp ~/Desktop/mega/src/transport-management-app.jsx src/ 2>/dev/null && echo "✅ Copied" || echo "❌ Not found"

# Copy dashboard
echo "📊 Copying reports-dashboard.jsx..."
cp ~/Desktop/mega/src/reports-dashboard.jsx src/components/ 2>/dev/null && echo "✅ Copied" || echo "❌ Not found"

# Check if lucide-react is needed
echo ""
echo "📦 Checking dependencies..."
if grep -q "lucide-react" ~/Desktop/mega/package.json 2>/dev/null; then
    echo "⚠️  mega uses lucide-react. Installing..."
    npm install lucide-react
fi

echo ""
echo "✅ Import complete!"
echo ""
echo "Next steps:"
echo "1. Update App.js to use transport-management-app"
echo "2. Install any missing dependencies: npm install"
echo "3. Run: npm start"

