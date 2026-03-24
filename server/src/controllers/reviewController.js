import { readData, updateData } from "../store.js";
import { asyncHandler, httpError } from "../utils/errorHelpers.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

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

    // 3. Check if already reviewed
    const existing = await Review.findOne({ bookingId });
    if (existing) throw httpError(400, "You have already reviewed this booking");

    const staffId = booking.staffId;

    // 4. Create Review
    newReview = await Review.create({
      bookingId,
      userId,
      staffId,
      rating: Number(rating),
      comment: comment || ""
    });

    // 5. Update Staff Stats
    const stats = await Review.aggregate([
      { $match: { staffId } },
      { $group: { _id: "$staffId", avg_rating: { $avg: "$rating" }, review_count: { $sum: 1 } } }
    ]);

    const newAvg = stats.length > 0 ? stats[0].avg_rating : 0;
    const newCount = stats.length > 0 ? stats[0].review_count : 0;

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
  const staffId = Number(req.params.staffId);
  const reviews = await Review.find({ staffId }).sort({ createdAt: -1 }).lean();
  
  // Join user names (assuming we need user_name for frontend)
  const reviewsWithUsers = await Promise.all(reviews.map(async (r) => {
    const user = await User.findOne({ id: r.userId }).select("name").lean();
    return { ...r, user_name: user?.name || "Deleted User" };
  }));

  res.json(reviewsWithUsers);
});
