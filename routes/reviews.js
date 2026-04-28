const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  addReview,
  getReviews,
  updateReview,
  deleteReview,
  reportReview,
  rejectReview,
} = require("../controllers/reviews");
const { protect, authorize } = require("../middleware/auth");

router.route("/").get(getReviews).post(protect, addReview);
router
  .route("/:reviewId")
  .put(protect, updateReview)
  .delete(protect, deleteReview);
router.post("/:reviewId/report", protect, reportReview);
router.put("/:reviewId/reject", protect, authorize("admin"), rejectReview);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64f1b2c3d4e5f6a7b8c9d0e5"
 *         user:
 *           type: string
 *           example: "64f1b2c3d4e5f6a7b8c9d0e2"
 *         reason:
 *           type: string
 *           example: "This review contains inappropriate content"
 *         reportedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *
 *     Review:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64f1b2c3d4e5f6a7b8c9d0e4"
 *         hotel:
 *           type: string
 *           example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: "64f1b2c3d4e5f6a7b8c9d0e2"
 *             name:
 *               type: string
 *               example: "John Doe"
 *             profileImageUrl:
 *               type: string
 *               example: "https://example.com/images/profile.jpg"
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *         comment:
 *           type: string
 *           maxLength: 500
 *           example: "Great hotel, clean rooms and friendly staff!"
 *         status:
 *           type: string
 *           description: Review status — set to 'rejected' by admin if review violates policy
 *           example: "rejected"
 *           nullable: true
 *         isReported:
 *           type: boolean
 *           example: false
 *         reports:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Report'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 */

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Hotel review management. Accessed via /api/v1/hotels/{hotelId}/reviews
 */

/**
 * @swagger
 * /api/v1/hotels/{hotelId}/reviews:
 *   get:
 *     summary: Get all reviews for a specific hotel
 *     description: >
 *       Returns paginated reviews for the hotel along with the overall `avgRating`
 *       computed from all reviews (not just the current page).
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *         example: "64f1b2c3d4e5f6a7b8c9d0e1"
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
 *     responses:
 *       200:
 *         description: List of reviews with pagination and average rating
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
 *                 avgRating:
 *                   type: string
 *                   description: Average rating across all reviews (null if no reviews)
 *                   example: "4.2"
 *                   nullable: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
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
 *                   example: "Cast to ObjectId failed"
 *
 *   post:
 *     summary: Add a review for a hotel
 *     description: >
 *       **ต้อง login ก่อน** และต้องเคยจองโรงแรมนี้และ checkout แล้วเท่านั้น (`checkOutDate < now`).
 *       แต่ละ user review โรงแรมเดียวกันได้ครั้งเดียว (unique index: hotel + user)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
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
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Great hotel, very clean and friendly staff!"
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error or already reviewed this hotel
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
 *                   example: "You have already reviewed this hotel"
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
 *                 msg:
 *                   type: string
 *                   example: "Not authorized to access this route"
 *       403:
 *         description: Haven't checked out from this hotel yet
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
 *                   example: "You can only review a hotel after you have booked and checked out."
 */

/**
 * @swagger
 * /api/v1/hotels/{hotelId}/reviews/{reviewId}:
 *   put:
 *     summary: Update a review
 *     description: Owner of the review or Admin can update.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *         example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *         example: "64f1b2c3d4e5f6a7b8c9d0e4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Updated: Even better on second visit!"
 *     responses:
 *       200:
 *         description: Review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Review'
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
 *                 msg:
 *                   type: string
 *                   example: "Rating must be between 1 and 5"
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
 *                 msg:
 *                   type: string
 *                   example: "Not authorized to access this route"
 *       403:
 *         description: Not your review
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
 *                   example: "Not authorized to update this review"
 *       404:
 *         description: Review not found
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
 *                   example: "Review not found"
 *
 *   delete:
 *     summary: Delete a review
 *     description: Owner of the review or Admin can delete.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *         example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *         example: "64f1b2c3d4e5f6a7b8c9d0e4"
 *     responses:
 *       200:
 *         description: Review deleted successfully
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
 *                 msg:
 *                   type: string
 *                   example: "Not authorized to access this route"
 *       403:
 *         description: Not your review
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
 *                   example: "Not authorized to delete this review"
 *       404:
 *         description: Review not found
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
 *                   example: "Review not found"
 */

/**
 * @swagger
 * /api/v1/hotels/{hotelId}/reviews/{reviewId}/report:
 *   post:
 *     summary: Report a review
 *     description: >
 *       - **Admin**: report ได้ทุก review
 *       - **Manager**: report ได้เฉพาะ review ของโรงแรมที่ตัวเองดูแล (`user.hotel === review.hotel`)
 *       - **User**: ไม่มีสิทธิ์ report
 *
 *       แต่ละ user report review เดียวกันได้ครั้งเดียว
 *       เมื่อมีการ report ครั้งแรก `isReported` จะถูกตั้งเป็น `true`
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *         example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID to report
 *         example: "64f1b2c3d4e5f6a7b8c9d0e4"
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
 *                 example: "This review contains inappropriate content"
 *     responses:
 *       201:
 *         description: Review reported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 msg:
 *                   type: string
 *                   example: "Review has been reported successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Missing reason or already reported
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
 *                   example: "You have already reported this review"
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
 *                 msg:
 *                   type: string
 *                   example: "Not authorized to access this route"
 *       403:
 *         description: Only admin or the hotel's manager can report
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
 *                   example: "คุณไม่มีสิทธิ์ Report รีวิวนี้ (เฉพาะผู้จัดการโรงแรมนี้เท่านั้น)"
 *       404:
 *         description: Review not found
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
 *                   example: "Review not found"
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
 *                 msg:
 *                   type: string
 *                   example: "Server Error"
 */

/**
 * @swagger
 * /api/v1/hotels/{hotelId}/reviews/{reviewId}/reject:
 *   put:
 *     summary: Reject a review (Admin only)
 *     description: >
 *       Admin ใช้ endpoint นี้เพื่อตั้ง `status` ของ review เป็น `rejected`
 *       เช่น เมื่อ review ถูก report และผ่านการพิจารณาแล้วว่าละเมิดนโยบาย
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Hotel ID
 *         example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID to reject
 *         example: "64f1b2c3d4e5f6a7b8c9d0e4"
 *     responses:
 *       200:
 *         description: Review rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Review'
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
 *                 msg:
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
 *                 msg:
 *                   type: string
 *                   example: "User role is not authorized to access this route"
 *       404:
 *         description: Review not found
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
 *                   example: "Review not found"
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
 *                 msg:
 *                   type: string
 *                   example: "Server Error"
 */