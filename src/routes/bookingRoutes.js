import express from "express";
import { getBookings, getBooking, createBooking, extendBooking, updateBookingStatus } from "../controllers/bookingController.js";
import { requireAuth, optionalAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth(), getBookings);
router.get("/:id", requireAuth(), getBooking);
router.post("/", optionalAuth, createBooking); 
router.patch("/:id/extend", requireAuth(["user"]), extendBooking);
router.patch("/:id/status", requireAuth(["admin", "staff", "user"]), updateBookingStatus);

export default router;
