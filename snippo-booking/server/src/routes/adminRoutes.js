import express from "express";
import {
  getAdminData,
  createService,
  updateService,
  deleteService,
  createStaff,
  updateStaff,
  deleteStaff,
  deleteUser,
  approvePendingStaff,
  rejectPendingStaff,
  getStripeSettings,
  saveStripeSettings,
  testEmail,
  getTemplates,
  saveTemplate
} from "../controllers/adminController.js";
import { updateBookingStatus } from "../controllers/bookingController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requireAuth(["admin"]));

router.get("/data", getAdminData);
router.post("/services", createService);
router.put("/services/:id", updateService);
router.delete("/services/:id", deleteService);
router.post("/staff", createStaff);
router.put("/staff/:id", updateStaff);
router.delete("/staff/:id", deleteStaff);
router.delete("/users/:id", deleteUser);
router.patch("/bookings/:id/status", updateBookingStatus);
router.post("/pending/:id/approve", approvePendingStaff);
router.post("/pending/:id/reject", rejectPendingStaff);

router.get("/stripe", getStripeSettings);
router.post("/stripe", saveStripeSettings);

router.get("/templates", getTemplates);
router.post("/templates/:id", saveTemplate);

router.post("/test-email", testEmail);

export default router;
