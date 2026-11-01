const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Ensure root and backend environment variables are loaded
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/modules/auth/auth.routes');
const academicsRoutes = require('./src/modules/academics/academics.routes');
const studentsRoutes = require('./src/modules/students/students.routes');
const staffRoutes = require('./src/modules/staff/staff.routes');
const examinationsRoutes = require('./src/modules/examinations/examinations.routes');
const feesRoutes = require('./src/modules/fees/fees.routes');
const timetablesRoutes = require('./src/modules/timetables/timetables.routes');
const dashboardRoutes = require('./src/modules/dashboard/dashboard.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Permissive for local development: allow any localhost port or matching CLIENT_ORIGIN
    if (!origin || origin.startsWith('http://localhost') || origin === CLIENT_ORIGIN) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/v1/health', async (req, res) => {
  const dbName = process.env.DB_NAME || 'school_management';
  const timestamp = new Date().toISOString();

  try {
    const [dbCheckResult] = await pool.query('SELECT 1 + 1 AS db_check');
    if (!dbCheckResult || dbCheckResult[0].db_check !== 2) {
      throw new Error('Database ping check failed');
    }

    const [tablesResult] = await pool.query(
      'SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema = ?',
      [dbName]
    );

    const tablesDetected = tablesResult[0]?.total_tables ? Number(tablesResult[0].total_tables) : 0;

    return res.status(200).json({
      status: 'online',
      database: 'connected',
      database_name: dbName,
      tables_detected: tablesDetected,
      timestamp
    });
  } catch (error) {
    return res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      database_name: dbName,
      error: error.message,
      timestamp
    });
  }
});

// Mount Modular API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/academics', academicsRoutes);
app.use('/api/v1/students', studentsRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/examinations', examinationsRoutes);
app.use('/api/v1/fees', feesRoutes);
app.use('/api/v1/timetables', timetablesRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    system: 'Al Suffa Education System (MIS)',
    version: '2.0.0',
    status: 'operational',
    health_url: '/api/v1/health',
    modules: [
      'auth',
      'academics',
      'students',
      'staff',
      'examinations',
      'fees',
      'timetables',
      'dashboard'
    ],
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handling middleware
app.use(errorHandler);

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(` Al Suffa MIS Backend Server is active on port ${PORT}`);
  console.log(` Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(` Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log('====================================================');
});

module.exports = { app, server };
