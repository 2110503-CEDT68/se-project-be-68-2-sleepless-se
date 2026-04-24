const HotelSubmission = require('../models/HotelSubmission');
const Hotel = require('../models/Hotel');

// @desc      Get all hotel submissions
// @route     GET /api/v1/admin/hotel-submissions
// @access    Private
exports.getSubmissions = async (req, res, next) => {
  try {
    let queryCondition = {};

    if(req.query.status) {
      queryCondition.status = req.query.status;
    }

    const submissions = await HotelSubmission.find(queryCondition).populate('manager', 'name email');

    res.status(200).json({ success: true, count: submissions.length, data: submissions});
  } catch (err) {
    res.status(500).json({success: false, message: 'Server Error' });
  }
};

// @desc      Approve hotel submissions
// @route     POST /api/v1/admin/hotel-submissions/:id/approve
// @access    Private
exports.approveSubmission = async (req, res, next) => {
  try {
    let submission = await HotelSubmission.findById(req.params.id);
    if (!submission || submission.status !== 'PENDING') {
      return res.status(404).json({ success: false, message: 'ไม่พบใบคำขอ หรือดำเนินการไปแล้ว' });
    }

    let hotel;

    if (submission.hotel) {
      // ✅ แก้ไข Warning: เปลี่ยน new: true เป็น returnDocument: 'after'
      hotel = await Hotel.findByIdAndUpdate(
        submission.hotel,
        { $set: submission.hotelData },
        { returnDocument: 'after', runValidators: true } 
      );
    } else {
      hotel = await Hotel.create(submission.hotelData);
    }

    if (!hotel) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถประมวลผลข้อมูลโรงแรมได้' });
    }

    submission.status = 'APPROVED';
    submission.reviewedBy = req.user.id;
    await submission.save();

    res.status(200).json({ 
        success: true, 
        message: 'อนุมัติการแก้ไขสำเร็จ', 
        data: hotel 
    });

  } catch (err) {
    console.log("Approve Error: ", err);

    // 🚀 เพิ่มโค้ดดักจับ Error รหัส 11000 (ข้อมูลซ้ำ) ตรงนี้ครับ
    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyValue)[0];
      const duplicateValue = err.keyValue[duplicateField];
      return res.status(400).json({ 
        success: false, 
        message: `ไม่อนุมัติ: ข้อมูล '${duplicateField}' ที่ขอแก้ไข (${duplicateValue}) ไปซ้ำกับโรงแรมอื่นที่มีอยู่ในระบบแล้ว` 
      });
    }

    // ดัก Validation Error เดิม
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: `ข้อมูลไม่ถูกต้อง: ${message}` });
    }

    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc      Reject hotel submissions
// @route     POST /api/v1/admin/hotel-submissions/:id/reject
// @access    Private
exports.rejectSubmission = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if(!reason) {
      return res.status(400).json({ success: false, message: 'Please provide a reason for rejection' });
    }

    let submission = await HotelSubmission.findById(req.params.id);
    if(!submission || submission.status !== 'PENDING') {
      return res.status(404).json({ success: false, message: 'Submission not found or already processed' });
    }
    submission.status = 'REJECTED';
    submission.rejectionReason = reason;
    submission.reviewedBy = req.user.id;
    await submission.save();

    res.status(200).json({ success: true, message: 'Rejected successfully' });
    } catch (err) {
      console.log("Reject Error: ", err);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
};