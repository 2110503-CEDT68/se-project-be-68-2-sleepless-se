const Review = require('../models/Review');
const Booking = require('../models/Booking');

// POST /api/v1/hotels/:hotelId/reviews
exports.addReview = async (req, res, next) => {
    try {
        req.body.hotel = req.params.hotelId;
        req.body.user = req.user.id;

        const hasStayed = await Booking.findOne({
            user: req.user.id,
            hotel: req.params.hotelId,
            checkOutDate: { $lt: new Date() }
        });

        if (!hasStayed) {
            return res.status(403).json({
                success: false,
                msg: 'You can only review a hotel after you have booked and checked out.'
            });
        }

        const review = await Review.create(req.body);
        res.status(201).json({ success: true, data: review });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                msg: 'You have already reviewed this hotel'
            });
        }
        res.status(400).json({ success: false, msg: err.message });
    }
};

// GET /api/v1/hotels/:hotelId/reviews
exports.getReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({ hotel: req.params.hotelId })
            .populate('user', 'name');

        const avgRating = reviews.length
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : null;

        res.status(200).json({
            success: true,
            count: reviews.length,
            avgRating,
            data: reviews
        });
    } catch (err) {
        res.status(400).json({ success: false, msg: err.message });
    }
};
exports.updateReview = async (req, res, next) => {
    try {
        const review = await Review.findByIdAndUpdate(req.params.reviewId, {
            rating: req.body.rating,
            comment: req.body.comment
        }, { new: true, runValidators: true });

        if (!review) {
            return res.status(404).json({ success: false, msg: 'Review not found' });
        }

        res.status(200).json({ success: true, data: review });
    } catch (err) {
        res.status(400).json({ success: false, msg: err.message });
    }
};

exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({ success: false, msg: 'Review not found' });
        }

        await review.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, msg: err.message });
    }
};