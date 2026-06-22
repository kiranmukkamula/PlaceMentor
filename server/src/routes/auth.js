const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Register User
router.post('/register', async (req, res) => {
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
router.post('/login', async (req, res) => {
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
      'SELECT id, name, email, role, cgpa, branch, skills, resume_url FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];

    // Missing resume check and notification
    if (user.role === 'STUDENT' && !user.resume_url) {
      const notifCheck = await db.query(
        `SELECT id FROM notifications WHERE user_id = $1 AND title = 'Resume Required' AND is_read = false`,
        [user.id]
      );
      if (notifCheck.rows.length === 0) {
        await db.query(
          `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
          [user.id, 'Resume Required', 'Please upload your resume from the Placement department. Without it, you cannot be ranked for jobs.']
        );
      }
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get User Notifications
router.get('/me/notifications', protect, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark Notification as Read
router.put('/me/notifications/:id/read', protect, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;