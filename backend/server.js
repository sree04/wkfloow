const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise'); // Using promise-based version
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// CORS Configuration - More secure setup
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5174', // More secure than '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use(express.json());

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root1234',
  database: process.env.DB_NAME || 'workflow_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create pool instead of single connection
const pool = mysql.createPool(dbConfig);

// Database connection test
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL database connected successfully!');
    connection.release();
  } catch (error) {
    console.error('Error connecting to MySQL database:', error);
    process.exit(1); // Exit if database connection fails
  }
};

testConnection();

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.sql) { // Database errors
    return res.status(500).json({
      status: 'error',
      message: 'Database operation failed',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized access'
    });
  }

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
};

// Request logger middleware
const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
};

app.use(requestLogger);

// Database query wrapper
const executeQuery = async (sql, params) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }
};

// Routes - Keeping auth.routes.js and workflows.routes.js
const authRoutes = require('./routes/auth.routes');
const workflowsRoutes = require('./routes/workflows.routes');

app.use('/auth', authRoutes);
app.use('/api/workflows', workflowsRoutes); // Updated to mount under /api, not /api/workflows

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handler should be last
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

module.exports = app;