const express = require('express');
const router = express.Router();
const db = require('../config/db.config');

// Get all roles
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM rb_role_master');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get role by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM rb_role_master WHERE idrb_role_master = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new role
router.post('/', async (req, res) => {
  const { rb_role_name, rb_role_desc } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO rb_role_master (rb_role_name, rb_role_desc) VALUES (?, ?)',
      [rb_role_name, rb_role_desc]
    );
    res.status(201).json({ id: result.insertId, rb_role_name, rb_role_desc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;