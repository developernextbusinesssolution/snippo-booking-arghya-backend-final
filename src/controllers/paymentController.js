import Stripe from "stripe";
import { asyncHandler, httpError } from "../utils/errorHelpers.js";
import { handleBookingStatusChange } from "../services/bookingService.js";

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
      description: `Payment for Service - ${metadata.bookingId || 'General'}`,
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

export const handleStripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error("[Webhook Error] STRIPE_WEBHOOK_SECRET is missing");
    return res.status(500).send("Webhook Secret Missing");
  }

  let event;

  try {
    // req.body must be the raw buffer here
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`[Webhook Error] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata.bookingId;
    
    if (bookingId) {
      console.log(`[Webhook] Payment succeeded for booking: ${bookingId}. Updating status to upcoming...`);
      try {
        await handleBookingStatusChange(bookingId, "upcoming");
        console.log(`[Webhook] ✅ Booking ${bookingId} marked as upcoming via webhook.`);
      } catch (err) {
        console.error(`[Webhook] ❌ Failed to update booking ${bookingId}:`, err.message);
      }
    } else {
      console.warn("[Webhook] Payment success received but no bookingId in metadata");
    }
  } else {
    console.log(`[Webhook] Received unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});
