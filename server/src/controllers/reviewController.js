import { readData, updateData, pool } from "../store.js";
import { asyncHandler, httpError } from "../utils/errorHelpers.js";

export const createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = req.body || {};
  const userId = req.authUser.id;

  if (!bookingId || !rating || rating < 1 || rating > 5) {
    throw httpError(400, "Invalid review data. Rating must be between 1 and 5.");
  }

  let newReview;
  await updateData(async (data) => {
    // 1. Find the booking
    const booking = data.bookings.find(b => b.id === bookingId);
    if (!booking) throw httpError(404, "Booking not found");

    // 2. Security checks
    if (booking.userId !== userId) throw httpError(403, "Forbidden: You can only review your own bookings");
    if (booking.s !== "completed") throw httpError(400, "You can only review completed bookings");

    // 3. Check if already reviewed (PostgreSQL check)
    const existing = await pool.query(`SELECT id FROM reviews WHERE booking_id = (SELECT id FROM bookings WHERE id = $1 LIMIT 1)`, [bookingId]);
    if (existing.rows.length > 0) throw httpError(400, "You have already reviewed this booking");

    // 4. Get numeric ID of booking and staff
    const bRow = await pool.query(`SELECT id, staff_id FROM bookings WHERE id = $1`, [bookingId]);
    const numericBookingId = bRow.rows[0].id;
    const staffId = bRow.rows[0].staff_id;

    // 5. Insert review into PostgreSQL
    const resReview = await pool.query(
      `INSERT INTO reviews (booking_id, user_id, staff_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [numericBookingId, userId, staffId, rating, comment || ""]
    );
    newReview = resReview.rows[0];

    // 6. Update Staff Stats
    const statsRes = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE staff_id = $1`,
      [staffId]
    );
    const newAvg = parseFloat(statsRes.rows[0].avg_rating || 0);
    const newCount = parseInt(statsRes.rows[0].review_count || 0);

    const staffMember = data.staff.find(s => s.id === staffId);
    if (staffMember) {
      staffMember.rating = newAvg;
      staffMember.reviewCount = newCount;
    }

    return true;
  });

  res.status(201).json(newReview);
});

export const getStaffReviews = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const result = await pool.query(
    `SELECT r.*, u.name as user_name 
     FROM reviews r 
     JOIN users u ON r.user_id = u.id 
     WHERE r.staff_id = $1 
     ORDER BY r.created_at DESC`,
    [staffId]
  );
  res.json(result.rows);
});
