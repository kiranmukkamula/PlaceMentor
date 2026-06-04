const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const interviewController = require('../controllers/interviewController');

// Admin Routes
router.post('/admin/create-interview-link', protect, authorize('ADMIN'), interviewController.createInterviewLink);
router.post('/admin/approve-round', protect, authorize('ADMIN'), interviewController.approveRound);

// Interviewer Routes (No auth required, relies on secure token)
router.get('/state/:token', interviewController.getInterviewState);
router.post('/next-round', interviewController.submitNextRound);
router.post('/final-select', interviewController.submitFinalSelection);

module.exports = router;
