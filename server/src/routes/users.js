const express = require('express');
const db = require('../utils/db');
const { protect, authorize } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Get all students with their selected company
router.get('/students', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id, u.name, u.email, u.cgpa, u.branch, u.resume_url,
        (
          SELECT c.name 
          FROM applications a 
          JOIN companies c ON a.company_id = c.id 
          WHERE a.student_id = u.id AND a.status = 'SELECTED' 
          LIMIT 1
        ) as selected_company
      FROM users u
      WHERE u.role = 'STUDENT'
      ORDER BY u.id ASC
    `);

    res.json({ success: true, students: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Notify student to upload resume
router.post('/:id/notify-resume', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1 AND role = $2', [id, 'STUDENT']);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await db.query(
      `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
      [id, 'Resume Required', 'Admin has requested you to upload your resume urgently for placement activities.']
    );

    res.json({ success: true, message: 'Notification sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete student resume
router.delete('/:id/resume', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user to find the file path
    const userCheck = await db.query('SELECT resume_url FROM users WHERE id = $1 AND role = $2', [id, 'STUDENT']);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const resumeUrl = userCheck.rows[0].resume_url;

    if (resumeUrl) {
      // Try to delete the actual file
      try {
        const filePath = path.join(process.cwd(), resumeUrl.startsWith('/') ? resumeUrl.substring(1) : resumeUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error("Error deleting file:", err);
        // Continue even if file deletion fails, we still want to remove it from DB
      }
    }

    // Update the database to remove resume data
    await db.query(`
      UPDATE users 
      SET resume_url = NULL, resume_text = NULL, resume_parsed_data = NULL, resume_embedding = NULL 
      WHERE id = $1
    `, [id]);

    // Also update any AI scores to 0 for this student's applications
    await db.query(`
      UPDATE applications 
      SET ai_final_score = 0, ai_semantic_score = 0, ai_skills_score = 0, ai_project_score = 0, ai_analysis = NULL
      WHERE student_id = $1
    `, [id]);

    res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
