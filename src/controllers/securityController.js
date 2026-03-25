import mongoose from "mongoose";
import { asyncHandler, httpError } from "../utils/errorHelpers.js";
import { readData, updateData } from "../store.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import { hashPassword } from "../auth.js";
import { normalizeEmail } from "../utils.js";

// Fetch bookings filtered by security availability
export const getSecurityShifts = asyncHandler(async (req, res) => {
  const data = await readData();
  const securityUser = req.authUser;
  
  if (!securityUser || securityUser.role !== "security") {
    throw httpError(403, "Access denied");
  }

  const availability = securityUser.availability || [];
  
  // Filtering logic: only show bookings that fall within security's working hours
  const filtered = data.bookings.filter(b => {
    // 1. Get day of week for booking date
    const bookingDate = new Date(b.dt);
    const dayName = bookingDate.toLocaleDateString("en-US", { weekday: "long" });
    
    // 2. Find matching availability slot
    const slot = availability.find(a => a.day === dayName);
    if (!slot || !slot.enabled) return false;

    // 3. Check if booking time falls within slot [startTime, endTime]
    // Slot times are HH:mm (24h). Booking times are usually "9:00 AM" or similar.
    // We need to normalize for comparison.
    try {
      const bTime = new Date(`2000-01-01 ${b.t}`);
      const bHour = bTime.getHours();
      const bMin = bTime.getMinutes();
      const bTotalMin = bHour * 60 + bMin;

      const [sH, sM] = slot.startTime.split(":").map(Number);
      const [eH, eM] = slot.endTime.split(":").map(Number);
      const startMinTotal = sH * 60 + sM;
      const endMinTotal = eH * 60 + eM;

      return bTotalMin >= startMinTotal && bTotalMin <= endMinTotal;
    } catch (e) {
      console.error("Error parsing time for filtering:", b.t, e);
      return true; // Fallback to show if parse fails
    }
  });
  
  // Sort by date and time
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
  const securityUser = req.authUser;

  console.log(`[BACKEND] Security verification request for booking ${id} by ${securityUser.name}`);

  const update = {
    verifiedBySecurity: true,
    securityVerifiedAt: new Date(),
    securityId: securityUser.id,
    verifiedByName: securityUser.name
  };

  const updatedBooking = await Booking.findOneAndUpdate(
    { id: id },
    { $set: update },
    { new: true }
  ).lean();

  if (!updatedBooking) throw httpError(404, "Booking not found");

  console.log(`[BACKEND] Booking ${id} verified by ${securityUser.name}`);
  res.json({ success: true, booking: updatedBooking });
});

// Update security availability
export const updateAvailability = asyncHandler(async (req, res) => {
  const userId = req.authUser.id;
  const availability = req.body.availability;

  if (!Array.isArray(availability)) {
    throw httpError(400, "Availability must be an array");
  }

  console.log(`[BACKEND] Updating availability for security user: ${req.authUser.name}`);

  const updatedUser = await User.findOneAndUpdate(
    { id: userId },
    { $set: { availability } },
    { new: true }
  ).lean();

  if (!updatedUser) throw httpError(404, "User not found");

  console.log(`[BACKEND] Security availability updated for: ${updatedUser.name}`);
  res.json({ success: true, availability: updatedUser.availability });
});

