const express = require('express');
const db = require('../utils/db');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');

const router = express.Router();

// Multer Config for Resume Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Upload and Parse Resume
router.post('/upload', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    let parsedText = '';
    
    try {
      const pdfData = await pdfParse(fileBuffer);
      parsedText = pdfData.text;
    } catch (parseError) {
      console.error("PDF Parsing error, fallback might be needed", parseError);
      // We will still save the URL, and front-end can show fallback if parsedText is empty
    }

    const resumeUrl = `/uploads/${req.file.filename}`;

    await db.query('UPDATE users SET resume_url = $1 WHERE id = $2', [resumeUrl, req.user.id]);

    res.json({ success: true, resumeUrl, parsedText, message: 'Resume uploaded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Analyze Resume vs JD using Gemini AI
router.post('/analyze', protect, async (req, res) => {
  try {
    const { companyId, resumeText } = req.body;

    if (!resumeText) {
      return res.status(400).json({ success: false, message: 'Resume text is required' });
    }

    const companyCheck = await db.query('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (companyCheck.rows.length === 0) {
       return res.status(404).json({ success: false, message: 'Company not found' });
    }
    const company = companyCheck.rows[0];

    if (!process.env.GEMINI_API_KEY) {
       return res.status(500).json({ success: false, message: 'AI processing is disabled: missing API key' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      You are an expert ATS (Applicant Tracking System) and Career Coach.
      I will provide a Job Description and a Candidate's Resume Text.
      Please analyze and output ONLY a JSON object exactly following this structure:
      {
        "matchScore": number (0-100),
        "missingKeywords": [string, string],
        "skillsToAdd": [string, string],
        "suggestions": "A short paragraph of suggestion to improve."
      }
      
      Job Description:
      ${company.jd}
      
      Resume:
      ${resumeText}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    
    // Clean markdown if wrapped in \`\`\`json
    let responseText = response.text;
    responseText = responseText.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '').trim();
    
    const analysis = JSON.parse(responseText);

    res.json({ success: true, analysis });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
