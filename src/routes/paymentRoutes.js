import express from "express";
import { createPaymentIntent } from "../controllers/paymentController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Payments are open to all (authenticated or guest)
router.post("/create-intent", createPaymentIntent);

export default router;
