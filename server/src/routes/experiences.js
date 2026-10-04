const express = require('express');
const db = require('../utils/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get all interview experiences (optionally filter by companyId)
router.get('/', async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = `
      SELECT e.id, e.content, e.student_id AS "studentId", e.company_id AS "companyId", 
             u.name AS "studentName", u.branch AS "studentBranch", 
             c.name AS "companyName", c.role AS "companyRole"
      FROM experiences e
      JOIN users u ON e.student_id = u.id
      JOIN companies c ON e.company_id = c.id
    `;
    const params = [];
    if (companyId) {
      query += ` WHERE e.company_id = $1`;
      params.push(companyId);
    }
    query += ` ORDER BY e.id DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, experiences: result.rows });
  } catch (error) {
    console.error("Error fetching experiences:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Post a new interview experience (Student or Admin)
router.post('/', protect, async (req, res) => {
  try {
    const { companyId, content } = req.body;
    if (!companyId || !content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Company and experience content are required' });
    }

    const companyCheck = await db.query('SELECT id FROM companies WHERE id = $1', [companyId]);
    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const result = await db.query(
      `INSERT INTO experiences (student_id, company_id, content) VALUES ($1, $2, $3) RETURNING id, student_id AS "studentId", company_id AS "companyId", content`,
      [req.user.id, companyId, content.trim()]
    );

    res.status(201).json({ success: true, experience: result.rows[0] });
  } catch (error) {
    console.error("Error posting experience:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
