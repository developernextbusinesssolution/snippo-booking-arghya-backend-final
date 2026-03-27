import { readData, updateData, nextCounter, getPagedBookings } from "../store.js";
import { formatDateForUi, normalizeTimeLabel, toDollarAmount } from "../utils.js";
import { asyncHandler, httpError } from "../utils/errorHelpers.js";
import { resolveStaffForUser } from "../utils/userHelpers.js";
import { sendEmail, sendTemplatedEmail, sendEmailJS } from "../utils/mailer.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import { makeToken, sanitizeUser, hashPassword } from "../auth.js";
import Stripe from "stripe";
import { handleBookingStatusChange } from "../services/bookingService.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY?.trim());

export const getBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page || "1");
  const limit = parseInt(req.query.limit || "10");

  const data = await readData();
  const user = data.users.find((item) => item.id === req.authUser.id);

  if (!user) {
    throw httpError(401, "Session invalid");
  }

  if (user.role === "admin") {
    const paged = await getPagedBookings({ page, limit });
    res.json(paged);
    return;
  }

  if (user.role === "user") {
    const paged = await getPagedBookings({ userId: user.id, page, limit });
    res.json(paged);
    return;
  }

  const staffRef = resolveStaffForUser(data, user);
  if (!staffRef) {
    res.json({ data: [], total: 0, pages: 0, currentPage: page });
    return;
  }

  const paged = await getPagedBookings({ staffId: staffRef.id, page, limit });
  res.json(paged);
});

