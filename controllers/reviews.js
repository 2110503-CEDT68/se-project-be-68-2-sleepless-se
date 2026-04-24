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
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const total = await Review.countDocuments({ hotel: req.params.hotelId });

        const reviews = await Review.find({ hotel: req.params.hotelId })
            .populate('user', 'name')
            .skip(startIndex)
            .limit(limit);

        // avgRating คำนวณจากทุก review ไม่ใช่แค่หน้าปัจจุบัน
        const allReviews = await Review.find({ hotel: req.params.hotelId });
        const avgRating = allReviews.length
            ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
            : null;

        const pagination = {};
        if (endIndex < total) {
            pagination.next = { page: page + 1, limit };
        }
        if (startIndex > 0) {
            pagination.prev = { page: page - 1, limit };
        }

        res.status(200).json({
            success: true,
            count: reviews.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            pagination,
            avgRating,
            data: reviews
        });
    } catch (err) {
        res.status(400).json({ success: false, msg: err.message });
    }
};
exports.updateReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({ success: false, msg: 'Review not found' });
        }

        // Allow if admin OR the owner
        if (req.user.role !== 'admin' && review.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, msg: 'Not authorized to update this review' });
        }

        const updated = await Review.findByIdAndUpdate(
            req.params.reviewId,
            { rating: req.body.rating, comment: req.body.comment },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: updated });
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

        // Allow if admin OR the owner
        if (req.user.role !== 'admin' && review.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, msg: 'Not authorized to delete this review' });
        }

        await review.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, msg: err.message });
    }
};