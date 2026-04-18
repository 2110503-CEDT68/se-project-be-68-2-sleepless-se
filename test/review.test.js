const request = require('supertest');
const express = require('express');
const { addReview } = require('../controllers/reviews');
const Review = require('../models/Review');
const Booking = require('../models/Booking');

jest.mock('../models/Review');
jest.mock('../models/Booking');

const app = express();
app.use(express.json());

app.post('/api/v1/hotels/:hotelId/reviews', (req, res, next) => {
    req.user = { id: 'user123' };
    next();
}, addReview);

describe('Review Controller - User Hotel Rating System', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a review when user has a valid completed booking', async () => {
        Booking.findOne.mockResolvedValue({ _id: 'booking123' });
        
        Review.create.mockResolvedValue({
            _id: 'rev123',
            hotel: 'hotel123',
            user: 'user123',
            rating: 5,
            comment: 'Great!'
        });

        const res = await request(app)
            .post('/api/v1/hotels/hotel123/reviews')
            .send({ rating: 5, comment: 'Great!' });

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
    });

    it('should return 403 if user has no completed stay record', async () => {
        Booking.findOne.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/v1/hotels/hotel123/reviews')
            .send({ rating: 4, comment: 'Nice' });

        expect(res.statusCode).toEqual(403);
        expect(res.body.msg).toBe('You can only review a hotel after you have booked and checked out.');
    });

    it('should return 400 when user attempts to submit a duplicate review', async () => {
        Booking.findOne.mockResolvedValue({ _id: 'booking123' });
        
        const duplicateError = new Error('Duplicate');
        duplicateError.code = 11000; // Mongo Duplicate Key Error Code
        Review.create.mockRejectedValue(duplicateError);

        const res = await request(app)
            .post('/api/v1/hotels/hotel123/reviews')
            .send({ rating: 3, comment: 'Duplicate' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.msg).toBe('You have already reviewed this hotel');
    });
});