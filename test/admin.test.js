const request = require('supertest');
const express = require('express');
const { approveSubmission } = require('../controllers/admin');
const HotelSubmission = require('../models/HotelSubmission');
const Hotel = require('../models/Hotel');

jest.mock('../models/HotelSubmission');
jest.mock('../models/Hotel');

const app = express();
app.use(express.json());

// Setup mock route for testing
app.post('/api/v1/admin/hotel-submissions/:id/approve', (req, res, next) => {
    req.user = { id: 'admin123' }; 
    next();
}, approveSubmission);

describe('Admin Controller - Hotel Submission Approval', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should approve submission and update hotel data successfully', async () => {
        const mockSubmission = {
            _id: 'sub123',
            status: 'PENDING',
            hotelData: { hotel_name: 'Test Hotel', address: '123 Test St' },
            save: jest.fn().mockResolvedValue(true)
        };

        HotelSubmission.findById.mockResolvedValue(mockSubmission);
        Hotel.findOneAndUpdate.mockResolvedValue({
            _id: 'hotel123',
            hotel_name: 'Test Hotel'
        });

        const res = await request(app).post('/api/v1/admin/hotel-submissions/sub123/approve');

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(mockSubmission.status).toBe('APPROVED');
        expect(mockSubmission.reviewedBy).toBe('admin123');
    });

    it('should return 404 if submission is not found or already processed', async () => {
        HotelSubmission.findById.mockResolvedValue(null);

        const res = await request(app).post('/api/v1/admin/hotel-submissions/invalid/approve');

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toBe('Submission not found or already processed');
    });
});