# INVICTUS - PCB Inventory & Production Management System

**An all-in-one solution for tracking electronic components, managing PCB bills of materials, automating production workflows, and generating procurement alerts.**

![Status](https://img.shields.io/badge/status-production--ready-brightgreen) ![License](https://img.shields.io/badge/license-ISC-blue)

---

## 📖 What is INVICTUS?

INVICTUS is a **full-stack web application** designed to solve inventory management challenges in PCB (Printed Circuit Board) manufacturing. It helps manufacturers:

- 📦 **Track component inventory** with real-time stock levels
- 🔧 **Manage PCB definitions** and their Bill of Materials (BOM)
- 🏭 **Record production** with automatic stock deduction
- 📊 **Analyze consumption patterns** and predict shortages
- 🔔 **Automate procurement** by generating alerts when stock runs low
- 📥 **Import data** from Excel files with intelligent column detection

**Built for:** Small to medium PCB manufacturers, electronics production facilities, and inventory managers

**Use Cases:**
- Manufacturing companies producing multiple PCB designs (e.g., Bajaj, Atomberg)
- Inventory managers tracking thousands of electronic components
- Production teams recording daily manufacturing activities
- Procurement teams managing component ordering

---

## ✨ Key Features

### 🔐 Secure Authentication
- JWT-based user login and registration
- Role-based access control (Admin & Viewer roles)
- Password encryption with bcrypt

### 📦 Component Management
- Add, edit, view, and delete electronic components
- Track current stock, monthly requirements, and locations
- Unique part numbers to prevent duplicates
- Smart stock level indicators (healthy, warning, critical)

### 🔧 PCB & BOM Management
- Define PCBs with names and descriptions
- Build Bill of Materials by linking components to PCBs
- Specify quantities needed for each component
- Visual BOM display with stock availability

### 🏭 Production Recording
- Record PCB production quantities
- **Automatic stock deduction** based on BOM (transaction-safe)
- Consumption history tracking
- Production logs with timestamps

### 📊 Analytics & Reporting
- Real-time dashboard with KPIs
- Top consumed components analysis
- Low stock component alerts
- Production statistics over time
- Consumption trend visualization

### 🔔 Automated Procurement
- Auto-generate alerts when stock drops below 20% of monthly requirement
- Track open vs resolved procurement needs
- Prevent duplicate alerts for the same component

### 📥 Excel Import
- Upload Excel files (.xlsm, .xlsx)
- **Intelligent column detection** - automatically identifies component names, part numbers, stock levels
- Import components, PCBs, and BOMs in one go
- Transaction-safe imports with rollback on errors
- UPSERT logic (updates existing + inserts new)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, React Router, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **Authentication** | JWT, bcrypt |
| **Charts** | Recharts |
| **Excel** | xlsx library |

---

## 🚀 Complete Setup Guide

Follow these steps to set up INVICTUS on your device.

### Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v14 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **PostgreSQL** (v12 or higher)
   - Download: https://www.postgresql.org/download/
   - Verify: `psql --version`

3. **Git** (optional, for cloning)
   - Download: https://git-scm.com/

---

### Step 1: Clone or Download the Project

```bash
# Option A: Clone with Git
git clone <repository-url>
cd INVICTUS

# Option B: Download ZIP
# Extract the ZIP file and navigate to the INVICTUS folder
```

---

### Step 2: Database Setup

#### 2.1 Start PostgreSQL

**Windows:**
- PostgreSQL should auto-start after installation
- Or open "Services" → Find "postgresql-x64-XX" → Start

**Mac/Linux:**
```bash
sudo service postgresql start
```

#### 2.2 Create Database

Open a terminal and run:

```bash
# Connect to PostgreSQL
psql -U postgres

# You'll be prompted for the postgres user password
# (set during PostgreSQL installation)
```

Inside the PostgreSQL prompt, run:

```sql
-- Create the database
CREATE DATABASE pcb_inventory;

-- Verify it was created
\list

-- Exit
\q
```

#### 2.3 Load Database Schema

```bash
# Navigate to backend folder
cd backend

# Run the schema file (creates all tables)
psql -U postgres -d pcb_inventory -f schema.sql

# Verify tables were created
psql -U postgres -d pcb_inventory -c "\dt"
```

You should see 7 tables: `users`, `components`, `pcbs`, `pcb_components`, `production_logs`, `consumption_history`, `procurement_triggers`.

---

###Step 3: Backend Configuration

#### 3.1 Install Backend Dependencies

```bash
# From the INVICTUS/backend folder
npm install
```

This will install all required packages (~257 packages).

#### 3.2 Configure Environment Variables

Create a `.env` file in the `backend` folder:

```bash
# Copy the example file
cp .env.example .env

# Or create manually
```

**Edit `backend/.env`** with your settings:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
DB_NAME=pcb_inventory

# JWT Configuration (generate a strong secret)
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_EXPIRES_IN=24h

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Important:**
- Replace `YOUR_POSTGRES_PASSWORD_HERE` with your PostgreSQL password
- Generate a strong JWT_SECRET:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
  Copy the output and use it as JWT_SECRET

#### 3.3 Start the Backend

```bash
# From backend folder
npm start
```

You should see:
```
🚀 Server running on port 5000
📊 Environment: development
🌐 CORS enabled for: http://localhost:3000
```

**Troubleshooting:**
- If port 5000 is in use, change `PORT` in `.env`
- If database connection fails, verify your PostgreSQL credentials
- Check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` in `.env`

---

### Step 4: Frontend Configuration

#### 4.1 Install Frontend Dependencies

Open a **new terminal window** (keep backend running) and run:

```bash
# Navigate to frontend folder from project root
cd frontend

# Install dependencies
npm install
```

#### 4.2 Verify API Configuration

The frontend is pre-configured to connect to `http://localhost:5000/api`.

If your backend runs on a different port, edit `frontend/src/services/api.js`:

```javascript
// Line 2
const API_BASE_URL = 'http://localhost:YOUR_PORT/api';
```

#### 4.3 Start the Frontend

```bash
# From frontend folder
npm run dev
```

You should see:
```
VITE v7.3.1 ready in XXX ms
➜ Local: http://localhost:3000/
```

---

### Step 5: Create Your First Admin User

Open your browser and go to: **http://localhost:3000**

You'll see the login page.

#### Option A: Register via Frontend (Recommended)

1. Click **"Don't have an account? Register here"**
2. Fill in the registration form:
   - Name: Your Name
   - Email: your@email.com
   - Password: (minimum 6 characters)
3. Click **"Create Account"**
4. You'll be automatically logged in with **admin** privileges

#### Option B: Register via API

Use cURL or Postman:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@yourcompany.com",
    "password": "StrongPassword123",
    "role": "admin"
  }'
