import express from "express";
import { createReview, getStaffReviews } from "../controllers/reviewController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", requireAuth(["user"]), createReview);
router.get("/staff/:staffId", getStaffReviews);

export default router;
