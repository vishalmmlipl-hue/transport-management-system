#!/bin/bash

###############################################################################
# TMS Backup Script for Hostinger VPS
# 
# This script creates backups of:
# - SQLite database
# - Server configuration
# - Application files (optional)
#
# Usage:
#   ./backup-tms.sh              # Manual backup
#   ./backup-tms.sh --full        # Full backup (includes code)
#
# Setup automatic daily backup:
#   crontab -e
#   Add: 0 2 * * * /root/backup-tms.sh
###############################################################################

# Configuration
APP_DIR="/var/www/tms"
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30  # Keep backups for 30 days

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}🔄 Starting TMS Backup...${NC}"

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ App directory not found: $APP_DIR${NC}"
    exit 1
fi

# 1. Backup Database
if [ -f "$APP_DIR/server/tms_database.db" ]; then
    echo -e "${YELLOW}📊 Backing up database...${NC}"
    cp "$APP_DIR/server/tms_database.db" "$BACKUP_DIR/tms_db_$DATE.db"
    
    # Compress database backup
    gzip "$BACKUP_DIR/tms_db_$DATE.db"
    
    echo -e "${GREEN}✅ Database backed up: tms_db_$DATE.db.gz${NC}"
else
    echo -e "${RED}⚠️  Database file not found!${NC}"
fi

# 2. Backup Server Configuration
echo -e "${YELLOW}⚙️  Backing up server configuration...${NC}"

CONFIG_FILES=(
    "$APP_DIR/server/server.js"
    "/etc/nginx/sites-available/mmlipl.info"
    "/etc/nginx/sites-enabled/mmlipl.info"
)

CONFIG_BACKUP="$BACKUP_DIR/tms_config_$DATE.tar.gz"
tar -czf "$CONFIG_BACKUP" "${CONFIG_FILES[@]}" 2>/dev/null

if [ -f "$CONFIG_BACKUP" ]; then
    echo -e "${GREEN}✅ Configuration backed up: tms_config_$DATE.tar.gz${NC}"
else
    echo -e "${YELLOW}⚠️  Some config files not found (this is OK if not set up yet)${NC}"
fi

# 3. Full Backup (if --full flag is used)
if [ "$1" == "--full" ]; then
    echo -e "${YELLOW}📦 Creating full backup (this may take a while)...${NC}"
    
    FULL_BACKUP="$BACKUP_DIR/tms_full_$DATE.tar.gz"
    
    # Exclude node_modules and build folders to save space
    tar -czf "$FULL_BACKUP" \
        --exclude='node_modules' \
        --exclude='build' \
        --exclude='.git' \
        -C "$APP_DIR" .
    
    if [ -f "$FULL_BACKUP" ]; then
        SIZE=$(du -h "$FULL_BACKUP" | cut -f1)
        echo -e "${GREEN}✅ Full backup created: tms_full_$DATE.tar.gz (Size: $SIZE)${NC}"
    fi
fi

# 4. Create backup info file
INFO_FILE="$BACKUP_DIR/backup_info_$DATE.txt"
cat > "$INFO_FILE" << EOF
TMS Backup Information
=====================
Date: $(date)
Backup Type: $([ "$1" == "--full" ] && echo "Full" || echo "Database + Config")
Database: $([ -f "$APP_DIR/server/tms_database.db" ] && echo "Backed up" || echo "Not found")
Server: $(hostname)
Disk Usage: $(df -h / | tail -1 | awk '{print $5}')
EOF

echo -e "${GREEN}✅ Backup info saved: backup_info_$DATE.txt${NC}"

# 5. Clean up old backups (keep only last N days)
echo -e "${YELLOW}🧹 Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"

DELETED=$(find "$BACKUP_DIR" -name "*.db.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
DELETED=$((DELETED + $(find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)))
DELETED=$((DELETED + $(find "$BACKUP_DIR" -name "backup_info_*.txt" -mtime +$RETENTION_DAYS -delete -print | wc -l)))

if [ $DELETED -gt 0 ]; then
    echo -e "${GREEN}✅ Deleted $DELETED old backup file(s)${NC}"
else
    echo -e "${GREEN}✅ No old backups to clean up${NC}"
fi

# 6. Show backup summary
echo ""
echo -e "${GREEN}📊 Backup Summary:${NC}"
echo "=================="
ls -lh "$BACKUP_DIR" | grep "$DATE" | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "${YELLOW}💡 Backup location: $BACKUP_DIR${NC}"

# 7. Show disk usage
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo -e "${YELLOW}💾 Total backup size: $TOTAL_SIZE${NC}"

exit 0
