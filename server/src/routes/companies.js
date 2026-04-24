const express = require('express');
const db = require('../utils/db');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all companies
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM companies');
    res.json({ success: true, companies: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get company by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM companies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, company: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Company (Admin only)
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, role, ctc, location, jd, eligibility_cgpa, eligibility_branch, deadline } = req.body;

    let parsedDeadline;
    if (deadline) {
      parsedDeadline = new Date(deadline);
    } else {
      parsedDeadline = new Date(new Date().setMonth(new Date().getMonth() + 1)); // Default 1 month
    }

    const result = await db.query(
      `INSERT INTO companies (name, role, ctc, location, jd, eligibility_cgpa, eligibility_branch, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, role, ctc, location, jd, parseFloat(eligibility_cgpa || 0), eligibility_branch || [], parsedDeadline]
    );

    res.status(201).json({ success: true, company: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Company (Admin only)
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, role, ctc, location, jd, eligibility_cgpa, eligibility_branch, deadline } = req.body;

    // In a true environment, we'd build a dynamic SQL query. Here we just update all passed fields.
    const result = await db.query(
      `UPDATE companies 
       SET name = COALESCE($1, name), 
           role = COALESCE($2, role), 
           ctc = COALESCE($3, ctc), 
           location = COALESCE($4, location), 
           jd = COALESCE($5, jd), 
           eligibility_cgpa = COALESCE($6, eligibility_cgpa), 
           eligibility_branch = COALESCE($7, eligibility_branch), 
           deadline = COALESCE($8, deadline),
           "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [name, role, ctc, location, jd, eligibility_cgpa ? parseFloat(eligibility_cgpa) : null, eligibility_branch, deadline ? new Date(deadline) : null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.json({ success: true, company: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Company (Admin only)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const result = await db.query('DELETE FROM companies WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, message: 'Company deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