```

Then login at http://localhost:3000 with these credentials.

---

### Step 6: Verify Installation

After logging in, you should see the **Dashboard** with:
- KPI cards (Total Components, Low Stock, etc.)
- Charts (Top Consumed, Monthly Trend, Stock Health)
- Recent production activity table

**Test the system:**
1. Go to **Components** page → Add a test component
2. Go to **PCBs** page → Create a test PCB
3. Add components to the PCB's BOM
4. Record a production entry
5. Check Dashboard for updated analytics

---

## 📋 Configuration Reference

### Backend Environment Variables (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `your_password` |
| `DB_NAME` | Database name | `pcb_inventory` |
| `JWT_SECRET` | Secret key for JWT tokens | (64+ character random string) |
| `JWT_EXPIRES_IN` | Token expiration time | `24h`, `7d`, `30d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Frontend Configuration

| File | Setting | Default |
|------|---------|---------|
| `vite.config.js` | Frontend port | `3000` |
| `src/services/api.js` | Backend API URL | `http://localhost:5000/api` |

---

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access: Create, Read, Update, Delete all data; Record production; Import Excel; Manage users |
| **Viewer** | Read-only: View components, PCBs, production logs, analytics |

### Change User Role

**Via SQL:**
```sql
-- Connect to database
psql -U postgres -d pcb_inventory

-- Promote user to admin
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';

-- Demote user to viewer
UPDATE users SET role = 'viewer' WHERE email = 'user@example.com';

-- Check all users and roles
SELECT id, name, email, role FROM users;
```

### Default Behavior

By default, **all new registrations get admin role**. To change this:

Edit `backend/src/controllers/authController.js`, line 30:
```javascript
// Change from:
const role = req.body.role || 'admin';

// To:
const role = req.body.role || 'viewer';
```

---

