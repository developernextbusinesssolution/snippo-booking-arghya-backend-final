import express from "express";
import { createPaymentIntent } from "../controllers/paymentController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Payments are currently open to authenticated users
router.post("/create-intent", requireAuth(), createPaymentIntent);

export default router;
