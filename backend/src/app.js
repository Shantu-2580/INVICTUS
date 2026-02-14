const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const componentRoutes = require('./routes/componentRoutes');
const pcbRoutes = require('./routes/pcbRoutes');
const productionRoutes = require('./routes/productionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const importRoutes = require('./routes/importRoutes');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// CORS Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'PCB Inventory API is running',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/pcbs', pcbRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/import', importRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;
