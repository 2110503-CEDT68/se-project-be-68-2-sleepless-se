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
            .populate('user', 'name profileImageUrl')
            .skip(startIndex)
            .limit(limit);

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

// POST /api/v1/reviews/:reviewId/report
exports.reportReview = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const reviewId = req.params.reviewId;
        const userId = req.user.id;

        if (!reason) {
            return res.status(400).json({ 
                success: false, 
                msg: 'Please provide a reason for reporting this review' 
            });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, msg: 'Review not found' });
        }

        if (
            req.user.role !== 'admin' && 
            (req.user.role !== 'manager' || req.user.hotel?.toString() !== review.hotel.toString())
        ) {
            return res.status(403).json({ 
                success: false, 
                msg: 'คุณไม่มีสิทธิ์ Report รีวิวนี้ (เฉพาะผู้จัดการโรงแรมนี้เท่านั้น)' 
            });
        }

        const alreadyReported = review.reports.find(r => r.user.toString() === userId);
        if (alreadyReported) {
            return res.status(400).json({ 
                success: false, 
                msg: 'You have already reported this review' 
            });
        }

        review.reports.push({
            user: userId,
            reason: reason
        });

        review.isReported = true; 

        await review.save();

        res.status(201).json({ 
            success: true, 
            msg: 'Review has been reported successfully',
            data: review 
        });

    } catch (err) {
        console.error("Report Review Error: ", err);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
};