const express = require('express');
const db = require('../utils/db');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { extractSections, extractTechnicalEntities } = require('../nlp/extractor');
const { generateEmbedding } = require('../ai/embeddings');

const router = express.Router();

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.post('/upload', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userCheck = await db.query('SELECT resume_url FROM users WHERE id = $1', [req.user.id]);
    if (userCheck.rows.length > 0 && userCheck.rows[0].resume_url) {
      const oldUrl = userCheck.rows[0].resume_url;
      try {
        const oldPath = path.join(process.cwd(), oldUrl.startsWith('/') ? oldUrl.substring(1) : oldUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (err) {
        console.error("Error deleting old resume:", err);
      }
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    let parsedText = '';
    
    try {
      const pdfData = await pdfParse(fileBuffer);
      parsedText = pdfData.text;
    } catch (parseError) {
      console.error("PDF Parsing error", parseError);
    }

    const resumeUrl = `/uploads/${req.file.filename}`;

    // --- NEW HYBRID NLP PIPELINE ---
    // 1. Extract raw sections
    const sections = extractSections(parsedText);
    
    // 2. Extract technical entities (NER) and domains
    const entities = extractTechnicalEntities(parsedText);
    
    // 3. Construct parsed data object
    const parsedData = {
      sections,
      entities
    };

    // 4. Generate Targeted Semantic Embeddings
    const domainText = entities.domains.join(' ') + ' ' + entities.normalizedSkills.join(' ');
    const projectText = sections.projects || '';
    
    // We generate 3 separate embeddings for granular context matching
    const [semanticEmbedding, domainEmbedding, projectEmbedding] = await Promise.all([
      generateEmbedding(parsedText),
      generateEmbedding(domainText),
      generateEmbedding(projectText)
    ]);

    const resumeEmbeddings = {
      semantic: semanticEmbedding,
      domain: domainEmbedding,
      project: projectEmbedding
    };
    
    await db.query(
      `UPDATE users 
       SET resume_url = $1, resume_text = $2, resume_parsed_data = $3, resume_embedding = $4 
       WHERE id = $5`, 
      [resumeUrl, parsedText, JSON.stringify(parsedData), JSON.stringify(resumeEmbeddings), req.user.id]
    );

    res.json({ 
      success: true, 
      resumeUrl, 
      message: 'Resume uploaded and processed intelligently',
      aiParsed: true 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;