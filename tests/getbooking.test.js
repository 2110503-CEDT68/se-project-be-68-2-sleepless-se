const request = require('supertest');
const express = require('express');
const { getBooking } = require('../controllers/bookings');
const Booking = require('../models/Booking');

jest.mock('../models/Booking');

const app = express();
app.use(express.json());

let mockUser = { id: 'user_1', role: 'user' };
app.get('/api/v1/bookings/:id', (req, res, next) => {
    req.user = mockUser;
    next();
}, getBooking);

describe('Booking Controller - getBooking', () => {
    afterEach(() => jest.clearAllMocks());

    it('1. should return 404 if booking is not found', async () => {
        Booking.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(null)
        });

        const res = await request(app).get('/api/v1/bookings/999');
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toContain('No booking with the id of');
    });

    it('2. should return 401 if user is not the owner and not an admin', async () => {
        const mockBooking = { user: 'other_user_id' };
        Booking.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockBooking)
        });

        const res = await request(app).get('/api/v1/bookings/123');
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toContain('is not authorized');
    });

    it('3. should return 200 if user is the admin (even if not owner)', async () => {
        mockUser = { id: 'admin_1', role: 'admin' };
        const mockBooking = { user: 'user_1' }; // คนละ id กับ admin_1
        Booking.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockBooking)
        });

        const res = await request(app).get('/api/v1/bookings/123');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('4. should return 500 if something crashes', async () => {
        Booking.findById.mockReturnValue({
            populate: jest.fn().mockRejectedValue(new Error('Query Error'))
        });

        const res = await request(app).get('/api/v1/bookings/123');
        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe('Cannot find Booking');
    });
});