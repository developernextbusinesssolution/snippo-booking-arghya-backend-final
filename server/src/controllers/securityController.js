import { asyncHandler, httpError } from "../utils/errorHelpers.js";
import { readData, updateData } from "../store.js";
import User from "../models/User.js";
import { hashPassword } from "../auth.js";
import { normalizeEmail } from "../utils.js";

// Fetch bookings for today
export const getSecurityShifts = asyncHandler(async (req, res) => {
  const data = await readData();
  const todayKey = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
  
  // Show all upcoming and active bookings across all dates
  // Also include completed bookings for today
  const filtered = data.bookings.filter(b => 
    ["upcoming", "active"].includes(b.s) || 
    (b.s === "completed" && b.dt.includes(todayKey))
  );
  
  // Robust sorting by date and time
  filtered.sort((a, b) => {
    const da = new Date(a.dt + " " + a.t);
    const db = new Date(b.dt + " " + b.t);
    return da - db;
  });

  res.json({ bookings: filtered });
});

// Verify a booking
export const verifyBooking = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const securityUserId = req.authUser.id;

  let updatedBooking = null;
  await updateData(async (data) => {
    const booking = data.bookings.find(b => b.id === id);
    if (!booking) throw httpError(404, "Booking not found");

    if (booking.verifiedBySecurity) {
      throw httpError(400, "Booking is already verified");
    }

    booking.verifiedBySecurity = true;
    booking.securityVerifiedAt = new Date().toISOString();
    booking.securityId = securityUserId;
    
    // Optionally change state if they verify it -> make it 'active' or something else?
    // User asked "just verify that the staff came and the usr came ... and then clcik verifed"
    // Keeping state intact, just setting verified flag.

    updatedBooking = booking;
    return updatedBooking;
  });

  res.json({ success: true, booking: updatedBooking });
});

// Update security availability
export const updateAvailability = asyncHandler(async (req, res) => {
  const userId = req.authUser.id;
  const availability = req.body.availability;

  if (!Array.isArray(availability)) {
    throw httpError(400, "Availability must be an array");
  }

  let updatedUser = null;
  await updateData(async (data) => {
    const user = data.users.find(u => u.id === userId);
    if (!user) throw httpError(404, "User not found");

    user.availability = availability;
    updatedUser = user;
    return updatedUser;
  });

  res.json({ success: true, availability: updatedUser.availability });
});

