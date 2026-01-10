# GitHub & Restore Points with Hostinger VPS

## ✅ YES to Both!

**Short Answer:**
1. ✅ **GitHub** - Works exactly the same (independent of hosting)
2. ✅ **Restore Points** - Can create backups on Hostinger VPS

---

## Part 1: Using GitHub (Same as Before!)

### GitHub is Independent of Hosting

**GitHub is a code repository service** - it has NOTHING to do with where you host your app.

**You can use GitHub with:**
- ✅ Netlify (current)
- ✅ Hostinger VPS (future)
- ✅ Any hosting provider
- ✅ Even without hosting (just for code backup)

**Your workflow stays the same:**

```bash
# 1. Edit code in Cursor
# 2. Save files
# 3. Commit to Git:
git add .
git commit -m "Updated branch form"
git push origin main

# 4. Code is saved on GitHub ✅
```

**Nothing changes!** GitHub works the same way.

---

## Part 2: Restore Points on Hostinger VPS

### What are Restore Points?

**Restore Points = Backups** of your:
- ✅ Code files
- ✅ Database
- ✅ Configuration files
- ✅ Everything on your server

### Two Types of Backups:

1. **Code Backups** (GitHub) - Already have this!
2. **Server Backups** (Hostinger) - New option!

---

## Backup Strategy: Best of Both Worlds

### Option 1: GitHub (Code Backup) ✅ RECOMMENDED

**What it backs up:**
- ✅ All your code files
- ✅ Version history
- ✅ Can restore any previous version
- ✅ Free unlimited storage
- ✅ Accessible from anywhere

**How to use:**
```bash
# Daily workflow:
git add .
git commit -m "Description of changes"
git push origin main

# Your code is saved! ✅
```

**Benefits:**
- ✅ Free
- ✅ Version control (see all changes)
- ✅ Can rollback to any version
- ✅ Works with any hosting
- ✅ Team collaboration

**This is your PRIMARY backup!**

---

### Option 2: Hostinger VPS Backups (Server Backup)

**What it backs up:**
- ✅ Database file (SQLite)
- ✅ Server configuration
- ✅ Installed packages
- ✅ Environment variables

**How to create:**

#### Method A: Manual Backup Script

```bash
# Create backup script on VPS
nano /root/backup-tms.sh
```

```bash
#!/bin/bash
# TMS Backup Script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
APP_DIR="/var/www/tms"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp $APP_DIR/server/tms_database.db $BACKUP_DIR/tms_db_$DATE.db

# Backup server config
cp $APP_DIR/server/server.js $BACKUP_DIR/server_$DATE.js

# Create archive
tar -czf $BACKUP_DIR/tms_backup_$DATE.tar.gz \
    $APP_DIR/server/tms_database.db \
    $APP_DIR/server/server.js \
    /etc/nginx/sites-available/mmlipl.info

# Keep only last 30 days
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "✅ Backup created: tms_backup_$DATE.tar.gz"
```

```bash
# Make executable
chmod +x /root/backup-tms.sh

# Run manually
/root/backup-tms.sh

# Or set up automatic daily backup
crontab -e
# Add: 0 2 * * * /root/backup-tms.sh
```

#### Method B: Hostinger Control Panel

Some Hostinger plans include:
- ✅ Automated daily backups
- ✅ One-click restore
- ✅ Backup management UI

**Check your VPS plan for backup features!**

#### Method C: External Backup (Recommended)

```bash
# Backup to external storage (Google Drive, Dropbox, etc.)

# Install rclone (for cloud backup)
curl https://rclone.org/install.sh | sudo bash

# Configure (follow prompts)
rclone config

# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /tmp/tms_backup_$DATE.tar.gz /var/www/tms/server/tms_database.db
rclone copy /tmp/tms_backup_$DATE.tar.gz gdrive:tms-backups/
rm /tmp/tms_backup_$DATE.tar.gz
```

---

## Complete Backup Strategy

### Daily: GitHub (Code)
```bash
# Every time you make changes:
git add .
git commit -m "Your changes"
git push
```

### Daily: Database Backup (Server)
```bash
# Automatic via cron (set up once):
# Runs daily at 2 AM
0 2 * * * /root/backup-tms.sh
```

### Weekly: Full Server Backup
```bash
# Manual or automated:
# Backup entire /var/www/tms directory
tar -czf tms_full_backup_$(date +%Y%m%d).tar.gz /var/www/tms
```

---

## Restore Process

### Restore Code from GitHub

