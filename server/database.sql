-- ==========================================
-- PlaceMentor seed.sql (SHORT IDS VERSION)
-- Run after db.sql
-- ==========================================

-- USERS
INSERT INTO users (id, name, email, password, role, cgpa, branch, skills) VALUES
(1,'Admin Officer','admin@placementor.com','password123','ADMIN',NULL,NULL,'{}'),
(2,'Aarav Sharma','aarav@mail.com','password123','STUDENT',8.5,'CSE','{"React","Node.js","Java"}'),
(3,'Priya Patel','priya@mail.com','password123','STUDENT',9.2,'IT','{"Python","SQL","ML"}'),
(4,'Rohan Gupta','rohan@mail.com','password123','STUDENT',7.8,'ECE','{"C++","IoT"}'),
(5,'Neha Singh','neha@mail.com','password123','STUDENT',8.9,'CSE','{"Angular","MongoDB"}'),
(6,'Vikram Desai','vikram@mail.com','password123','STUDENT',6.5,'ME','{"Python","AutoCAD"}'),
(7,'Ananya Reddy','ananya@mail.com','password123','STUDENT',9.5,'CSE','{"AWS","Go"}'),
(8,'Aditya Verma','aditya@mail.com','password123','STUDENT',7.2,'IT','{"Java","MySQL"}'),
(9,'Simran Kaur','simran@mail.com','password123','STUDENT',8.1,'ECE','{"Networking","C"}');

-- COMPANIES
INSERT INTO companies (id, name, role, ctc, location, jd, eligibility_cgpa, eligibility_branch, deadline) VALUES
(1,'TCS','System Engineer','3.36 LPA','Pan India','Good aptitude and programming basics.',6.0,'{"CSE","IT","ECE","ME"}',CURRENT_TIMESTAMP + INTERVAL '30 days'),
(2,'Infosys','Specialist Programmer','8 LPA','Bangalore','Strong coding and DSA required.',8.0,'{"CSE","IT"}',CURRENT_TIMESTAMP + INTERVAL '20 days'),
(3,'Wipro','Project Engineer','3.5 LPA','Pan India','Support and engineering role.',6.0,'{"CSE","IT","ECE"}',CURRENT_TIMESTAMP + INTERVAL '25 days'),
(4,'Accenture','Application Analyst','6.5 LPA','Hyderabad','Modern web development skills.',7.0,'{"CSE","IT","ECE"}',CURRENT_TIMESTAMP + INTERVAL '10 days'),
(5,'Deloitte','Technology Analyst','7.6 LPA','Gurgaon','Consulting + cloud basics.',7.5,'{"CSE","IT","ECE","ME"}',CURRENT_TIMESTAMP + INTERVAL '15 days'),
(6,'Amazon','SDE 1','44 LPA','Bangalore','Strong DSA and system design.',8.5,'{"CSE","IT"}',CURRENT_TIMESTAMP + INTERVAL '7 days');

-- APPLICATIONS
INSERT INTO applications (studentId, companyId, status) VALUES
(2,6,'SHORTLISTED'),
(2,1,'SELECTED'),
(3,2,'SELECTED'),
(4,4,'SHORTLISTED'),
(5,2,'SELECTED'),
(6,1,'SELECTED'),
(7,6,'SELECTED'),
(7,5,'SHORTLISTED');

-- EXPERIENCES
INSERT INTO experiences (studentId, companyId, content) VALUES
(2,6,'Amazon coding round focused on arrays and graphs.'),
(3,2,'Infosys asked DSA and DBMS basics.'),
(6,1,'TCS had aptitude, reasoning, and HR round.'),
(7,6,'Amazon leadership principles were asked.');

-- NOTIFICATIONS
INSERT INTO notifications (userId, title, message) VALUES
(2,'Shortlisted','You are shortlisted for Amazon.'),
(2,'Selected','You are selected by TCS.'),
(3,'Selected','You are selected by Infosys.'),
(7,'Offer Update','You are selected by Amazon.'),
(5,'New Company Added','Accenture drive is live now.');