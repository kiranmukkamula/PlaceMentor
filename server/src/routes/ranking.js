const express = require('express');
const db = require('../utils/db');
const { protect, authorize } = require('../middleware/auth');
const { generateEmbedding } = require('../ai/embeddings');
const { calculateFinalScore } = require('../ai/scoring');
const { extractTechnicalEntities } = require('../nlp/extractor');

const router = express.Router();

// Analyze and Rank Candidates for a specific Company
router.post('/analyze/:companyId', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { companyId } = req.params;

    // 1. Fetch Company & Job Description
    const companyRes = await db.query('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (companyRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    const company = companyRes.rows[0];

    // 2. Parse JD dynamically using NER
    const jdEntities = extractTechnicalEntities(company.jd);
    const jdDomainText = jdEntities.domains.join(' ') + ' ' + jdEntities.normalizedSkills.join(' ');

    // 3. Generate JD Targeted Embeddings
    const [jdSemanticEmbedding, jdDomainEmbedding] = await Promise.all([
      generateEmbedding(company.jd),
      generateEmbedding(jdDomainText)
    ]);

    const jdEmbeddings = {
      semantic: jdSemanticEmbedding,
      domain: jdDomainEmbedding
    };

    // 4. Fetch all applicants for this company
    const appsRes = await db.query(
      `SELECT a.id as application_id, a.status, u.id as user_id, u.name, u.resume_parsed_data, u.resume_embedding 
       FROM applications a
       JOIN users u ON a.student_id = u.id
       WHERE a.company_id = $1`, 
       [companyId]
    );

    const applications = appsRes.rows;
    if (applications.length === 0) {
      return res.json({ success: true, message: 'No applicants found', ranked: [] });
    }

    const updatedApplications = [];

    // 5. Process each applicant
    for (const app of applications) {
      if (!app.resume_embedding || !app.resume_parsed_data) {
        await db.query(
          `UPDATE applications 
           SET ai_final_score = 0, ai_semantic_score = 0, ai_skills_score = 0, ai_project_score = 0 
           WHERE id = $1`, [app.application_id]
        );
        continue;
      }

      const parsedData = typeof app.resume_parsed_data === 'string' 
        ? JSON.parse(app.resume_parsed_data) 
        : app.resume_parsed_data;
        
      const resumeEmbeddings = typeof app.resume_embedding === 'string'
        ? JSON.parse(app.resume_embedding)
        : app.resume_embedding;

      const candidateEmbeddings = {
        semantic: resumeEmbeddings.semantic || resumeEmbeddings,
        domain: resumeEmbeddings.domain || resumeEmbeddings,
        project: resumeEmbeddings.project || resumeEmbeddings
      };

      const resumeEntities = parsedData.entities || { explicitSkills: [], normalizedSkills: [], domains: [] };
      const resumeSections = parsedData.sections || {};

      // 6. Compute Hybrid Contextual Score
      const scores = calculateFinalScore(
        jdEmbeddings,
        candidateEmbeddings,
        jdEntities,
        resumeEntities,
        resumeSections
      );

      // 7. Update Database
      await db.query(
        `UPDATE applications 
         SET ai_semantic_score = $1, ai_skills_score = $2, ai_project_score = $3, ai_final_score = $4, ai_analysis = $5
         WHERE id = $6`,
        [scores.semanticScore, scores.skillsScore, scores.projectScore, scores.finalScore, JSON.stringify(scores.explanations), app.application_id]
      );

      updatedApplications.push({
        application_id: app.application_id,
        user_id: app.user_id,
        name: app.name,
        scores
      });
    }

    // Sort descending by final score
    updatedApplications.sort((a, b) => b.scores.finalScore - a.scores.finalScore);

    res.json({ success: true, company, ranked: updatedApplications });
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk update application statuses
router.put('/bulk-status', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { applicationIds, status } = req.body;
    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid application IDs array' });
    }
    if (!['APPLIED', 'SHORTLISTED', 'REJECTED', 'SELECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Construct parameterized query for bulk update:
    // e.g. UPDATE applications SET status = $1 WHERE id = ANY($2::int[])
    await db.query(
      `UPDATE applications SET status = $1 WHERE id = ANY($2::int[])`,
      [status, applicationIds]
    );

    // Fetch user IDs for notifications
    const usersRes = await db.query(
      `SELECT student_id FROM applications WHERE id = ANY($1::int[])`,
      [applicationIds]
    );

    const userIds = usersRes.rows.map(r => r.student_id);

    if (userIds.length > 0) {
      // Bulk insert notifications
      const notifValues = userIds.map((uid) => `(${uid}, 'Application Status Updated', 'Your application status has been updated to ${status} in a recent bulk action')`).join(',');
      await db.query(`INSERT INTO notifications (user_id, title, message) VALUES ${notifValues}`);
    }

    res.json({ success: true, message: `Successfully updated ${applicationIds.length} applications to ${status}` });
  } catch (error) {
    console.error("Bulk Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
