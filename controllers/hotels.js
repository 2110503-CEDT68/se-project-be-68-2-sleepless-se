const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking.js");
const HotelSubmission = require("../models/HotelSubmission");
const Review = require("../models/Review");

exports.getHotels = async (req, res, next) => {
    try {
        let query;
        const reqQuery = { ...req.query };
        const removeFields = ['select', 'sort', 'page', 'limit', 'minRating', 'maxRating', 'rating'];
        removeFields.forEach(param => delete reqQuery[param]);

        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        query = Hotel.find(JSON.parse(queryStr)).populate('bookings');

        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // --- Rating filter: ทำก่อน pagination เพื่อให้ผลถูกต้อง ---
        const hasRatingFilter = req.query.rating || req.query.minRating || req.query.maxRating;

        if (hasRatingFilter) {
            let allHotels = await query;

            const hotelsWithRating = await Promise.all(
                allHotels.map(async (hotel) => {
                    const reviews = await Review.find({ hotel: hotel._id });
                    const avg = reviews.length
                        ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
                        : null;
                    return { ...hotel.toObject(), avgRating: avg };
                })
            );

            let filtered = hotelsWithRating.filter(hotel => {
                if (hotel.avgRating === null) return false;

                if (req.query.rating) {
                    const target = parseFloat(req.query.rating);
                    if (isNaN(target) || target < 1 || target > 5) return false;
                    return Math.floor(hotel.avgRating) === Math.floor(target);
                }

                const min = req.query.minRating ? parseFloat(req.query.minRating) : null;
                const max = req.query.maxRating ? parseFloat(req.query.maxRating) : null;
                if (min !== null && hotel.avgRating < min) return false;
                if (max !== null && hotel.avgRating > max) return false;
                return true;
            });

            const total = filtered.length;
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 25;
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            const paginatedHotels = filtered.slice(startIndex, endIndex);

            const pagination = {};
            if (endIndex < total) pagination.next = { page: page + 1, limit };
            if (startIndex > 0) pagination.prev = { page: page - 1, limit };

            return res.status(200).json({
                success: true,
                count: paginatedHotels.length,
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                pagination,
                data: paginatedHotels
            });
        }

        // --- ไม่มี rating filter: paginate ปกติ ---
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const total = await Hotel.countDocuments(JSON.parse(queryStr));
        query = query.skip(startIndex).limit(limit);

        const hotels = await query;

        const pagination = {};
        if (endIndex < total) {
            pagination.next = { page: page + 1, limit };
        }
        if (startIndex > 0) {
            pagination.prev = { page: page - 1, limit };
        }

        res.status(200).json({
            success: true, count: hotels.length, total, totalPages: Math.ceil(total / limit), currentPage: page, pagination, data: hotels
        });
    } catch (err) {
        res.status(400).json({ success: false, msg: err.message });
    }
};

// @desc    Get single hotel
// @route   GET /api/v1/hotels/:id
// @access  Public
exports.getHotel = async (req, res, next) => {
    try {
        // ใช้ findById เพื่อหาข้อมูลจาก ID ที่ส่งมาทาง URL (req.params.id)
        const hotel = await Hotel.findById(req.params.id);

        // ตรวจสอบว่าพบข้อมูลหรือไม่
        if (!hotel) {
            return res.status(404).json({ 
                success: false, 
                message: `ไม่พบข้อมูลโรงแรม ID: ${req.params.id}` 
            });
        }

        // ส่งข้อมูลกลับไปเมื่อพบ
        res.status(200).json({ 
            success: true, 
            data: hotel 
        });
    } catch (err) {
        // จัดการ Error เช่น กรณีส่ง ID ผิดรูปแบบ (CastError)
        res.status(400).json({ 
            success: false, 
            error: err.message 
        });
    }
};

exports.createHotel = async (req, res, next) => {
    try {
        const hotel = await Hotel.create(req.body);
        res.status(201).json({
            success: true,
            data: hotel,
        });
    } catch (err) {
        console.log("Error in createHotel:", err.message);
        res.status(400).json({ success: false, message: "สร้างโรงแรมไม่สำเร็จ", error: err.message });
    }
};

exports.updateHotel = async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({ success: false, message: "ไม่พบโรงแรมนี้ในระบบ" });
        }

        if (req.user.role !== 'admin' && req.user.hotel?.toString() !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลของโรงแรมนี้"
            });
        }

        const submission = await HotelSubmission.create({
            hotel: req.params.id,
            hotelData: req.body,
            manager: req.user.id,
            status: "PENDING",
        });

        res.status(200).json({
            success: true,
            message: "ส่งคำขอแก้ไขสำเร็จ กรุณารอแอดมินอนุมัติ",
            data: submission,
        });
    } catch (err) {
        console.log("Update Request Error: ", err.message);
        res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

exports.deleteHotel = async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: `ไม่พบโรงแรม ID ${req.params.id}`,
            });
        }

        await Booking.deleteMany({ hotel: req.params.id });
        await Hotel.deleteOne({ _id: req.params.id });

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.log("Error in deleteHotel:", err.message);
        res.status(400).json({ success: false, error: err.message });
    }
};