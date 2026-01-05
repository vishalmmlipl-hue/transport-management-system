# How to Start the Server

## Quick Start

Open a **new terminal window** and run:

```bash
cd /Users/macbook/transport-management-system
npm start
```

## What to Expect

1. **First time**: It may take 30-60 seconds to compile
2. **You'll see**: Compilation progress in the terminal
3. **When ready**: Browser should open automatically to http://localhost:3000
4. **Success message**: "Compiled successfully!"

## If Port 3000 is Busy

If you see: "Something is already running on port 3000"
- Type `Y` to run on another port (like 3001)
- Or kill the existing process:
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```

## Troubleshooting

### Server Won't Start?

1. **Check if dependencies are installed**:
   ```bash
   cd /Users/macbook/transport-management-system
   ls node_modules
   ```
   If empty or missing, run:
   ```bash
   npm install
   ```

2. **Check for errors**:
   - Look at the terminal output
   - Common issues:
     - Port already in use
     - Missing dependencies
     - Syntax errors in code

3. **Try clearing cache**:
   ```bash
   rm -rf node_modules/.cache
   npm start
   ```

### Still Not Working?

Check the terminal for error messages and share them.

---

## Manual Start (Step by Step)

1. **Open Terminal** (Applications → Utilities → Terminal)
2. **Navigate to project**:
   ```bash
   cd /Users/macbook/transport-management-system
   ```
3. **Start server**:
   ```bash
   npm start
   ```
4. **Wait for compilation** (30-60 seconds)
5. **Open browser**: http://localhost:3000

---

**Run `npm start` in your terminal and let me know what you see!**

