const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const emailService = require('../services/emailService');

// API 1: Create Interview Link
exports.createInterviewLink = async (req, res) => {
  const { companyId } = req.body;
  
  if (!companyId) return res.status(400).json({ success: false, message: 'companyId is required' });

  try {
    const token = uuidv4();
    const id = uuidv4();
    
    // Check if company exists
    const companyRes = await db.query('SELECT id FROM companies WHERE id = $1', [companyId]);
    if (companyRes.rowCount === 0) return res.status(404).json({ success: false, message: 'Company not found' });

    await db.query(
      'INSERT INTO interview_links (id, company_id, token, is_active) VALUES ($1, $2, $3, $4)',
      [id, companyId, token, true]
    );

    res.json({ success: true, url: `/interview/${token}` });
  } catch (error) {
    console.error('Error creating interview link:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 2: Get Interview State
exports.getInterviewState = async (req, res) => {
  const { token } = req.params;

  try {
    const linkRes = await db.query('SELECT company_id, is_active FROM interview_links WHERE token = $1', [token]);
    if (linkRes.rowCount === 0) return res.status(404).json({ success: false, message: 'Invalid token' });
    
    const { company_id, is_active } = linkRes.rows[0];
    if (!is_active) return res.status(400).json({ success: false, message: 'Link is inactive' });

    const companyRes = await db.query('SELECT name, role, current_round, status FROM companies WHERE id = $1', [company_id]);
    const company = companyRes.rows[0];

    if (company.status === 'PENDING_REVIEW') {
      return res.json({ success: true, state: 'LOCKED', company });
    }
    if (company.status === 'COMPLETED') {
      return res.json({ success: true, state: 'COMPLETED', company });
    }

    let students = [];
    if (company.current_round === 1) {
      // Fetch shortlisted candidates
      const appsRes = await db.query(`
        SELECT u.id as student_id, u.name, u.email, u.branch, u.cgpa 
        FROM applications a 
        JOIN users u ON a.student_id = u.id 
        WHERE a.company_id = $1 AND a.status = 'SHORTLISTED'
      `, [company_id]);
      students = appsRes.rows;
    } else {
      // Fetch passed candidates from previous round
      const resultsRes = await db.query(`
        SELECT u.id as student_id, u.name, u.email, u.branch, u.cgpa
        FROM interview_results r
        JOIN users u ON r.student_id = u.id
        WHERE r.company_id = $1 AND r.round_number = $2 AND r.decision = 'NEXT_ROUND'
      `, [company_id, company.current_round - 1]);
      students = resultsRes.rows;
    }

    res.json({ success: true, state: 'ACTIVE', company, students });
  } catch (error) {
    console.error('Error fetching interview state:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// API 3: Submit Next Round
exports.submitNextRound = async (req, res) => {
  const { token, selectedStudentIds, allStudentIds } = req.body;
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const linkRes = await client.query('SELECT company_id FROM interview_links WHERE token = $1', [token]);
    if (linkRes.rowCount === 0) throw new Error('Invalid token');
    const { company_id } = linkRes.rows[0];

    const companyRes = await client.query('SELECT current_round FROM companies WHERE id = $1 FOR UPDATE', [company_id]);
    const current_round = companyRes.rows[0].current_round;

    for (const studentId of allStudentIds) {
      const decision = selectedStudentIds.includes(studentId) ? 'NEXT_ROUND' : 'REJECTED';
      await client.query(
        'INSERT INTO interview_results (student_id, company_id, round_number, decision) VALUES ($1, $2, $3, $4) ON CONFLICT (student_id, company_id, round_number) DO UPDATE SET decision = EXCLUDED.decision',
        [studentId, company_id, current_round, decision]
      );
    }

    await client.query(
      'INSERT INTO round_reviews (company_id, round_number, action_type, review_status) VALUES ($1, $2, $3, $4)',
      [company_id, current_round, 'NEXT_ROUND', 'PENDING']
    );

    await client.query('UPDATE companies SET status = $1 WHERE id = $2', ['PENDING_REVIEW', company_id]);

    await client.query('COMMIT');
    
    // Emit socket event to admin
    req.io.to(`admin-company-${company_id}`).emit('round-submitted', { company_id, round_number: current_round });
    
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting next round:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

// API 4: Final Select
exports.submitFinalSelection = async (req, res) => {
  const { token, selectedStudentIds, allStudentIds } = req.body;
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const linkRes = await client.query('SELECT company_id FROM interview_links WHERE token = $1', [token]);
    if (linkRes.rowCount === 0) throw new Error('Invalid token');
    const { company_id } = linkRes.rows[0];

    const companyRes = await client.query('SELECT current_round FROM companies WHERE id = $1 FOR UPDATE', [company_id]);
    const current_round = companyRes.rows[0].current_round;

    for (const studentId of allStudentIds) {
      const decision = selectedStudentIds.includes(studentId) ? 'SELECTED' : 'REJECTED';
      await client.query(
        'INSERT INTO interview_results (student_id, company_id, round_number, decision) VALUES ($1, $2, $3, $4) ON CONFLICT (student_id, company_id, round_number) DO UPDATE SET decision = EXCLUDED.decision',
        [studentId, company_id, current_round, decision]
      );
    }

    await client.query(
      'INSERT INTO round_reviews (company_id, round_number, action_type, review_status) VALUES ($1, $2, $3, $4)',
      [company_id, current_round, 'FINAL_SELECTION', 'PENDING']
    );

    await client.query('UPDATE companies SET status = $1 WHERE id = $2', ['PENDING_REVIEW', company_id]);

    await client.query('COMMIT');
    
    req.io.to(`admin-company-${company_id}`).emit('selection-submitted', { company_id, round_number: current_round });
    
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting final selection:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

// API 5: Approve Round
exports.approveRound = async (req, res) => {
  const { companyId } = req.body;
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const reviewRes = await client.query('SELECT * FROM round_reviews WHERE company_id = $1 AND review_status = $2 ORDER BY created_at DESC LIMIT 1 FOR UPDATE', [companyId, 'PENDING']);
    if (reviewRes.rowCount === 0) throw new Error('No pending review found');
    const review = reviewRes.rows[0];

    await client.query('UPDATE round_reviews SET review_status = $1 WHERE id = $2', ['APPROVED', review.id]);

    const companyRes = await client.query('SELECT current_round FROM companies WHERE id = $1', [companyId]);
    const current_round = companyRes.rows[0].current_round;
    
    const linkRes = await client.query('SELECT token FROM interview_links WHERE company_id = $1 AND is_active = true', [companyId]);
    const token = linkRes.rows.length > 0 ? linkRes.rows[0].token : null;

    if (review.action_type === 'NEXT_ROUND') {
      await client.query('UPDATE companies SET current_round = current_round + 1, status = $1 WHERE id = $2', ['ROUND_ACTIVE', companyId]);
      
      const studentsRes = await client.query(`
        SELECT u.email, u.name FROM interview_results r JOIN users u ON r.student_id = u.id
        WHERE r.company_id = $1 AND r.round_number = $2 AND r.decision = 'NEXT_ROUND'
      `, [companyId, current_round]);
      
      emailService.sendNextRoundEmail(studentsRes.rows);
      
      if (token) req.io.to(`interview-${token}`).emit('next-round-started');
      
    } else if (review.action_type === 'FINAL_SELECTION') {
      await client.query('UPDATE companies SET status = $1 WHERE id = $2', ['COMPLETED', companyId]);
      
      const studentsRes = await client.query(`
        SELECT u.email, u.name FROM interview_results r JOIN users u ON r.student_id = u.id
        WHERE r.company_id = $1 AND r.round_number = $2 AND r.decision = 'SELECTED'
      `, [companyId, current_round]);
      
      emailService.sendFinalSelectionEmail(studentsRes.rows);
      
      if (token) req.io.to(`interview-${token}`).emit('hiring-completed');
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving round:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};
