import Stripe from "stripe";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function testWebhook() {
  const bookingId = "BK-2398"; // Existing booking in db.json with paid: false
  
  const payload = JSON.stringify({
    id: "evt_test_webhook",
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: "pi_test_123",
        amount: 8500,
        currency: "usd",
        metadata: {
          bookingId: bookingId
        }
      }
    }
  });

  const signature = stripe.webhooks.generateTestHeaderString({
    payload: payload,
    secret: endpointSecret,
  });

  const port = process.env.PORT || 4000;
  const url = `http://localhost:${port}/api/payments/webhook`;

  console.log(`[TEST] Sending webhook for booking ${bookingId} to ${url}...`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signature,
      },
      body: payload,
    });

    const text = await res.text();
    console.log(`[TEST] Response (${res.status}):`, text);
    
    if (res.ok) {
        console.log("[TEST] ✅ Webhook delivered successfully.");
    } else {
        console.error("[TEST] ❌ Webhook delivery failed.");
    }
  } catch (err) {
    console.error("[TEST] ❌ Fetch Error:", err.message);
  }
}

testWebhook();
