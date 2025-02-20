// auth/jwt.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db.config');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Should be in environment variables

const login = async (req, res) => {
  const { user_name, password } = req.body;

  // Validate input
  if (!user_name || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Username and password are required'
    });
  }

  try {
    // Get user from database
    const [users] = await db.query(
      'SELECT * FROM rb_user_master WHERE user_name = ?',
      [user_name]
    );

    // Check if user exists
    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // For now, direct password comparison since bcrypt isn't implemented yet
    if (password !== user.password) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        user_id: user.idrb_user_master,
        user_name: user.user_name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send response
    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.idrb_user_master,
          user_name: user.user_name
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during login'
    });
  }
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      status: 'error',
      message: 'No token provided'
    });
  }

  // Format should be: "Bearer <token>"
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token format'
    });
  }

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
};

module.exports = {
  login,
  verifyToken
};