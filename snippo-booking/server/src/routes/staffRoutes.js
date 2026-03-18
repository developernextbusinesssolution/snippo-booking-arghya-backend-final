import express from "express";
import { getStaffBookings, updateStaffServices, updateStaffAvailability, updateStaffProfile, updateStaffRate } from "../controllers/staffController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requireAuth(["staff"]));

router.get("/bookings", getStaffBookings);
router.put("/me/services", updateStaffServices);
router.put("/me/availability", updateStaffAvailability);
router.put("/me/profile", updateStaffProfile);
router.put("/me/rate", updateStaffRate);

export default router;
