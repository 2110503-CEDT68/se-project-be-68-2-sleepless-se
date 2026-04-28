const request = require('supertest');
const express = require('express');
const { rejectSubmission } = require('../controllers/admin');
const HotelSubmission = require('../models/HotelSubmission');

jest.mock('../models/HotelSubmission');

const app = express();
app.use(express.json());


app.post('/api/v1/admin/hotel-submissions/:id/reject', (req, res, next) => {
    req.user = { id: 'admin_1' };
    next();
}, rejectSubmission);

describe('Admin Controller - rejectSubmission', () => {
    afterEach(() => jest.clearAllMocks());

    it('1. should return 400 if no reason is provided', async () => {
        const res = await request(app)
            .post('/api/v1/admin/hotel-submissions/123/reject')
            .send({}); // ไม่ส่ง reason

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Please provide a reason for rejection');
    });

    it('2. should return 404 if submission not found or not PENDING', async () => {
        HotelSubmission.findById.mockResolvedValue(null); 

        const res = await request(app)
            .post('/api/v1/admin/hotel-submissions/123/reject')
            .send({ reason: 'Bad data' });

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toBe('Submission not found or already processed');
    });

    it('3. should reject successfully and return 200', async () => {
        const mockSubmission = {
            _id: '123',
            status: 'PENDING',
            save: jest.fn().mockResolvedValue(true)
        };
        HotelSubmission.findById.mockResolvedValue(mockSubmission);

        const res = await request(app)
            .post('/api/v1/admin/hotel-submissions/123/reject')
            .send({ reason: 'Incomplete documents' });

        expect(res.statusCode).toEqual(200);
        expect(mockSubmission.status).toBe('REJECTED');
        expect(mockSubmission.rejectionReason).toBe('Incomplete documents');
        expect(res.body.success).toBe(true);
    });

    it('4. should return 500 if a server error occurs', async () => {
        HotelSubmission.findById.mockRejectedValue(new Error('DB failure'));

        const res = await request(app)
            .post('/api/v1/admin/hotel-submissions/123/reject')
            .send({ reason: 'Error test' });

        expect(res.statusCode).toEqual(500);
        expect(res.body.message).toBe('Server Error');
    });
});