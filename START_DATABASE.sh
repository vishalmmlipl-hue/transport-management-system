#!/bin/bash

# Quick Start Script for TMS Database Server

echo "=========================================="
echo "TMS Database Server Setup"
echo "=========================================="
echo ""

# Check if in server directory
if [ ! -f "package.json" ]; then
    echo "📁 Navigating to server directory..."
    cd server
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if database exists
if [ ! -f "tms_database.db" ]; then
    echo "🗄️  Initializing database..."
    npm run init-db
    echo ""
fi

# Check if server is already running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Server is already running on port 3001"
    echo "   To restart, stop it first: kill \$(lsof -ti:3001)"
    echo ""
    read -p "Do you want to stop and restart? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 Stopping existing server..."
        kill $(lsof -ti:3001) 2>/dev/null
        sleep 2
    else
        echo "✅ Using existing server"
        exit 0
    fi
fi

# Start server
echo "🚀 Starting TMS Backend Server..."
echo ""
npm start