```bash
# If you need to restore code:
cd /var/www/tms
git log  # See all commits
git checkout <commit-hash>  # Restore specific version
# Or
git reset --hard origin/main  # Restore to latest
```

### Restore Database from Backup

```bash
# Stop backend
pm2 stop tms-backend

# Restore database
cp /root/backups/tms_db_20240108_020000.db /var/www/tms/server/tms_database.db

# Start backend
pm2 start tms-backend
```

### Restore Full Server

```bash
# Extract backup
tar -xzf tms_full_backup_20240108.tar.gz -C /

# Restart services
pm2 restart tms-backend
systemctl restart nginx
```

---

## Comparison: GitHub vs Hostinger Backups

| Feature | GitHub | Hostinger Backups |
|---------|--------|-------------------|
| **What it backs up** | Code files | Database + Config |
| **Version history** | ✅ Yes | ❌ No |
| **Cost** | Free | Free (manual) or Paid (auto) |
| **Access** | Anywhere | Server only |
| **Restore speed** | Fast | Fast |
| **Best for** | Code changes | Database recovery |

**Use BOTH for complete protection!**

---

## Recommended Setup

### 1. GitHub (Primary - Code Backup)

```bash
# Initialize Git (if not done)
cd /Users/macbook/transport-management-system
git init
git remote add origin https://github.com/your-username/tms.git

# Daily workflow:
git add .
git commit -m "Description"
git push origin main
```

**Benefits:**
- ✅ Free unlimited
- ✅ Version history
- ✅ Can see all changes
- ✅ Rollback any version
- ✅ Works with any hosting

### 2. Hostinger VPS (Secondary - Database Backup)

```bash
# Set up automatic daily database backup
# (Script provided above)
```

**Benefits:**
- ✅ Database recovery
- ✅ Server config backup
- ✅ Quick restore

### 3. External Cloud Backup (Optional - Extra Safety)

- Google Drive
- Dropbox
- AWS S3
- Backblaze

**For critical data only (database).**

---

## Quick Setup Guide

### Step 1: Set Up GitHub (5 minutes)

```bash
# On your Mac:
cd /Users/macbook/transport-management-system

# If not already a Git repo:
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub.com, then:
git remote add origin https://github.com/your-username/tms.git
git push -u origin main
```

**Done!** Now every `git push` saves your code.

### Step 2: Set Up Hostinger Backups (10 minutes)

```bash
# SSH into VPS
ssh root@your-vps-ip

# Create backup script
nano /root/backup-tms.sh
# (Paste script from above)

# Make executable
chmod +x /root/backup-tms.sh

# Test it
/root/backup-tms.sh

# Set up automatic daily backup
crontab -e
# Add: 0 2 * * * /root/backup-tms.sh
```

**Done!** Now database backs up daily at 2 AM.

---

## Daily Workflow Example

### Morning: Make Changes

```bash
# 1. Edit code in Cursor
# 2. Test locally: npm start
# 3. Save to GitHub:
git add .
git commit -m "Added new feature"
git push
```

### Evening: Deploy

```bash
# 1. Build and deploy:
npm run build
npm run deploy

# 2. Database automatically backed up at 2 AM
# (No action needed)
```

### If Something Goes Wrong:

```bash
# Restore code from GitHub:
git log  # Find the good version
git checkout <commit-hash>

# Or restore database:
# (Use backup script)
```

---

## Summary

### ✅ GitHub Usage

**Question:** Can I still use GitHub?

**Answer:** ✅ **YES!** Works exactly the same way.

- ✅ Edit code in Cursor
- ✅ `git commit` and `git push`
- ✅ Code saved on GitHub
- ✅ Version history
- ✅ Can restore any version
- ✅ **Nothing changes!**

### ✅ Restore Points on Hostinger

**Question:** Can I make restore points?

**Answer:** ✅ **YES!** Multiple options:

1. **GitHub** - Code restore points (free, unlimited)
2. **Manual backups** - Database + config (free, script provided)
3. **Hostinger backups** - If included in plan (check your plan)
4. **External backups** - Cloud storage (optional)

**Best Practice:** Use GitHub for code + Manual script for database.

---

## Next Steps

1. ✅ **Set up GitHub** (if not already done)
   - Create repo on GitHub.com
   - Push your code
   - Daily commits

2. ✅ **Set up Hostinger backups** (after VPS setup)
   - Create backup script
   - Set up cron job
   - Test restore process

3. ✅ **Test restore** (important!)
   - Create test backup
   - Restore it
   - Verify it works

**Want me to create the backup scripts for you?**
