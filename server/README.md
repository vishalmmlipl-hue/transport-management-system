# TMS Backend Server with SQLite Database

## Overview
This backend server stores all TMS data in a SQLite database, ensuring data persistence even if browser cache is cleared.

## Setup

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Initialize Database
```bash
npm run init-db
```

This will create `tms_database.db` with all necessary tables.

### 3. Start Server
```bash
npm start
```

Server will run on `http://localhost:3001`

## API Endpoints

All endpoints follow RESTful conventions:

### Generic CRUD Operations
- `GET /api/{tableName}` - Get all records
- `GET /api/{tableName}/:id` - Get single record
- `POST /api/{tableName}` - Create new record
- `PUT /api/{tableName}/:id` - Update record
- `DELETE /api/{tableName}/:id` - Delete record

### Available Tables
- users
- branches
- cities
- vehicles
- drivers
- staff
- lrBookings
- ftlLRBookings
- ptlLRBookings
- manifests
- trips
- invoices
- payments
- pods
- clients
- accounts
- expenseTypes
- branchExpenses
- marketVehicleVendors
- otherVendors

### Bulk Operations
- `POST /api/bulk/{tableName}` - Insert/update multiple records

### Health Check
- `GET /api/health` - Check server status

## Database File Location
Database file: `server/tms_database.db`

**Important:** Backup this file regularly! It contains all your data.

## Backup Database
```bash
# Copy database file
cp server/tms_database.db server/backups/tms_database_$(date +%Y%m%d_%H%M%S).db
```

## Restore Database
```bash
# Stop server first
# Copy backup file
cp server/backups/tms_database_YYYYMMDD_HHMMSS.db server/tms_database.db
# Start server
npm start
```

## Frontend Integration

Update your frontend to use the API instead of localStorage. See `src/utils/api.js` for API client setup.

