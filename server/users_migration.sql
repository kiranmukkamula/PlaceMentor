-- Add company_selected_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_selected_id INTEGER REFERENCES companies(id);

-- Backfill data from applications table where status is 'SELECTED'
UPDATE users 
SET company_selected_id = (
  SELECT company_id 
  FROM applications 
  WHERE student_id = users.id AND status = 'SELECTED' 
  LIMIT 1
) 
WHERE role = 'STUDENT' AND company_selected_id IS NULL;
