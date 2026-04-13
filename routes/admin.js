const express = require('express');
const { getSubmissions, approveSubmission, rejectSubmission } = require('../controllers/admin');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/hotel-submissions', getSubmissions);
router.post('/hotel-submissions/:id/approve', approveSubmission);
router.post('/hotel-submissions/:id/reject', rejectSubmission);

module.exports = router;