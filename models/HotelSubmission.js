const mongoose = require('mongoose');

const HotelSubmissionSchema = new mongoose.Schema({
  hotelData: {
    hotel_name: { type: String },
    address: { type: String },
    district: { type: String },
    province: { type: String },
    postalcode: {type: String },
    region: {type: String },
    telephone: { type: String },
    description: { type: String }
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