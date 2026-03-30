import express from "express";
import { readData } from "../store.js";
import { sendBookingToGHL } from "../services/ghlService.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../utils/errorHelpers.js";

const router = express.Router();

/**
 * POST /api/ghl/test/:bookingId
 * Manually triggers the GHL webhook for a given booking ID.
 * Returns the exact payload that was sent to GHL.
 * Requires admin auth.
 */
// router.post("/test/:bookingId", requireAuth(["admin"]), asyncHandler(async (req, res) => {
//   const bookingId = req.params.bookingId;
//   const data = await readData();

//   const booking = data.bookings.find(b => b.id === bookingId);
//   if (!booking) {
//     return res.status(404).json({ error: `Booking ${bookingId} not found` });
//   }

//   const customer = data.users.find(u => u.id === booking.userId);
//   const staffMember = data.staff.find(s => s.id === booking.staffId);

//   // Build the exact same payload that ghlService sends
//   const payload = {
//     event: "booking_confirmed",
//     timestamp: new Date().toISOString(),

//     contact_name: customer?.name || booking.name || booking.u || "",
//     first_name: (customer?.name || booking.name || "").split(" ")[0] || "",
//     last_name: (customer?.name || booking.name || "").split(" ").slice(1).join(" ") || "",
//     email: customer?.email || booking.email || "",
//     phone: customer?.phone || booking.phone || "",
//     address: customer?.address || "",
//     city: customer?.city || "",
//     state: customer?.state || "",
//     zip: customer?.zip || "",
//     country: customer?.country || "",

//     booking_id: booking.id,
//     service_name: booking.svc,
//     staff_name: staffMember?.name || booking.stf || "",
//     booking_date: booking.dt,
//     booking_time: booking.t,
//     booking_status: booking.s,
//     guests: booking.peopleCount || 1,
//     notes: booking.notes || "",

//     total_price: booking.p,
//     base_price: booking.basePrice || booking.p,
//     additional_hours: booking.additionalHours || 0,
//     additional_cost: booking.additionalCost || 0,
//     paid: booking.paid || false,

//     source: "Snippo Booking System",
//   };

//   // Send to GHL
//   const result = await sendBookingToGHL(booking, customer, staffMember, "booking_confirmed");

//   res.json({
//     success: !!result,
//     message: result ? "Data sent to GHL successfully" : "Failed to send to GHL",
//     ghl_webhook_url: process.env.GHL_WEBHOOK_URL || process.env.WEBHHOK || "NOT SET",
//     payload_sent: payload,
//   });
// }));

export default router;
