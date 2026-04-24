const express = require('express');
const db = require('../utils/db');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply for a company (Student)
router.post('/apply', protect, authorize('STUDENT'), async (req, res) => {
  try {
    const { companyId } = req.body;
    const studentId = req.user.id;

    const companyCheck = await db.query('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    const company = companyCheck.rows[0];

    if (new Date() > new Date(company.deadline)) {
      return res.status(400).json({ success: false, message: 'Deadline has passed' });
    }

    const studentCheck = await db.query('SELECT * FROM users WHERE id = $1', [studentId]);
    const student = studentCheck.rows[0];

    if (parseFloat(student.cgpa) < parseFloat(company.eligibility_cgpa)) {
      return res.status(400).json({ success: false, message: 'Not eligible based on CGPA' });
    }

    if (company.eligibility_branch && company.eligibility_branch.length > 0) {
      if (!company.eligibility_branch.includes(student.branch)) {
        return res.status(400).json({ success: false, message: 'Not eligible based on branch' });
      }
    }

    const result = await db.query(
      `INSERT INTO applications (student_id, company_id) VALUES ($1, $2) RETURNING *, student_id AS "studentId", company_id AS "companyId", applied_at AS "appliedAt"`,
      [studentId, companyId]
    );

    res.status(201).json({ success: true, application: result.rows[0] });

  } catch (error) {
    if (error.code === '23505') { // Postgres unique constraint violation
      return res.status(400).json({ success: false, message: 'You have already applied to this company' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get my applications (Student)
router.get('/me', protect, authorize('STUDENT'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, a.student_id AS "studentId", a.company_id AS "companyId", a.applied_at AS "appliedAt", row_to_json(c.*) as company 
       FROM applications a 
       JOIN companies c ON a.company_id = c.id 
       WHERE a.student_id = $1 ORDER BY a.applied_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, applications: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// View applicants for a company (Admin)
router.get('/company/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, a.student_id AS "studentId", a.company_id AS "companyId", a.applied_at AS "appliedAt", json_build_object(
         'id', u.id, 'name', u.name, 'email', u.email, 'cgpa', u.cgpa, 'branch', u.branch, 'resumeUrl', u.resume_url, 'skills', u.skills
       ) as student
       FROM applications a
       JOIN users u ON a.student_id = u.id
       WHERE a.company_id = $1 ORDER BY a.applied_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, applications: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update application status (Admin)
router.put('/:id/status', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['APPLIED', 'SHORTLISTED', 'REJECTED', 'SELECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await db.query(
      `UPDATE applications SET status = $1 WHERE id = $2 RETURNING *, student_id AS "studentId", company_id AS "companyId", applied_at AS "appliedAt"`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = result.rows[0];

    // Also notify student
    await db.query(
      `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
      [application.student_id, 'Application Status Updated', `Your application status has been updated to ${status}`]
    );

    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
