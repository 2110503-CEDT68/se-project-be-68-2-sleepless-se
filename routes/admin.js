const express = require('express');
const { getSubmissions, approveSubmission, rejectSubmission } = require('../controllers/admin');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/hotel-submissions', getSubmissions);
router.post('/hotel-submissions/:id/approve', approveSubmission);
router.post('/hotel-submissions/:id/reject', rejectSubmission);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     HotelData:
 *       type: object
 *       properties:
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
 *         region:
 *           type: string
 *           example: "Central"
 *         telephone:
 *           type: string
 *           example: "021234567"
 *         price:
 *           type: string
 *           example: "2500"
 *         description:
 *           type: string
 *           example: "A luxury hotel in the heart of Bangkok"
 *
 *     HotelSubmission:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *         hotel:
 *           type: string
 *           description: Hotel ID (ObjectId) — present if this is an edit request, absent if new hotel
 *           example: "64f1b2c3d4e5f6a7b8c9d0e2"
 *         hotelData:
 *           $ref: '#/components/schemas/HotelData'
 *         manager:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: "64f1b2c3d4e5f6a7b8c9d0e3"
 *             name:
 *               type: string
 *               example: "John Doe"
 *             email:
 *               type: string
 *               example: "johndoe@example.com"
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           example: "PENDING"
 *         rejectionReason:
 *           type: string
 *           example: ""
 *         reviewedBy:
 *           type: string
 *           example: "64f1b2c3d4e5f6a7b8c9d0e4"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-02T00:00:00.000Z"
 */

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only hotel submission management (requires admin role)
 */

/**
 * @swagger
 * /api/v1/admin/hotel-submissions:
 *   get:
 *     summary: Get all hotel submissions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         required: false
 *         description: Filter submissions by status
 *         example: "PENDING"
 *     responses:
 *       200:
 *         description: List of hotel submissions
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
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HotelSubmission'
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
 */

/**
 * @swagger
 * /api/v1/admin/hotel-submissions/{id}/approve:
 *   post:
 *     summary: Approve a hotel submission
 *     description: >
 *       If the submission has a `hotel` field (edit request), it will update the existing hotel.
 *       If not (new hotel request), it will create a new hotel from `hotelData`.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: HotelSubmission ID
 *         example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *     responses:
 *       200:
 *         description: Submission approved successfully
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
 *                   example: "อนุมัติการแก้ไขสำเร็จ"
 *                 data:
 *                   $ref: '#/components/schemas/HotelData'
 *       400:
 *         description: Cannot process hotel data / Duplicate field / Validation error
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
 *                   example: "ไม่อนุมัติ: ข้อมูล 'telephone' ที่ขอแก้ไข (021234567) ไปซ้ำกับโรงแรมอื่นที่มีอยู่ในระบบแล้ว"
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
 *         description: Submission not found or already processed
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
 *                   example: "ไม่พบใบคำขอ หรือดำเนินการไปแล้ว"
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
 */

/**
 * @swagger
 * /api/v1/admin/hotel-submissions/{id}/reject:
 *   post:
 *     summary: Reject a hotel submission
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: HotelSubmission ID
 *         example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejection
 *                 example: "ข้อมูลโรงแรมไม่ครบถ้วน"
 *     responses:
 *       200:
 *         description: Submission rejected successfully
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
 *                   example: "Rejected successfully"
 *       400:
 *         description: Reason not provided
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
 *                   example: "Please provide a reason for rejection"
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
 *         description: Submission not found or already processed
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
 *                   example: "Submission not found or already processed"
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
 */