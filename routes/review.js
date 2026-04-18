const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams lets us access :hotelId
const { addReview, getReviews } = require('../controllers/reviews');
const { protect } = require('../middleware/auth');

router.route('/').get(getReviews).post(protect, addReview);

module.exports = router;