const express = require('express');
const router = express.Router({ mergeParams: true });
const { addReview, getReviews, updateReview, deleteReview, reportReview } = require('../controllers/reviews');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(getReviews).post(protect, addReview);
router.route('/:reviewId')
    .put(protect, updateReview)
    .delete(protect, deleteReview);
router.post('/:reviewId/report', protect, reportReview);
module.exports = router;