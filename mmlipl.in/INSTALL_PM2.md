# Install PM2 and Start Backend

## Step 1: Install Node.js (If Not Installed)

**Check if Node.js is installed:**
```bash
node --version
npm --version
```

**If not installed, install Node.js 18:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify
node --version
npm --version
```

---

## Step 2: Install PM2

```bash
npm install -g pm2
```

---

## Step 3: Navigate to Server Directory

```bash
cd /home/mmlipl/htdocs/mmlipl.in/server
```

---

## Step 4: Install Backend Dependencies

```bash
npm install
```

---

## Step 5: Initialize Database

```bash
npm run init-db
```

---

## Step 6: Start Backend with PM2

```bash
pm2 start server.js --name mmlipl-api
pm2 save
pm2 startup
```

---

## Step 7: Check Status

```bash
pm2 status
pm2 logs mmlipl-api
```

---

## Step 8: Test API

```bash
curl http://localhost:3001/api/health
curl https://mmlipl.in/api/health
```

---

**Follow these steps in order!** 🚀
