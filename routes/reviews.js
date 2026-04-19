const express = require('express');
const router = express.Router({ mergeParams: true });
const { addReview, getReviews, updateReview, deleteReview } = require('../controllers/reviews');
const { protect } = require('../middleware/auth');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(getReviews).post(protect, addReview);
router.route('/:reviewId')
    .put(protect, authorize('admin'), updateReview)
    .delete(protect, authorize('admin'), deleteReview);

module.exports = router;