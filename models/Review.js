const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    hotel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Please add a rating between 1 and 5'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: [true, 'Please add a comment'],
        maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    isReported: {
        type: Boolean,
        default: false
    },
    reports: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            reason: {
                type: String,
                required: [true, 'Please add a reason for reporting']
            },
            reportedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});


ReviewSchema.index({ hotel: 1, user: 1 }, { unique: true });

ReviewSchema.statics.getAverageRating = async function (hotelId) {
    console.log('Calculating average rating...');

    const obj = await this.aggregate([
        {
            $match: { hotel: hotelId } 
        },
        {
            $group: {
                _id: '$hotel', 
                averageRating: { $avg: '$rating' } 
            }
        }
    ]);

    try {
        await this.model('Hotel').findByIdAndUpdate(hotelId, {
            averageRating: obj.length > 0 ? Math.round(obj[0].averageRating * 10) / 10 : undefined
        });
    } catch (err) {
        console.error(err);
    }
};

ReviewSchema.post('save', async function () {
    await this.constructor.getAverageRating(this.hotel);
});

ReviewSchema.post('deleteOne', { document: true, query: false }, async function () {
    await this.constructor.getAverageRating(this.hotel);
});


module.exports = mongoose.model('Review', ReviewSchema);