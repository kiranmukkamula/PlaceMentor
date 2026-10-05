const { Pool } = require('pg');


require('dotenv').config();

if (!process.env.DATABASE_URL && !process.env.DB_PASSWORD) {
  console.warn("⚠️ WARNING: DATABASE_URL is not set in server/.env file. Using default connection parameters.");
}

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'placement_portal',
    password: String(process.env.DB_PASSWORD || ''),
    port: parseInt(process.env.DB_PORT || '5432', 10),
  };

const pool = new Pool(poolConfig);

// Test connection on startup and initialize schema
pool.connect(async (err, client, release) => {
  if (err) {
    return console.error('❌ Error acquiring client:', err.stack);
  }
  console.log('✅ Connected to PostgreSQL database');
  release();
  await initTables();
});

const initTables = async () => {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'STUDENT',
      cgpa NUMERIC(4,2),
      branch VARCHAR(100),
      skills TEXT[],
      resume_url TEXT,
      resume_text TEXT,
      resume_parsed_data JSONB,
      resume_embedding JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ALTER statements to ensure columns exist on pre-existing users table
    ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_url TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_text TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_parsed_data JSONB;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_embedding JSONB;

    CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(255),
      ctc VARCHAR(100),
      location VARCHAR(255),
      jd TEXT,
      eligibility_cgpa NUMERIC(4,2) DEFAULT 0,
      eligibility_branch TEXT[],
      deadline TIMESTAMP,
      current_round INT DEFAULT 1,
      status VARCHAR(50) DEFAULT 'ROUND_ACTIVE',
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE companies ADD COLUMN IF NOT EXISTS current_round INT DEFAULT 1;
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ROUND_ACTIVE';
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      student_id INT REFERENCES users(id) ON DELETE CASCADE,
      company_id INT REFERENCES companies(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'APPLIED',
      match_score NUMERIC(5,2),
      ai_semantic_score NUMERIC(5,2) DEFAULT 0,
      ai_skills_score NUMERIC(5,2) DEFAULT 0,
      ai_project_score NUMERIC(5,2) DEFAULT 0,
      ai_final_score NUMERIC(5,2) DEFAULT 0,
      ai_analysis JSONB,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, company_id)
    );

    ALTER TABLE applications ADD COLUMN IF NOT EXISTS ai_semantic_score NUMERIC(5,2) DEFAULT 0;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS ai_skills_score NUMERIC(5,2) DEFAULT 0;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS ai_project_score NUMERIC(5,2) DEFAULT 0;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS ai_final_score NUMERIC(5,2) DEFAULT 0;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS experiences (
      id SERIAL PRIMARY KEY,
      student_id INT REFERENCES users(id) ON DELETE CASCADE,
      company_id INT REFERENCES companies(id) ON DELETE CASCADE,
      company_name VARCHAR(255),
      role VARCHAR(255),
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Ensure company_id column exists if table was previously created without it
    ALTER TABLE experiences ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id) ON DELETE CASCADE;

    CREATE TABLE IF NOT EXISTS interview_links (
      id VARCHAR(255) PRIMARY KEY,
      company_id INT REFERENCES companies(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS interview_results (
      id SERIAL PRIMARY KEY,
      student_id INT REFERENCES users(id) ON DELETE CASCADE,
      company_id INT REFERENCES companies(id) ON DELETE CASCADE,
      round_number INT NOT NULL,
      decision VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, company_id, round_number)
    );

    CREATE TABLE IF NOT EXISTS round_reviews (
      id SERIAL PRIMARY KEY,
      company_id INT REFERENCES companies(id) ON DELETE CASCADE,
      round_number INT NOT NULL,
      action_type VARCHAR(50) NOT NULL,
      review_status VARCHAR(50) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(schemaSql);
    // Seed default administrator admin@gmail.com with password 1234
    await pool.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ('System Admin', 'admin@gmail.com', '1234', 'ADMIN')
      ON CONFLICT (email) DO UPDATE SET password = '1234', role = 'ADMIN';
    `);
    console.log('✅ Database tables & admin user (admin@gmail.com / 1234) initialized successfully');
  } catch (err) {
    console.error('❌ Error initializing database tables:', err);
  }
};

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
