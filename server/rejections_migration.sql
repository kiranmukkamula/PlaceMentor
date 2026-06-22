UPDATE applications 
SET status = 'REJECTED' 
FROM interview_results 
WHERE applications.student_id = interview_results.student_id 
  AND applications.company_id = interview_results.company_id 
  AND interview_results.decision = 'REJECTED' 
  AND applications.status != 'REJECTED';
