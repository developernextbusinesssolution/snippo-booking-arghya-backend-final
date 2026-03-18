import Stripe from "stripe";
import { asyncHandler, httpError } from "../utils/errorHelpers.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY?.trim());

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount, currency = "usd", metadata = {} } = req.body;

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY is missing in environment variables");
    throw httpError(500, "Payment system configuration error (Secret key missing)");
  }

  if (!amount || amount <= 0) {
    throw httpError(400, "Invalid amount");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe error detail:", error);
    // Return Stripe error message with 400 so it's not masked as "Internal server error"
    throw httpError(400, error.message || "Stripe payment initialization failed");
  }
});