## 📥 Excel Import Feature

INVICTUS can import data from Excel files with intelligent column detection.

### Supported Files

Place your Excel files in `backend/data/` folder.

Example files:
- `Bajaj PCB Dec 25 Data.xlsm`
- `Atomberg Data.xlsm`

### Column Detection

The system automatically detects columns using fuzzy matching:

| Data Type | Detected Columns |
|-----------|------------------|
| Component Name | "Component", "Item", "Item Name", "Part Name" |
| Part Number | "Part No", "PartNo", "Code", "SKU", "Part Number" |
| Stock | "Stock", "Inventory", "Qty", "Quantity", "Current Stock" |
| Monthly Required | "Monthly", "Required", "Consumption" |
| Location | "Location", "Bin", "Storage" |
| PCB Name | "PCB", "Board", "PCB Name" |

### How to Import

1. Place your Excel file in `backend/data/`
2. Login to frontend as admin
3. Go to **Import** section (if available in UI)
4. Select file, sheet, and click Import

**Or use API:**
```bash
# List available files
curl http://localhost:5000/api/import/files

# Preview file structure
curl http://localhost:5000/api/import/preview/YourFile.xlsm

# Import
curl -X POST http://localhost:5000/api/import/excel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "filename": "YourFile.xlsm",
    "sheetName": "Sheet1",
    "importType": "auto"
  }'
```

---

## 🐛 Troubleshooting

### Issue: Cannot connect to database

**Error:** `password authentication failed for user "postgres"`

**Solution:**
1. Verify PostgreSQL is running: `psql --version`
2. Check password in `backend/.env` matches PostgreSQL password
3. Try connecting manually: `psql -U postgres -d pcb_inventory`

---

### Issue: Backend won't start

**Error:** `Port 5000 is already in use`

**Solution:**
1. Change port in `backend/.env`: `PORT=5001`
2. Update frontend API URL in `frontend/src/services/api.js`
3. Update `FRONTEND_URL` in `backend/.env` if needed

---

### Issue: CORS error in browser

**Error:** `Access-Control-Allow-Origin header is not present`

**Solution:**
1. Check `FRONTEND_URL` in `backend/.env` matches your frontend URL
2. Restart backend server after changing `.env`
3. Clear browser cache and reload

---

### Issue: Login redirect loop

**Symptom:** Page keeps bouncing between `/` and `/login`

**Solution:**
```javascript
// Open browser console (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

### Issue: Excel import fails

**Error:** `Could not detect columns`

**Solution:**
1. Check your Excel file has headers in the first row
2. Ensure column names are similar to expected names (see Column Detection table)
3. Try manually specifying columns in the import API call

---

## 🔒 Security Recommendations

### For Production Deployment

1. **Generate Strong JWT Secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Change Default Ports** (optional)
   - Use ports like 8080, 3001 instead of 5000, 3000

3. **Enable HTTPS**
   - Use nginx or Apache as reverse proxy
   - Obtain SSL certificate (Let's Encrypt)

4. **Restrict Cors**
   ```env
   FRONTEND_URL=https://yourdomain.com
   ```

5. **Limit Admin Accounts**
   - Grant admin role only to trusted users
   - Regularly audit user roles

6. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

---

## 📁 Project Structure

```
INVICTUS/
├── backend/                    # Node.js/Express backend
│   ├── data/                  # Excel files for import
│   ├── src/
│   │   ├── config/           # Database connection
│   │   ├── controllers /      # Business logic
│   │   ├── middleware/       # Auth middleware
│   │   ├── routes/           # API routes
│   │   ├── utils/            # Helper functions
│   │   └── app.js            # Express setup
│   ├── schema.sql            # Database schema
│   ├── server.js             # Entry point
│   ├── package.json          # Dependencies
│   └── .env                  # Configuration (not in git)
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React Context (Auth)
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── vite.config.js        # Vite configuration
│   └── package.json          # Dependencies
│
├── .gitignore                 # Git ignore patterns
└── README.md                  # This file
```

---

## 📞 Support

For issues, questions, or contributions:
- Check this README's troubleshooting section
- Review API documentation above
- Contact: [Your contact info]

---

## 📝 License

ISC License

---

**Developed with ❤️ for PCB manufacturers worldwide**

🚀 **Ready to streamline your inventory management!**
