const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const db = require('./src/utils/db');
const { extractSections, extractTechnicalEntities } = require('./src/nlp/extractor');
const { generateEmbedding } = require('./src/ai/embeddings');

async function backfillResumes() {
  console.log("Starting backfill for existing resumes...");
  try {
    const res = await db.query('SELECT id, resume_url FROM users WHERE resume_url IS NOT NULL');
    
    if (res.rows.length === 0) {
      console.log("No users found needing backfill.");
      process.exit(0);
    }

    console.log(`Found ${res.rows.length} users to process.`);

    for (const user of res.rows) {
      console.log(`Processing user ID: ${user.id}...`);
      
      try {
        const filePath = path.join(process.cwd(), user.resume_url.startsWith('/') ? user.resume_url.substring(1) : user.resume_url);
        
        if (!fs.existsSync(filePath)) {
          console.warn(`File not found for user ${user.id}: ${filePath}`);
          continue;
        }

        const fileBuffer = fs.readFileSync(filePath);
        let parsedText = '';
        
        try {
          const pdfData = await pdfParse(fileBuffer);
          parsedText = pdfData.text;
        } catch (parseError) {
          console.error(`PDF Parsing error for user ${user.id}`, parseError);
          continue;
        }

        // --- HYBRID AI PIPELINE ---
        const sections = extractSections(parsedText);
        const entities = extractTechnicalEntities(parsedText);
        
        const parsedData = { sections, entities };

        const domainText = entities.domains.join(' ') + ' ' + entities.normalizedSkills.join(' ');
        const projectText = sections.projects || '';
        
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
           SET resume_text = $1, resume_parsed_data = $2, resume_embedding = $3 
           WHERE id = $4`, 
          [parsedText, JSON.stringify(parsedData), JSON.stringify(resumeEmbeddings), user.id]
        );
        
        console.log(`Successfully updated AI data for user ${user.id}`);
      } catch (err) {
        console.error(`Error processing user ${user.id}:`, err);
      }
    }
    
    console.log("Backfill completed!");
  } catch (error) {
    console.error("Backfill failed:", error);
  } finally {
    process.exit(0);
  }
}

backfillResumes();
