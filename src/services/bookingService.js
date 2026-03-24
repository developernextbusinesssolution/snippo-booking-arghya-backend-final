import { readData, updateData } from "../store.js";
import { sendEmailJS } from "../utils/mailer.js";

/**
 * Handles booking status changes and triggers associated workflows like emails.
 * @param {string} bookingId 
 * @param {string} status - upcoming, active, completed, cancelled
 * @param {string} [fallbackEmail] - Email to use if user not found in store
 */
export const handleBookingStatusChange = async (bookingId, status, fallbackEmail = null) => {
  const allowed = ["upcoming", "active", "completed", "cancelled"];
  if (!allowed.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  let updated;
  await updateData(async (data) => {
    const booking = data.bookings.find((item) => item.id === bookingId);
    if (!booking) return null;

    console.log(`[bookingService] Updating status for ${bookingId} from ${booking.s} to ${status}`);
    booking.s = status;
    if (status === "upcoming") {
      booking.paid = true;
    }
    updated = { ...booking };
    return updated;
  });

  if (!updated) {
    console.error(`[bookingService] Failed to find booking with ID: ${bookingId}`);
    return null;
  }

  // Trigger automated emails
  if (status === "upcoming" || status === "completed" || status === "cancelled") {
    const data = await readData();
    const customer = data.users.find(u => u.id === updated.userId);
    const targetEmail = customer?.email || fallbackEmail;
    const staffMember = data.staff.find(s => s.id === updated.staffId);

    // Parse price for breakdown
    const rawPrice = parseFloat((updated.p || "0").replace(/[^0-9.]/g, "")) || 0;
    const subtotal = rawPrice.toFixed(2);
    const tax = (0).toFixed(2); 
    const totalAmount = rawPrice.toFixed(2);

    const sharedVars = {
      booking_id: updated.id, // For staff template
      invoice_id: updated.id, // For customer template
      customer_name: updated.name || updated.u || "Customer",
      customer_email: targetEmail,
      customer_phone: updated.phone || updated.det?.phone || "",
      customer_notes: updated.notes || "",
      booking_date: updated.dt,
      service_name: updated.svc,
      service_price: subtotal,
      subtotal: subtotal,
      tax: tax,
      total_amount: totalAmount,
      payment_status: status === "upcoming" ? "Paid" : status === "completed" ? "Completed" : "Cancelled",
      staff_name: staffMember?.name || updated.stf || "",
      time_slot: updated.t,
      status_label: status.toUpperCase(),
    };

    // 1. Email to Customer
    if (targetEmail) {
      console.log(`[Email] Sending confirmation to customer: ${targetEmail}`);
      sendEmailJS(
        process.env.EMAILJS_TEMPLATE_ID_CUSTOMER,
        { ...sharedVars, email: targetEmail },
        targetEmail
      ).then((res) => {
        if (res) console.log(`[Email] ✅ Customer email sent to: ${targetEmail}`);
      }).catch(err => console.error(`[Email] ❌ Customer email failed (${targetEmail}):`, err.message));
    }

    // 2. Email to Staff
    if (staffMember?.email) {
      console.log(`[Email] Sending notification to staff: ${staffMember.email}`);
      sendEmailJS(
        process.env.EMAILJS_TEMPLATE_ID_STAFF,
        { ...sharedVars, email: staffMember.email },
        staffMember.email
      ).then((res) => {
        if (res) console.log(`[Email] ✅ Staff email sent to: ${staffMember.email}`);
      }).catch(err => console.error(`[Email] ❌ Staff email failed (${staffMember.email}):`, err.message));
    } else {
      console.warn(`[Email] ⚠️ Staff member (${updated.stf}) has no email — skipping notification`);
    }
  }

  return updated;
};
