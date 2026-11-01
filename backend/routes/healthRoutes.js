const express = require('express');
const router = express.Router();
const pool = require('../config/db');

/**
 * @route   GET /api/v1/health
 * @desc    System and database health check
 * @access  Public
 */
router.get('/', async (req, res) => {
  const dbName = process.env.DB_NAME || 'school_management';
  const timestamp = new Date().toISOString();

  try {
    // 1. Verify basic MySQL ping / arithmetic query
    const [dbCheckResult] = await pool.query('SELECT 1 + 1 AS db_check');
    if (!dbCheckResult || dbCheckResult[0].db_check !== 2) {
      throw new Error('Database ping check failed');
    }

    // 2. Query table count for target database schema
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
    console.error('Database health check failed:', error.message);
    return res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      database_name: dbName,
      error: error.message,
      timestamp
    });
  }
});

module.exports = router;

