const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  // Return DECIMAL(10,2) as JS numbers instead of strings,
  // so price/total reach the frontend as numbers.
  decimalNumbers: true,
});

// The cPanel server runs in a US timezone, but the store lives in IST.
// Pin every pooled connection to +05:30 so CURRENT_TIMESTAMP / NOW()
// (order times, OTP expiry, counters) are all stored as IST wall time.
pool.pool.on('connection', (conn) => {
  conn.query("SET time_zone = '+05:30'", (err) => {
    if (err) console.error('Failed to set DB timezone:', err.message);
  });
});

module.exports = pool;
