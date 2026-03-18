import express from "express";
import { getBookings, createBooking, extendBooking, updateBookingStatus } from "../controllers/bookingController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth(), getBookings);
router.post("/", requireAuth(["user"]), createBooking);
router.patch("/:id/extend", requireAuth(["user"]), extendBooking);
router.patch("/:id/status", requireAuth(["admin", "staff"]), updateBookingStatus);

export default router;
