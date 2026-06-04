const db = require('./src/utils/db');

async function checkData() {
  try {
    const res = await db.query('SELECT id, name, resume_url, resume_text IS NOT NULL as has_text, resume_parsed_data IS NOT NULL as has_parsed, resume_embedding IS NOT NULL as has_embedding FROM users');
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
checkData();
