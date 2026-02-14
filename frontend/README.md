# PCB Inventory Automation & Consumption Analytics Platform

A professional, production-ready React application for PCB manufacturing inventory management. This lightweight ERP-style system provides comprehensive tools for component tracking, BOM management, production monitoring, and consumption analytics.

![Industrial Manufacturing Dashboard](preview.png)

## 🎯 Overview

This application is designed for PCB manufacturing environments, providing an industrial control dashboard that enables:

- **Real-time inventory management** for electronic components
- **PCB-to-component mapping** (BOM structure definition)
- **Automated stock deduction** during production
- **Procurement alerts** for low-stock components
- **Consumption analytics** with forecasting and insights
- **Role-based access control** (Admin/Viewer)

## 🏗️ Architecture

### Tech Stack

- **Frontend Framework:** React 18.2 with Vite
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Icons:** Lucide React
- **State Management:** React Context API
- **Authentication:** JWT with localStorage persistence
- **Styling:** Custom CSS with design system

### Design Philosophy

The UI adopts an **industrial/utilitarian** aesthetic:

- Clean, data-dense layouts optimized for operations
- Muted professional color palette (steel blue, slate gray, amber alerts)
- IBM Plex typeface for technical precision
- Subtle micro-interactions that feel responsive, not playful
- Production-grade component architecture

## 📁 Project Structure

```
pcb-inventory/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── Table.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── Toast.jsx
│   │   ├── Sidebar.jsx
│   │   └── Layout.jsx
│   ├── context/
│   │   └── AuthContext.jsx  # Authentication state
│   ├── pages/
│   │   ├── Login.jsx        # Authentication
│   │   ├── Dashboard.jsx    # Control center with KPIs
│   │   ├── Components.jsx   # Inventory management
│   │   ├── PCBs.jsx         # PCB & BOM management
│   │   ├── Production.jsx   # Production entry
│   │   ├── Procurement.jsx  # Alerts management
│   │   └── Analytics.jsx    # Consumption analytics
│   ├── services/
│   │   └── api.js           # Mock API service
│   ├── App.jsx              # Main app with routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles & design system
├── index.html
├── vite.config.js
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Navigate to project directory
cd pcb-inventory

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:3000`

## 🔐 Authentication

### Demo Credentials

**Administrator Account:**
- Username: `admin`
- Password: `admin`
- Full access to all features

**Viewer Account:**
- Username: `viewer`
- Password: `viewer`
- Read-only access

### JWT Implementation

- JWT tokens stored in `localStorage`
- Automatic session persistence across page refreshes
- Protected routes with redirect to login
- Token included in all API requests via Axios interceptor

## 📊 Core Modules

### 1. Dashboard (Control Center)

**KPI Cards:**
- Total Components
- Low Stock Components
- Total PCBs
- Production Entries
- Open Procurement Alerts

**Charts:**
- Top Consumed Components (Bar Chart)
- Monthly Consumption Trend (Line Chart)
- Stock Health Distribution (Pie Chart)

**Tables:**
- Low Stock Components with health indicators
- Recent Production Activity

### 2. Component Management

**Features:**
- Add/Edit/Delete components
- Search and filter functionality
- Health-based status filtering
- Stock percentage calculation
- Export inventory to CSV
- Bulk import (UI ready)

**Component Fields:**
- Name
- Part Number
- Category
- Current Stock
- Monthly Required Quantity
- Auto-calculated stock percentage and health status

**Health Indicators:**
- 🟢 Healthy (≥50% stock)
- 🟡 Warning (30-49% stock)
- 🔴 Critical (<30% stock)

### 3. PCB & BOM Management

**PCB Creation:**
- Define PCB name, revision, and description
- Visual card-based layout

**BOM Mapping:**
- Add components to PCB
- Define quantity per PCB
- Duplicate prevention
- Component search with stock visibility
- Remove components from BOM
- Real-time BOM preview

### 4. Production Entry

**Features:**
- Record PCB production
- Deduction preview before submission
- Real-time stock calculation
- Insufficient stock detection
- Automatic inventory updates
- Production history tracking

