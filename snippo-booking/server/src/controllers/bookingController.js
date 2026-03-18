import { readData, updateData, nextCounter, getPagedBookings } from "../store.js";
import { formatDateForUi, normalizeTimeLabel, toDollarAmount } from "../utils.js";
import { asyncHandler, httpError } from "../utils/errorHelpers.js";
import { resolveStaffForUser } from "../utils/userHelpers.js";
import { sendEmail, sendTemplatedEmail } from "../utils/mailer.js";

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
  
  const paged = await getPagedBookings({ staffName: staffRef.name, page, limit });
  res.json(paged);
});

export const createBooking = asyncHandler(async (req, res) => {
  const { serviceId, staffId, date, time, details } = req.body || {};

  let createdBooking;
  await updateData(async (data) => {
    const user = data.users.find((item) => item.id === req.authUser.id);
    if (!user) {
      throw httpError(401, "Session invalid");
    }

    const service = data.services.find((item) => item.id === Number(serviceId) && item.active);
    if (!service) {
      throw httpError(400, "Selected service is unavailable");
    }

    const staffMember = data.staff.find((item) => item.id === Number(staffId) && item.active);
    if (!staffMember) {
      throw httpError(400, "Selected staff member is unavailable");
    }

    if (!staffMember.services.includes(Number(service.id))) {
      throw httpError(400, "Selected staff member is not assigned to this service");
    }

    const dateLabel = formatDateForUi(date);
    const timeLabel = normalizeTimeLabel(time);
    if (!dateLabel || !timeLabel) {
      throw httpError(400, "Invalid date or time");
    }

    const hasConflict = data.bookings.some(
      (booking) =>
        booking.stf === staffMember.name &&
        booking.dt === dateLabel &&
        booking.t === timeLabel &&
        ["upcoming", "active"].includes(booking.s)
    );

    if (hasConflict) {
      throw httpError(409, "Selected slot is already booked");
    }

    const bookingId = `BK-${await nextCounter("booking")}`;
    const customerName = String(details?.name || user.name || "").trim() || user.name;

    // Dynamic pricing: staff hourlyRate × service duration hours, fall back to service price
    const durationHours = parseInt(service.dur || "120") / 60;
    const finalPrice = staffMember.hourlyRate > 0
      ? Math.round(durationHours * staffMember.hourlyRate)
      : service.price;

    createdBooking = {
      id: bookingId,
      userId: user.id,
      svc: service.name,
      stf: staffMember.name,
      dt: dateLabel,
      t: timeLabel,
      p: toDollarAmount(finalPrice),
      s: "upcoming",
      paid: true,
      u: customerName,
      serviceId: service.id,
      staffId: staffMember.id,
      notes: String(details?.notes || "").trim(),
      createdAt: new Date().toISOString(),
      originalDuration: String(service.dur || "60"),
    };

    data.bookings.push(createdBooking);
    return createdBooking;
  });

  res.status(201).json(createdBooking);

  // 1. To User
  sendTemplatedEmail("user_booking_confirmation", req.authUser.email, {
    name: createdBooking.u,
    bookingId: createdBooking.id,
    service: createdBooking.svc,
    staff: createdBooking.stf,
    date: createdBooking.dt,
    time: createdBooking.t
  }).catch(err => console.error('Failed to send user confirmation email', err));

  // 2. To Staff (Find staff email in data)
  readData().then(data => {
    const staffMember = data.staff.find(s => s.id === createdBooking.staffId);
    if (staffMember && staffMember.email) {
      sendTemplatedEmail("staff_booking_notification", staffMember.email, {
        staff: staffMember.name,
        bookingId: createdBooking.id,
        name: createdBooking.u,
        service: createdBooking.svc,
        date: createdBooking.dt,
        time: createdBooking.t
      }).catch(err => console.error('Failed to notify staff', err));
    }
  });

  // 3. To Admin
  sendTemplatedEmail("admin_booking_alert", process.env.SMTP_FROM_EMAIL, {
    bookingId: createdBooking.id,
    name: createdBooking.u,
    email: req.authUser.email,
    staff: createdBooking.stf,
    service: createdBooking.svc,
    date: createdBooking.dt,
    time: createdBooking.t
  }).catch(err => console.error('Failed to notify admin', err));
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

  let updated;
  await updateData(async (data) => {
    const booking = data.bookings.find((item) => item.id === id);
    if (!booking) throw httpError(404, "Booking not found");
    
    // Safety check for staff
    if (req.authUser.role === "staff") {
       const staffRef = data.staff.find(s => s.id === req.authUser.staffId);
       if (!staffRef || booking.stf !== staffRef.name) {
         throw httpError(403, "You can only update status for your own bookings");
       }
    }

    const oldStatus = booking.s;
    booking.s = status;
    updated = { ...booking };
    return updated;
  });

  res.json(updated);

  // Automation on completion or cancellation
  if (status === "completed" || status === "cancelled") {
    // Fetch customer email for notifications
    const data = await readData();
    const customer = data.users.find(u => u.id === updated.userId);
    const targetEmail = customer?.email || req.authUser.email;

    const emailVars = {
      name: updated.u,
      bookingId: updated.id,
      service: updated.svc,
      staff: updated.stf,
      date: updated.dt,
      time: updated.t
    };

    if (status === "completed") {
      // To User (Actual Customer)
      sendTemplatedEmail("booking_completed", targetEmail, emailVars)
        .catch(err => console.error("Completion email to user failed", err));
      
      // To Review Link (separate email to Customer)
      sendTemplatedEmail("booking_review_request", targetEmail, {
        ...emailVars,
        reviewLinkPath: "/user/dashboard/bookings"
      }).catch(err => console.error("Review request email failed", err));

      // To Staff
      const staffMember = data.staff.find(s => s.id === updated.staffId);
      if (staffMember && staffMember.email) {
        sendTemplatedEmail("booking_completed", staffMember.email, emailVars)
          .catch(err => console.error("Completion email to staff failed", err));
      }

      // To Admin
      sendTemplatedEmail("booking_completed", process.env.SMTP_FROM_EMAIL, emailVars)
        .catch(err => console.error("Completion email to admin failed", err));
    } else if (status === "cancelled") {
      // To User
      sendTemplatedEmail("booking_cancelled", targetEmail, emailVars)
        .catch(err => console.error("Cancellation email to user failed", err));

      // To Staff
      const staffMember = data.staff.find(s => s.id === updated.staffId);
      if (staffMember && staffMember.email) {
        sendTemplatedEmail("booking_cancelled", staffMember.email, emailVars)
          .catch(err => console.error("Cancellation email to staff failed", err));
      }

      // To Admin
      sendTemplatedEmail("booking_cancelled", process.env.SMTP_FROM_EMAIL, emailVars)
        .catch(err => console.error("Cancellation email to admin failed", err));
    }
  }
});
