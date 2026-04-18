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
    if(!submission || submission.status !== 'PENDING') {
      return res.status(404).json({ success: false, message: 'Submission not found or already processed' });
    }
    const newHotel =  await Hotel.create(submission.hotelData);

    submission.status = 'APPROVED';
    submission.reviewedBy = req.user.id;
    await submission.save();

    res.status(200).json({ success: true, message: 'Approved successfully', data: newHotel });
  } catch (err) {
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