export const createBooking = asyncHandler(async (req, res) => {
  const { serviceId, staffId, date, time, details, peopleCount, additionalHours } = req.body || {};

  let createdBooking;
  let customerInfo;
  let authToken = null;
  let authUser = null;

  // 1. Resolve or Create User
  if (req.authUser) {
    const user = await User.findOne({ id: req.authUser.id });
    if (!user) throw httpError(401, "Session invalid");

    // Update user address if provided in details
    let changed = false;
    ['address', 'city', 'state', 'zip', 'country'].forEach(k => {
      if (details[k] && details[k] !== user[k]) {
        user[k] = details[k];
        changed = true;
      }
    });
    if (changed) await user.save();

    customerInfo = { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, city: user.city, state: user.state, zip: user.zip, country: user.country };
    authUser = sanitizeUser(user);
    authToken = null; // No need to refresh token for existing users unless desired
  } else {
    // Guest booking: Auto-create user
    if (!details?.email || !details?.name) {
      throw httpError(400, "Guest name and email are required");
    }
    const email = String(details.email).trim().toLowerCase();
    let user = await User.findOne({ email }).lean();
    
    if (!user) {
      const newUserId = await nextCounter("user");
      // Use provided password or generate random one
      const password = String(details.password || "").trim();
      const passwordHash = password ? await hashPassword(password) : await hashPassword("guest-" + Math.random().toString(36).slice(-8)); 
      
      user = await User.create({
        id: newUserId,
        name: String(details.name).trim(),
        email: email,
        phone: String(details.phone || "").trim(),
        address: String(details.address || "").trim(),
        city: String(details.city || "").trim(),
        state: String(details.state || "").trim(),
        zip: String(details.zip || "").trim(),
        country: String(details.country || "IN").trim().toUpperCase(),
        passwordHash: passwordHash,
        idDocument: String(details.idImage || "").trim(), // New: ID verification doc
        role: "user",
        status: "active",
        createdAt: new Date().toISOString()
      });
      console.log(`[booking] Registered user during booking: ${email}`);
    }

    customerInfo = { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, city: user.city, state: user.state, zip: user.zip, country: user.country };
    authUser = sanitizeUser(user);
    authToken = makeToken(user);
  }

  // 2. Prepare Booking Data (but don't save yet if we want to confirm payment first? 
  // No, user wants it created "at that time").
  await updateData(async (data) => {
    const service = data.services.find((item) => item.id === Number(serviceId) && item.active);
    if (!service) throw httpError(400, "Selected service is unavailable");

    const staffMember = data.staff.find((item) => item.id === Number(staffId) && item.active);
    if (!staffMember) throw httpError(400, "Selected staff member is unavailable");

    const dateLabel = formatDateForUi(date);
    const timeLabel = normalizeTimeLabel(time);
    
    const bookingId = `BK-${await nextCounter("booking")}`;
    console.log(`[BACKEND] Creating booking ${bookingId} for email: ${customerInfo.email}`);

    // Pricing
    const baseDurationHours = parseInt(service.dur || "60") / 60;
    let basePrc = staffMember.hourlyRate > 0
      ? Math.round(baseDurationHours * staffMember.hourlyRate)
      : service.price;
    let finalPrice = basePrc;
    
    const guests = Math.min(parseInt(peopleCount || "1") || 1, 10);

    const extraHrs = parseInt(additionalHours || "0") || 0;
    const additionalCost = extraHrs * 60; // $60 per additional hour
    finalPrice += additionalCost;

    createdBooking = {
      id: bookingId,
      userId: customerInfo.id,
      name: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone,
      peopleCount: guests,
      svc: service.name,
      stf: staffMember.name,
      dt: dateLabel,
      t: timeLabel,
      p: toDollarAmount(finalPrice),
      basePrice: toDollarAmount(basePrc),
      s: "pending_payment", // Initial status
      paid: false,
      serviceId: service.id,
      staffId: staffMember.id,
      notes: String(details?.notes || "").trim(),
      createdAt: new Date().toISOString(),
      originalDuration: String(service.dur || "60"),
      additionalHours: extraHrs,
      additionalCost: additionalCost,
    };

    data.bookings.push(createdBooking);
    return createdBooking;
  });

  // 3. Create Stripe Payment Intent
  let clientSecret = "";
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("[booking] STRIPE_SECRET_KEY missing - skipping payment intent");
  } else {
    try {
      const priceInCents = Math.round(parseFloat(createdBooking.p.replace("$", "")) * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: priceInCents,
        currency: "usd",
        metadata: { bookingId: createdBooking.id, userId: createdBooking.userId },
        description: `Booking for ${createdBooking.svc} - ${createdBooking.id}`,
        shipping: {
          name: customerInfo.name,
          address: {
            line1: customerInfo.address || 'N/A',
            city: customerInfo.city || 'N/A',
            state: customerInfo.state || 'N/A',
            postal_code: customerInfo.zip || 'N/A',
            country: customerInfo.country || 'IN',
          }
        },
        automatic_payment_methods: { enabled: true },
      });
      clientSecret = paymentIntent.client_secret;
      console.log(`[booking] Created PaymentIntent for booking ${createdBooking.id}`);
    } catch (err) {
      console.error("[booking] Stripe Error:", err.message);
    }
  }

  res.status(201).json({
    booking: createdBooking,
    clientSecret,
    token: authToken,
    user: authUser
  });
});

