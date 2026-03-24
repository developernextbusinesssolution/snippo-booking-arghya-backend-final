import express from "express";
import { createPaymentIntent, handleStripeWebhook } from "../controllers/paymentController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Webhook needs raw body for signature verification
router.post("/webhook", express.raw({ type: 'application/json' }), handleStripeWebhook);

// Other payment routes need JSON body
router.use(express.json());
router.post("/create-intent", createPaymentIntent);

export default router;
