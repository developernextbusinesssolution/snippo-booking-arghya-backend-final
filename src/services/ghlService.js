/**
 * GoHighLevel (GHL) Webhook Service
 * Sends booking data to GHL CRM via their webhook endpoint.
 */

const GHL_WEBHOOK_URL = process.env.GHL_WEBHOOK_URL || process.env.WEBHHOK;

/**
 * Sends booking details to the GHL webhook.
 * Called when a booking status changes to a trackable state.
 * @param {Object} booking - The booking object
 * @param {Object} customer - The customer/user object
 * @param {Object} [staffMember] - The staff member object
 * @param {string} eventType - e.g. "booking_confirmed", "booking_cancelled", "booking_completed"
 */
export const sendBookingToGHL = async (booking, customer, staffMember, eventType = "booking_confirmed") => {
  if (!GHL_WEBHOOK_URL) {
    console.warn("[GHL] ⚠️ No GHL webhook URL configured — skipping");
    return null;
  }

  const payload = {
    // Event metadata
    event: eventType,
    timestamp: new Date().toISOString(),

    // Customer / Contact info (for GHL contact creation)
    contact_name: customer?.name || booking.name || booking.u || "",
    first_name: (customer?.name || booking.name || "").split(" ")[0] || "",
    last_name: (customer?.name || booking.name || "").split(" ").slice(1).join(" ") || "",
    email: customer?.email || booking.email || "",
    phone: customer?.phone || booking.phone || "",
    address: customer?.address || "",
    city: customer?.city || "",
    state: customer?.state || "",
    zip: customer?.zip || "",
    country: customer?.country || "",

    // Booking details
    booking_id: booking.id,
    service_name: booking.svc,
    staff_name: staffMember?.name || booking.stf || "",
    booking_date: booking.dt,
    booking_time: booking.t,
    booking_status: booking.s,
    guests: booking.peopleCount || 1,
    notes: booking.notes || "",

    // Pricing
    total_price: booking.p,
    base_price: booking.basePrice || booking.p,
    additional_hours: booking.additionalHours || 0,
    additional_cost: booking.additionalCost || 0,
    paid: booking.paid || false,

    // Source
    source: "Snippo Booking System",
  };

  try {
    console.log(`[GHL] 📤 Sending ${eventType} for booking ${booking.id} to GHL...`);

    const response = await fetch(GHL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`[GHL] ✅ Successfully sent ${eventType} for booking ${booking.id} to GHL`);
      return true;
    } else {
      const text = await response.text();
      console.error(`[GHL] ❌ GHL responded with ${response.status}: ${text}`);
      return false;
    }
  } catch (err) {
    console.error(`[GHL] ❌ Failed to send to GHL webhook: ${err.message}`);
    return false;
  }
};
