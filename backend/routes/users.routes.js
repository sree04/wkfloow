const express = require('express');
const router = express.Router();
const db = require('../config/db.config');

// Get all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM rb_user_master');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM rb_user_master WHERE idrb_user_master = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new user
router.post('/', async (req, res) => {
  const { user_name,password } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO rb_user_master (user_name, password) VALUES (?, ?)',
      [user_name, password]
    );
    res.status(201).json({ id: result.insertId, user_name,password });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;