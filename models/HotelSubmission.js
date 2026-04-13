const mongoose = require('mongoose');

const HotelSubmissionSchema = new mongoose.Schema({
  hotelData: {
    hotel_name: { type: String, required: true },
    address: { type: String, required: true },
    district: { type: String, required: true },
    province: { type: String, required: true },
    postalcode: {type: String, required: true },
    region: {type: String, required: true },
    telephone: { type: String }
  },
  manager: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });

module.exports = mongoose.model('HotelSubmission', HotelSubmissionSchema);