**Production Flow:**
1. Select PCB
2. Enter quantity
3. View deduction preview (current → required → after)
4. System validates stock availability
5. Upon submission: stock auto-deducted, alerts generated

### 5. Procurement Management

**Alert Generation:**
- Automatic alerts when stock drops below 30% threshold
- Alert details: component, current stock, threshold, trigger date
- Status tracking (Open/Resolved)

**Alert Management:**
- Filter by status (All/Open/Resolved)
- Mark alerts as resolved
- Add procurement notes
- Resolution timestamp tracking

### 6. Consumption Analytics

**Visualizations:**
- Component consumption ranking (bar chart)
- Monthly trend with forecast (line chart)
- ABC classification analysis
- Slow-moving component detection

**Insights:**
- Average inventory cycle time
- Stock accuracy percentage
- Annual turnover rate

**ABC Classification:**
- A-Items: High-value components (80% value, 20% items)
- B-Items: Medium-value components (15% value, 30% items)
- C-Items: Low-value components (5% value, 50% items)

## 🎨 Design System

### Color Palette

```css
/* Primary */
--color-primary: #0ea5e9 (Sky Blue)
--color-primary-dark: #0284c7

/* Status Colors */
--status-healthy: #10b981 (Green)
--status-warning: #f59e0b (Amber)
--status-critical: #ef4444 (Red)

/* Neutral Steel Tones */
--color-steel-900: #0f172a (Dark)
--color-steel-50: #f8fafc (Light)
```

### Typography

- **Sans Serif:** IBM Plex Sans (UI elements)
- **Monospace:** IBM Plex Mono (technical data, codes)

### Components

All UI components follow a consistent design language:

- **Buttons:** Primary, Secondary, Ghost, Danger variants
- **Cards:** Elevated with subtle shadows, hover effects
- **Modals:** Centered overlay with backdrop blur
- **Tables:** Striped rows, hover states, skeleton loaders
- **Toast Notifications:** Color-coded by type (success/error/warning/info)
- **Status Badges:** Pulsing indicators with color coding

## 🔄 Data Flow

### Mock API Service

The application includes a complete mock API (`src/services/api.js`) that:

- Stores data in `localStorage` for persistence
- Simulates network latency (300ms)
- Provides CRUD operations for all entities
- Automatically generates procurement alerts
- Handles stock deductions on production

### Production Backend Integration

To connect to a real backend:

1. Replace mock API calls in `src/services/api.js`
2. Configure Axios base URL
3. Update authentication endpoint in `AuthContext.jsx`
4. Implement actual JWT validation
5. Add error handling for network failures

## 🛠️ Advanced Features

### Planned Enhancements

- [ ] Excel import for components and BOMs
- [ ] PDF export for reports
- [ ] Real-time notifications with WebSocket
- [ ] Audit logs for all changes
- [ ] Multi-user collaboration
- [ ] Component image upload
- [ ] Advanced filtering and sorting
- [ ] Dark mode theme
- [ ] Mobile-responsive optimizations
- [ ] Print-ready report layouts

## 📱 Responsive Design

The application is optimized for:

- **Desktop:** Full feature set with sidebar navigation
- **Tablet:** Adapted layouts, collapsible sidebar
- **Mobile:** Stacked layouts, touch-optimized controls

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint
```

## 📄 License

This is a demonstration project. Modify and use as needed for your manufacturing operations.

## 🤝 Contributing

This is a frontend-only demonstration. To extend:

1. Fork the repository
2. Create a feature branch
3. Implement backend API
4. Add comprehensive tests
5. Submit pull request

## 📞 Support

For questions or issues:

- Review the code comments for implementation details
- Check the mock API service for data structure examples
- Examine component props for customization options

## 🎓 Key Learning Points

This project demonstrates:

- ✅ Complex state management with Context API
- ✅ Professional component architecture
- ✅ Industrial UI/UX design principles
- ✅ Chart integration with Recharts
- ✅ Form validation and error handling
- ✅ Protected routing with authentication
- ✅ Responsive design patterns
- ✅ Production-grade code organization

---

**Built with precision for PCB manufacturing operations** 🏭
