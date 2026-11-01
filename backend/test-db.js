/**
 * CLI Database Connection & Health Verification Script
 * For Al Suffa Education System (MIS)
 *
 * Usage:
 *   node test-db.js
 */

const path = require('path');
const dotenv = require('dotenv');

// Load .env
dotenv.config({ path: path.resolve(__dirname, '.env') });
if (!process.env.DB_NAME) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const pool = require('./src/config/db');

async function testDatabaseConnection() {
  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbPort = process.env.DB_PORT || 3306;
  const dbUser = process.env.DB_USER || 'root';
  const dbName = process.env.DB_NAME || 'school_management';

  console.log('\n======================================================');
  console.log('  AL SUFFA MIS - DATABASE DIAGNOSTICS & VERIFICATION');
  console.log('======================================================');
  console.log(` Target Host     : ${dbHost}:${dbPort}`);
  console.log(` Database Name   : ${dbName}`);
  console.log(` Database User   : ${dbUser}`);
  console.log('------------------------------------------------------');
  console.log(' Connecting to MySQL database...');

  try {
    const startTime = Date.now();
    const [pingResult] = await pool.query('SELECT 1 + 1 AS db_check');
    const latency = Date.now() - startTime;

    if (!pingResult || pingResult[0].db_check !== 2) {
      throw new Error('Database ping query returned invalid result.');
    }
    console.log(` [OK] Database Ping Check Passed (${latency}ms)`);

    const [countResult] = await pool.query(
      'SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema = ?',
      [dbName]
    );
    const tableCount = countResult[0]?.total_tables ? Number(countResult[0].total_tables) : 0;
    console.log(` [OK] Total Tables Detected: ${tableCount}`);

    const [tables] = await pool.query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name ASC',
      [dbName]
    );

    console.log('------------------------------------------------------');
    console.log(` Schema Verification: Detected Tables (${tableCount}):`);
    tables.forEach((t, idx) => {
      console.log(`   ${String(idx + 1).padStart(2, ' ')}. ${t.TABLE_NAME || t.table_name}`);
    });

    console.log('------------------------------------------------------');
    if (tableCount === 19) {
      console.log(' [SUCCESS] All 19 expected schema tables are verified and active!');
    } else {
      console.log(` [WARNING] Expected 19 tables, but detected ${tableCount}. Please verify schema.sql import.`);
    }

    console.log('======================================================\n');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('\n [ERROR] Database Connection Failed!');
    console.error(` Message: ${err.message}`);
    console.error(` Error Code: ${err.code || 'N/A'}`);
    console.error('======================================================\n');
    try {
      await pool.end();
    } catch (_) {}
    process.exit(1);
  }
}

testDatabaseConnection();
