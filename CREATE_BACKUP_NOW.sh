#!/bin/bash

# Create Backup/Clone of Transport Management System
# Run this script in your terminal

echo "🔄 Creating backup..."

BACKUP_NAME="transport-management-system_backup_$(date +%Y%m%d_%H%M%S)"
BACKUP_PATH="/Users/macbook/$BACKUP_NAME"

# Create backup directory
mkdir -p "$BACKUP_PATH"

# Copy important files (exclude node_modules, build, .git to save space)
echo "📦 Copying files..."
rsync -av \
  --exclude='node_modules' \
  --exclude='build' \
  --exclude='.git' \
  --exclude='backup_restore_*' \
  --exclude='restore_points' \
  --exclude='*.log' \
  /Users/macbook/transport-management-system/ \
  "$BACKUP_PATH/"

# Get size
SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)

echo ""
echo "✅ Backup created successfully!"
echo "📍 Location: $BACKUP_PATH"
echo "📊 Size: $SIZE"
echo ""
echo "✅ Safe to proceed with build and deployment!"
