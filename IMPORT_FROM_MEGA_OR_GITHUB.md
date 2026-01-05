# Import TMS from Mega Directory or GitHub

## Option 1: Import from Mega Directory (~/Desktop/mega)

The mega directory exists and has a git repository. Here's how to use it:

### Step 1: Copy from Mega Directory

```bash
# Backup current project (optional)
cd /Users/macbook/transport-management-system
cp -r src src.backup

# Copy from mega directory
cp -r ~/Desktop/mega/src/* src/
cp ~/Desktop/mega/package.json . 2>/dev/null || echo "package.json already exists"
```

### Step 2: Install Dependencies (if needed)

```bash
cd /Users/macbook/transport-management-system
npm install
```

### Step 3: Run

```bash
npm start
```

---

## Option 2: Import from GitHub

### If you have a GitHub repository:

#### Step 1: Get GitHub Repository URL

You need the repository URL, for example:
- `https://github.com/username/tms-repo.git`
- `git@github.com:username/tms-repo.git`

#### Step 2: Clone or Pull

**Option A: Clone to new location:**
```bash
cd ~/Desktop
git clone https://github.com/username/tms-repo.git tms-new
cd tms-new
npm install
npm start
```

**Option B: Pull into current project:**
```bash
cd /Users/macbook/transport-management-system
git remote add origin https://github.com/username/tms-repo.git
git pull origin main
npm install
npm start
```

---

## Quick Import Script

I can create a script to import from mega directory. Would you like me to:

1. **Copy from mega directory** to current project?
2. **Check GitHub remote** in mega directory and clone from there?
3. **Both** - check mega first, then GitHub if needed?

---

## What's in Mega Directory?

Let me check what files are in the mega directory to see if it has the TMS components.

