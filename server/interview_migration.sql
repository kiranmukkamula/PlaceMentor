-- 1. Modify companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ROUND_ACTIVE';

-- 2. Create interview_links table
CREATE TABLE IF NOT EXISTS interview_links (
    id UUID PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    token TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create interview_results table
CREATE TABLE IF NOT EXISTS interview_results (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id), -- Note: users table is used for students in this app
    company_id INTEGER REFERENCES companies(id),
    round_number INTEGER NOT NULL,
    decision VARCHAR(20), -- 'NEXT_ROUND', 'SELECTED', 'REJECTED'
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_student_company_round UNIQUE (student_id, company_id, round_number)
);

-- 4. Create round_reviews table
CREATE TABLE IF NOT EXISTS round_reviews (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    round_number INTEGER,
    action_type VARCHAR(20), -- 'NEXT_ROUND', 'FINAL_SELECTION'
    review_status VARCHAR(20), -- 'PENDING', 'APPROVED'
    created_at TIMESTAMP DEFAULT NOW()
);
