const express = require('express');
const { getHotels, getHotel, createHotel, updateHotel, deleteHotel } = require('../controllers/hotels');

const bookingRouter = require('./bookings');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth.js');

router.use('/:hotelId/bookings/', bookingRouter);
router.route('/').get(getHotels).post(protect, authorize('admin'), createHotel);
router.route('/:id')
    .get(getHotel)
    .put(protect, authorize('admin', 'manager'), updateHotel)
    .delete(protect, authorize('admin'), deleteHotel);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Hotel:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *         hotel_name:
 *           type: string
 *           example: "The Grand Hotel"
 *         address:
 *           type: string
 *           example: "123 Main Street"
 *         district:
 *           type: string
 *           example: "Watthana"
 *         province:
 *           type: string
 *           example: "Bangkok"
 *         postalcode:
 *           type: string
 *           example: "10110"
 *         telephone:
 *           type: string
 *           example: "021234567"
 *         region:
 *           type: string
 *           example: "Central"
 *         description:
 *           type: string
 *           example: "A luxury hotel in the heart of Bangkok"
 *         email:
 *           type: string
 *           example: "contact@grandhotel.com"
 *         imageURL:
 *           type: string
 *           example: "https://example.com/images/hotel.jpg"
 *         price:
 *           type: number
 *           example: 2500
 *         bookings:
 *           type: array
 *           description: Virtual field — populated bookings
 *           items:
 *             $ref: '#/components/schemas/Booking'
 */

/**
 * @swagger
 * tags:
 *   name: Hotels
 *   description: Hotel management
 */

/**
 * @swagger
 * /api/v1/hotels:
 *   get:
 *     summary: Get all hotels
 *     description: >
 *       Supports advanced filtering, field selection, sorting, pagination, and rating filters.
 *
 *       **Filtering examples:**
 *       - `?province=Bangkok` — filter by province
 *       - `?price[lte]=3000` — price ≤ 3000
 *       - `?price[gte]=1000&price[lte]=5000` — price range
 *       - `?region=Central` — filter by region
 *
 *       **Rating filters (computed from reviews):**
 *       - `?rating=4` — hotels with avgRating floor = 4
 *       - `?minRating=3&maxRating=5` — avgRating between 3 and 5
 *
 *       **Other options:**
 *       - `?select=hotel_name,price` — select specific fields
 *       - `?sort=price` — sort by field (prefix `-` for descending)
 *       - `?page=1&limit=10` — pagination
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: select
 *         schema:
 *           type: string
 *         description: Comma-separated fields to return
 *         example: "hotel_name,price,province"
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort by field. Prefix with `-` for descending
 *         example: "-price"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         example: 10
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *         description: Filter by exact star rating (floor match, 1–5)
 *         example: 4
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum average rating
 *         example: 3
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: number
 *         description: Maximum average rating
 *         example: 5
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *         description: Filter by province
 *         example: "Bangkok"
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: Filter by region
 *         example: "Central"
 *       - in: query
 *         name: price[lte]
 *         schema:
 *           type: number
 *         description: Price less than or equal to
 *         example: 3000
 *       - in: query
 *         name: price[gte]
 *         schema:
 *           type: number
 *         description: Price greater than or equal to
 *         example: 1000
 *     responses:
 *       200:
 *         description: List of hotels with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 42
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     next:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 2
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                     prev:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hotel'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 msg:
 *                   type: string
 *                   example: "Cast to number failed for value..."
 *
 *   post:
 *     summary: Create a new hotel (Admin only)
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotel_name
 *               - address
 *               - district
 *               - province
 *               - postalcode
 *               - region
 *               - price
 *             properties:
 *               hotel_name:
 *                 type: string
 *                 maxLength: 50
 *                 example: "The Grand Hotel"
 *               address:
 *                 type: string
 *                 example: "123 Main Street"
 *               district:
 *                 type: string
 *                 example: "Watthana"
 *               province:
 *                 type: string
 *                 example: "Bangkok"
 *               postalcode:
 *                 type: string
 *                 maxLength: 5
 *                 example: "10110"
 *               telephone:
 *                 type: string
 *                 example: "021234567"
 *               region:
 *                 type: string
 *                 example: "Central"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "A luxury hotel in the heart of Bangkok"
 *               email:
 *                 type: string
 *                 example: "contact@grandhotel.com"
 *               imageURL:
 *                 type: string
 *                 example: "https://example.com/images/hotel.jpg"
 *               price:
 *                 type: number
 *                 example: 2500
 *     responses:
 *       201:
 *         description: Hotel created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Hotel'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "สร้างโรงแรมไม่สำเร็จ"
 *                 error:
 *                   type: string
 *                   example: "Hotel validation failed: hotel_name: Please add a name"
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Not authorized to access this route"
 *       403:
 *         description: Forbidden — admin role required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User role is not authorized to access this route"
 */

/**
 * @swagger
 * /api/v1/hotels/{id}:
 *   get:
 *     summary: Get a single hotel by ID
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *         example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *     responses:
 *       200:
 *         description: Hotel data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Hotel'
 *       400:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Cast to ObjectId failed for value..."
 *       404:
 *         description: Hotel not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "ไม่พบข้อมูลโรงแรม ID: 64f1b2c3d4e5f6a7b8c9d0e1"
 *
 *   put:
 *     summary: Request hotel update (Admin or assigned Manager)
 *     description: >
 *       - **Admin**: อัปเดตได้ทุกโรงแรม
 *       - **Manager**: อัปเดตได้เฉพาะโรงแรมที่ตัวเองดูแล (`user.hotel === id`)
 *
 *       การแก้ไขจะไม่เกิดขึ้นทันที แต่จะสร้าง **HotelSubmission** ที่มี status `PENDING`
 *       และรอ Admin อนุมัติก่อน
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *         example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hotel_name:
 *                 type: string
 *                 example: "The Grand Hotel Updated"
 *               address:
 *                 type: string
 *                 example: "456 New Road"
 *               district:
 *                 type: string
 *                 example: "Khlong Toei"
 *               province:
 *                 type: string
 *                 example: "Bangkok"
 *               postalcode:
 *                 type: string
 *                 example: "10110"
 *               telephone:
 *                 type: string
 *                 example: "021234567"
 *               region:
 *                 type: string
 *                 example: "Central"
 *               description:
 *                 type: string
 *                 example: "Newly renovated rooms available"
 *               price:
 *                 type: number
 *                 example: 3000
 *     responses:
 *       200:
 *         description: Update request submitted — pending admin approval
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "ส่งคำขอแก้ไขสำเร็จ กรุณารอแอดมินอนุมัติ"
 *                 data:
 *                   $ref: '#/components/schemas/HotelSubmission'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Not authorized to access this route"
 *       403:
 *         description: Forbidden — not your hotel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "คุณไม่มีสิทธิ์แก้ไขข้อมูลของโรงแรมนี้"
 *       404:
 *         description: Hotel not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "ไม่พบโรงแรมนี้ในระบบ"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server Error"
 *
 *   delete:
 *     summary: Delete a hotel and all its bookings (Admin only)
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *         example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *     responses:
 *       200:
 *         description: Hotel deleted successfully (all related bookings also deleted)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   example: {}
 *       400:
 *         description: Invalid ID or unexpected error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Cast to ObjectId failed for value..."
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Not authorized to access this route"
 *       403:
 *         description: Forbidden — admin role required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User role is not authorized to access this route"
 *       404:
 *         description: Hotel not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "ไม่พบโรงแรม ID 64f1b2c3d4e5f6a7b8c9d0e1"
 */