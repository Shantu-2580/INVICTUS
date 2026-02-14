const app = require('./src/app');
const pool = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server gracefully...');
    server.close(async () => {
        await pool.end();
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('\nSIGINT received, closing server gracefully...');
    server.close(async () => {
        await pool.end();
        console.log('✅ Server closed');
        process.exit(0);
    });
});
