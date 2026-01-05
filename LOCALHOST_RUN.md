# Running TMS on Localhost

## ✅ Server Starting

The React development server is starting and will be available at:

**http://localhost:3000**

## What to Expect

1. **Browser should open automatically** to http://localhost:3000
2. **If not**, manually open: http://localhost:3000
3. **You'll see** your Transport Management System application

## Features Available

- ✅ Dashboard
- ✅ FTL LR Booking
- ✅ PTL LR Booking
- ✅ Search LR
- ✅ Modify LR
- ✅ Manifest
- ✅ Invoice Creation
- ✅ Trip Management
- ✅ Staff Master
- ✅ Create POD
- ✅ LR Tracking

## Data Storage

- All data is stored in **localStorage** (browser storage)
- Data persists between sessions
- No server required for data storage

## Stop the Server

To stop the server:
- Press `Ctrl + C` in the terminal
- Or close the terminal window

## Restart the Server

```bash
cd /Users/macbook/transport-management-system
npm start
```

## Troubleshooting

### Port 3000 Already in Use?

If you see "Something is already running on port 3000":
- Type `Y` to run on another port (like 3001)
- Or kill the existing process:
  ```bash
  lsof -ti:3000 | xargs kill
  ```

### Server Not Starting?

```bash
# Make sure you're in the right directory
cd /Users/macbook/transport-management-system

# Check if node_modules exists
ls node_modules

# If not, install dependencies
npm install

# Then start
npm start
```

---

**Your TMS is now running locally!** 🚀

Open http://localhost:3000 in your browser.

