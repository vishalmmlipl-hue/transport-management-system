#!/bin/bash

###############################################################################
# TMS Restore Script for Hostinger VPS
# 
# This script restores backups created by backup-tms.sh
#
# Usage:
#   ./restore-tms.sh <backup-date>     # Restore database from specific date
#   ./restore-tms.sh --list            # List available backups
#   ./restore-tms.sh --latest          # Restore latest backup
#
# Example:
#   ./restore-tms.sh 20240108_020000   # Restore from Jan 8, 2 AM
###############################################################################

# Configuration
APP_DIR="/var/www/tms"
BACKUP_DIR="/root/backups"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔄 TMS Restore Script${NC}"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Backup directory not found: $BACKUP_DIR${NC}"
    exit 1
fi

# List available backups
if [ "$1" == "--list" ] || [ "$1" == "-l" ]; then
    echo -e "${YELLOW}📋 Available Backups:${NC}"
    echo ""
    
    echo "Database Backups:"
    ls -lh "$BACKUP_DIR"/*.db.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ") - " $6 " " $7 " " $8}'
    
    echo ""
    echo "Full Backups:"
    ls -lh "$BACKUP_DIR"/tms_full_*.tar.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ") - " $6 " " $7 " " $8}'
    
    echo ""
    echo "Usage: ./restore-tms.sh <backup-date>"
    echo "Example: ./restore-tms.sh 20240108_020000"
    exit 0
fi

# Restore latest backup
if [ "$1" == "--latest" ] || [ "$1" == "-L" ]; then
    LATEST=$(ls -t "$BACKUP_DIR"/tms_db_*.db.gz 2>/dev/null | head -1)
    if [ -z "$LATEST" ]; then
        echo -e "${RED}❌ No backups found!${NC}"
        exit 1
    fi
    
    BACKUP_DATE=$(basename "$LATEST" | sed 's/tms_db_//' | sed 's/.db.gz//')
    echo -e "${YELLOW}📅 Latest backup: $BACKUP_DATE${NC}"
    RESTORE_DATE="$BACKUP_DATE"
else
    RESTORE_DATE="$1"
fi

# Check if date provided
if [ -z "$RESTORE_DATE" ]; then
    echo -e "${RED}❌ Please provide backup date or use --list to see available backups${NC}"
    echo ""
    echo "Usage:"
    echo "  ./restore-tms.sh <backup-date>     # Restore from specific date"
    echo "  ./restore-tms.sh --list            # List available backups"
    echo "  ./restore-tms.sh --latest          # Restore latest backup"
    exit 1
fi

# Find backup file
DB_BACKUP="$BACKUP_DIR/tms_db_$RESTORE_DATE.db.gz"

if [ ! -f "$DB_BACKUP" ]; then
    echo -e "${RED}❌ Backup not found: $DB_BACKUP${NC}"
    echo ""
    echo -e "${YELLOW}Available backups:${NC}"
    ls -1 "$BACKUP_DIR"/*.db.gz 2>/dev/null | sed 's/.*\//  /'
    exit 1
fi

# Confirm restore
echo -e "${YELLOW}⚠️  WARNING: This will replace your current database!${NC}"
echo -e "${YELLOW}Backup file: $DB_BACKUP${NC}"
echo ""
read -p "Are you sure you want to restore? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}❌ Restore cancelled${NC}"
    exit 0
fi

# Stop backend server
echo -e "${YELLOW}🛑 Stopping backend server...${NC}"
pm2 stop tms-backend 2>/dev/null || echo "Backend not running (OK)"

# Backup current database (safety)
if [ -f "$APP_DIR/server/tms_database.db" ]; then
    CURRENT_BACKUP="$BACKUP_DIR/pre_restore_$(date +%Y%m%d_%H%M%S).db"
    cp "$APP_DIR/server/tms_database.db" "$CURRENT_BACKUP"
    echo -e "${GREEN}✅ Current database backed up to: $CURRENT_BACKUP${NC}"
fi

# Restore database
echo -e "${YELLOW}📥 Restoring database...${NC}"

# Decompress and restore
gunzip -c "$DB_BACKUP" > "$APP_DIR/server/tms_database.db"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database restored successfully!${NC}"
else
    echo -e "${RED}❌ Restore failed!${NC}"
    exit 1
fi

# Set correct permissions
chown www-data:www-data "$APP_DIR/server/tms_database.db" 2>/dev/null
chmod 644 "$APP_DIR/server/tms_database.db"

# Start backend server
echo -e "${YELLOW}🚀 Starting backend server...${NC}"
pm2 start tms-backend || pm2 restart tms-backend

# Wait a moment for server to start
sleep 2

# Verify restore
if [ -f "$APP_DIR/server/tms_database.db" ]; then
    DB_SIZE=$(du -h "$APP_DIR/server/tms_database.db" | cut -f1)
    echo -e "${GREEN}✅ Database file exists (Size: $DB_SIZE)${NC}"
    
    # Test API health
    echo -e "${YELLOW}🧪 Testing API...${NC}"
    sleep 1
    HEALTH=$(curl -s http://localhost:3001/api/health 2>/dev/null)
    
    if [ ! -z "$HEALTH" ]; then
        echo -e "${GREEN}✅ API is responding!${NC}"
    else
        echo -e "${YELLOW}⚠️  API not responding (may need a moment to start)${NC}"
    fi
else
    echo -e "${RED}❌ Database file not found after restore!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Restore completed successfully!${NC}"
echo -e "${YELLOW}💡 Verify your data at: https://mmlipl.info${NC}"

exit 0
