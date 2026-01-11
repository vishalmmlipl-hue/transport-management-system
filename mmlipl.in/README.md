# mmlipl.in - Hostinger VPS Deployment

## 🌐 Domain Information
- **Domain:** mmlipl.in
- **Hosting:** Hostinger VPS
- **Server IP:** 31.97.107.232
- **Server Path:** `/home/cloudpanel/htdocs/mmlipl.in/`
- **Control Panel:** CloudPanel

## 📁 Server Structure
```
/home/cloudpanel/htdocs/mmlipl.in/
├── public/          # React app build files
│   ├── index.html
│   └── static/
│       ├── js/
│       └── css/
├── server/          # Backend API (if deployed)
│   ├── server.js
│   ├── package.json
│   └── data/
│       └── tms.db   # SQLite database
└── app/             # Alternative app location
    ├── data/
    └── files/
```

## 🔧 Current Status
- ✅ Frontend: Deployed on VPS
- ⚠️ Backend: Check if deployed
- ⚠️ Database: Check if set up

## 📝 Quick Commands

### SSH Access
```bash
ssh root@31.97.107.232
```

### Check Frontend Files
```bash
ls -la /home/cloudpanel/htdocs/mmlipl.in/public/
```

### Check Backend Server
```bash
ls -la /home/cloudpanel/htdocs/mmlipl.in/server/
```

### Check App Directory
```bash
ls -la /home/clp/htdocs/app/
```

## 🔗 Related Files
- See `mmlipl.in/DEPLOYMENT.md` for deployment steps
- See `mmlipl.in/TROUBLESHOOTING.md` for common issues
- See `mmlipl.in/API_SETUP.md` for backend API setup

---

**Last Updated:** Based on current server structure
