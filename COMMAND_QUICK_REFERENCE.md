# Command Quick Reference - Mac vs VPS

## 🎯 At a Glance

| What You Want to Do | Run On | Command |
|---------------------|--------|---------|
| **Build your app** | Mac | `npm run build` |
| **Upload files** | Mac | `scp -r file root@vps-ip:/path/` |
| **Connect to VPS** | Mac | `ssh root@vps-ip` |
| **Install software** | VPS | `apt install package` |
| **Start backend** | VPS | `pm2 start server.js` |
| **Check status** | VPS | `pm2 status` |
| **View logs** | VPS | `pm2 logs tms-backend` |

---

## 🖥️ MAC COMMANDS

### Open Terminal on Mac:
- Press: `Cmd + Space`
- Type: `Terminal`
- Press: Enter

### You'll See:
```
MacBook-Pro:~ macbook$
```

### Common Mac Commands:

```bash
# Navigate to project
cd /Users/macbook/transport-management-system

# Build frontend
npm install
npm run build

# Connect to VPS
ssh root@your-vps-ip

# Upload backend
scp -r server root@your-vps-ip:/var/www/tms/

# Upload frontend
scp -r build/* root@your-vps-ip:/var/www/html/

# Test from Mac
curl https://mmlipl.info/api/health
```

---

## 🌐 VPS COMMANDS

### Connect to VPS (from Mac):
```bash
ssh root@your-vps-ip
```

### You'll See:
```
Welcome to Ubuntu...
root@vps:~#
```

### Common VPS Commands:

```bash
# Update system
apt update
apt upgrade -y

# Install software
apt install -y nodejs nginx git
npm install -g pm2

# Navigate to app
cd /var/www/tms/server

# Install dependencies
npm install

# Initialize database
npm run init-db

# Start backend
pm2 start server.js --name tms-backend
pm2 save
pm2 startup

# Check status
pm2 status
systemctl status nginx

# View logs
pm2 logs tms-backend

# Restart services
pm2 restart tms-backend
systemctl restart nginx

# Exit VPS (back to Mac)
exit
```

---

## 🔄 Workflow Example

### Deploy Frontend:

**1. On Mac:**
```bash
cd /Users/macbook/transport-management-system
npm run build
scp -r build/* root@your-vps-ip:/var/www/html/
```

**2. Connect to VPS:**
```bash
ssh root@your-vps-ip
```

**3. On VPS:**
```bash
systemctl reload nginx
```

**4. Exit:**
```bash
exit
```

---

## 💡 Tips

1. **Use two terminals:**
   - Terminal 1: Connected to VPS
   - Terminal 2: On Mac (for building)

2. **Check where you are:**
   - `MacBook-Pro:` = Mac
   - `root@vps:` = VPS

3. **If command fails:**
   - Check if you're in the right place
   - Check error message

---

**Remember: Mac for building/uploading, VPS for running server!**
