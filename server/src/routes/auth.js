const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Register User
router.post('/register', protect, async (req, res) => {
  try {
    const { name, email, password, role, cgpa, branch, skills } = req.body;

    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const result = await db.query(
      `INSERT INTO users (name, email, password, role, cgpa, branch, skills) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role`,
      [name, email, password, role || 'STUDENT', cgpa ? parseFloat(cgpa) : null, branch, skills || []]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ success: true, user, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login User
router.post('/login', protect, async (req, res) => {
  try {
    const { email, password } = req.body;

    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = userCheck.rows[0];

    if (password !== user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Current User
router.get('/me', protect, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, cgpa, branch, skills, resumeurl FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;