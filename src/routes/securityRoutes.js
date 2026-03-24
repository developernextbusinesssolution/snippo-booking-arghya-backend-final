import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { getSecurityShifts, verifyBooking, updateAvailability } from "../controllers/securityController.js";

const router = express.Router();

// All routes require authentication and "security" role
router.use(requireAuth(["security"]));

router.get("/shifts", getSecurityShifts);
router.post("/bookings/:id/verify", verifyBooking);
router.put("/availability", updateAvailability);

export default router;