export const extendBooking = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const extraHours = Number(req.body?.additionalHours || 0);

  if (![1, 2, 3, 4].includes(extraHours)) {
    throw httpError(400, "Additional hours must be 1, 2, 3, or 4");
  }

  let updated;
  await updateData(async (data) => {
    const booking = data.bookings.find((b) => b.id === id);
    if (!booking) throw httpError(404, "Booking not found");
    if (booking.userId !== req.authUser.id) throw httpError(403, "Forbidden");

    const today = formatDateForUi(new Date());
    if (booking.dt !== today) {
      throw httpError(400, "Extensions are only allowed on the appointment date.");
    }

    const currentExtra = booking.additionalHours || 0;
    if (currentExtra + extraHours > 4) {
      throw httpError(400, `Max 4 hours total. You have ${4 - currentExtra}h remaining.`);
    }

    const service = data.services.find((s) => s.id === booking.serviceId);
    const originalDur = parseInt(booking.originalDuration || service?.dur || "60");

    const newAdditionalHours = currentExtra + extraHours;
    const newAdditionalCost = newAdditionalHours * 60; // $60 per hour

    booking.additionalHours = newAdditionalHours;
    booking.additionalCost = newAdditionalCost;
    booking.originalDuration = booking.originalDuration || String(originalDur);
    booking.dur = String(originalDur + newAdditionalHours * 60);
    
    const currentPriceRaw = parseFloat((booking.p || "0").replace("$", ""));
    booking.p = toDollarAmount(currentPriceRaw + (extraHours * 60));

    console.log(`[notification] Booking ${id} extended by ${extraHours}h. Staff: ${booking.stf}`);
    updated = { ...booking };
  });

  res.json(updated);

  // 1. To User
  sendTemplatedEmail("booking_extension_user", req.authUser.email, {
    name: updated.u,
    bookingId: updated.id,
    extraHours: extraHours,
    dur: updated.dur
  }).catch(err => console.error('Failed to send user extension email', err));

  // 2. To Staff
  readData().then(data => {
    const staffMember = data.staff.find(s => s.id === updated.staffId);
    if (staffMember && staffMember.email) {
      sendTemplatedEmail("booking_extension_staff", staffMember.email, {
        staff: staffMember.name,
        bookingId: updated.id,
        name: updated.u,
        extraHours: extraHours,
        dur: updated.dur
      }).catch(err => console.error('Failed to notify staff of extension', err));
    }
  });

  // 3. To Admin
  sendTemplatedEmail("booking_extension_admin", process.env.SMTP_FROM_EMAIL, {
    bookingId: updated.id,
    name: updated.u,
    staff: updated.stf,
    extraHours: extraHours,
    dur: updated.dur
  }).catch(err => console.error('Failed to notify admin of extension', err));
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const status = String(req.body?.status || "");
  const allowed = ["upcoming", "active", "completed", "cancelled"];

  if (!allowed.includes(status)) throw httpError(400, "Invalid booking status");

  try {
    const data = await readData();
    const booking = data.bookings.find((item) => item.id === id);
    if (!booking) throw httpError(404, "Booking not found");

    if (req.authUser.role === "staff") {
      const staffRef = data.staff.find(s => s.id === req.authUser.staffId);
      if (!staffRef || booking.stf !== staffRef.name) {
        throw httpError(403, "You can only update status for your own bookings");
      }
    } else if (req.authUser.role === "user") {
      if (booking.userId !== req.authUser.id) {
        throw httpError(403, "Forbidden");
      }
      if (status === "upcoming" && booking.s !== "pending_payment") {
        throw httpError(400, "Only pending payments can be finalized to upcoming");
      }
    }

    console.log(`[BACKEND] Updating status to ${status} for booking ${id}`);
    const updated = await handleBookingStatusChange(id, status, req.authUser.email);
    res.json(updated);
  } catch (err) {
    console.error(`[BACKEND] Failed to update booking status: ${err.message}`);
    throw httpError(err.status || 400, err.message);
  }
});

export const getBooking = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  console.log(`[BACKEND] Fetching booking metadata for ID: ${id}`);
  const data = await readData();
  const booking = data.bookings.find((b) => b.id === id);

  if (!booking) throw httpError(404, "Booking not found");

  const user = data.users.find(u => u.id === req.authUser.id);
  if (!user) throw httpError(401, "Session invalid");

  if (user.role === "admin") { /* ok */ }
  else if (user.role === "staff") {
    const staffRef = data.staff.find(s => s.id === user.staffId);
    if (!staffRef || booking.stf !== staffRef.name) throw httpError(403, "Forbidden");
  } else if (user.role === "user") {
    if (booking.userId !== user.id) throw httpError(403, "Forbidden");
  }

  let clientSecret = "";
  if (booking.s === "pending_payment" && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim());
      const priceInCents = Math.round(parseFloat(booking.p.replace("$", "")) * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: priceInCents,
        currency: "usd",
        metadata: { bookingId: booking.id, userId: booking.userId },
        description: `Booking for ${booking.svc} - ${booking.id}`,
        shipping: {
          name: user.name,
          address: {
            line1: user.address || 'N/A',
            city: user.city || 'N/A',
            state: user.state || 'N/A',
            postal_code: user.zip || 'N/A',
            country: user.country || 'IN',
          }
        },
        automatic_payment_methods: { enabled: true },
      });
      clientSecret = paymentIntent.client_secret;
    } catch (err) {
      console.error("Stripe Error in getBooking:", err.message);
    }
  }

  res.json({ ...booking, clientSecret });
});
