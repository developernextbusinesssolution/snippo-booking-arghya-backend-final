import mongoose from "mongoose";
import { readData, updateData, nextCounter, getPagedBookings, getPagedStaff, getPagedUsers, getStripeConfig, saveStripeConfig, getEmailTemplates, updateEmailTemplate, getBookingCounts } from "../store.js";
import { normalizeEmail, initials, pickColor } from "../utils.js";
import { asyncHandler, httpError } from "../utils/errorHelpers.js";
import { userByEmail } from "../utils/userHelpers.js";
import { sendEmail, sendTemplatedEmail } from "../utils/mailer.js";

export const getAdminData = asyncHandler(async (req, res) => {
  const tab = req.query.tab || "overview";
  const page = parseInt(req.query.page || "1");
  const limit = parseInt(req.query.limit || "10");

  const sortBy = req.query.sortBy || "createdAt";
  const sortOrder = parseInt(req.query.sortOrder || "-1");
  const status = req.query.status || "all";

  const data = await readData();
  
  let pagedData = {};
  if (tab === "bookings") {
    pagedData = await getPagedBookings({ page, limit, status, sortBy, sortOrder });
  } else if (tab === "staff") {
    pagedData = await getPagedStaff({ page, limit });
  } else if (tab === "security") {
    pagedData = await getPagedUsers({ page, limit, role: "security" });
  } else if (tab === "users") {
    pagedData = await getPagedUsers({ page, limit });
  } else if (tab === "emails") {
    const templates = await getEmailTemplates();
    pagedData = { templates };
  }

  const bookingCounts = await getBookingCounts();

  res.json({
    services: data.services,
    staff: data.staff,
    bookingsByTab: pagedData,
    bookings: data.bookings,
    pendingStaff: data.pendingStaff,
    bookingCounts,
    ...pagedData
  });
});

export const createService = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const desc = String(req.body?.desc || "").trim();
  const price = Number(req.body?.price || 0);
  const dur = String(req.body?.dur || "60");
  const img = String(req.body?.img || "").trim();
  const active = Boolean(req.body?.active ?? true);

  if (!name) throw httpError(400, "Service name is required");
  if (!Number.isFinite(price) || price <= 0) throw httpError(400, "Service price must be greater than zero");

  let createdService;
  await updateData(async (data) => {
    createdService = {
      id: await nextCounter("service"),
      name,
      desc,
      price,
      dur,
      img,
      active,
    };
    data.services.push(createdService);
    return createdService;
  });

  res.status(201).json(createdService);
});

export const updateService = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body?.name || "").trim();
  const desc = String(req.body?.desc || "").trim();
  const price = Number(req.body?.price || 0);
  const dur = String(req.body?.dur || "60");
  const img = String(req.body?.img || "").trim();
  const active = Boolean(req.body?.active ?? true);

  if (!name) throw httpError(400, "Service name is required");
  if (!Number.isFinite(price) || price <= 0) throw httpError(400, "Service price must be greater than zero");

  let updatedService;
  await updateData(async (data) => {
    const service = data.services.find((item) => item.id === id);
    if (!service) throw httpError(404, "Service not found");

    service.name = name;
    service.desc = desc;
    service.price = price;
    service.dur = dur;
    service.img = img;
    service.active = active;
    updatedService = service;
    return updatedService;
  });

  res.json(updatedService);
});

export const deleteService = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await updateData(async (data) => {
    const exists = data.services.some((item) => item.id === id);
    if (!exists) throw httpError(404, "Service not found");

    data.services = data.services.filter((item) => item.id !== id);
    data.staff = data.staff.map((member) => ({
      ...member,
      services: (member.services || []).filter((serviceId) => serviceId !== id),
    }));
    return true;
  });

  // Actual MongoDB Deletion
  await mongoose.model("Service").deleteOne({ id });

  res.status(204).end();
});

export const createStaff = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const role = String(req.body?.role || "").trim();
  const email = normalizeEmail(req.body?.email);
  const color = String(req.body?.c || pickColor());
  const services = Array.isArray(req.body?.services)
    ? req.body.services.map(Number).filter(Number.isFinite)
    : [];
  const avail = Array.isArray(req.body?.avail) && req.body.avail.length === 7
    ? req.body.avail.map(Boolean)
    : [true, true, true, true, true, false, false];
  const DAYS_LIST = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const availability = Array.isArray(req.body?.availability) && req.body.availability.length === 7
    ? req.body.availability
    : avail.map((en, i) => ({ day: DAYS_LIST[i], enabled: en, startTime: "09:00", endTime: "18:00" }));

  if (!name) throw httpError(400, "Name is required");
  if (!role) throw httpError(400, "Role is required");
  if (!email.includes("@")) throw httpError(400, "A valid email is required");

  let createdStaff;
  await updateData(async (data) => {
    const duplicate = data.staff.find(
      (member) => normalizeEmail(member.email) === normalizeEmail(email)
    );
    if (duplicate) throw httpError(409, "A staff member with this email already exists");

    createdStaff = {
      id: await nextCounter("staff"),
      name,
      role,
      email,
      i: initials(name),
      c: color,
      services,
      avail,
      availability,
      active: true,
    };
    data.staff.push(createdStaff);

    const linkedUser = userByEmail(data, email);
    if (linkedUser && linkedUser.role === "staff") {
      linkedUser.status = "active";
      linkedUser.staffId = createdStaff.id;
      linkedUser.name = createdStaff.name;
      linkedUser.roleTitle = createdStaff.role;
    }

    return createdStaff;
  });

  res.status(201).json(createdStaff);
});

export const updateStaff = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body?.name || "").trim();
  const role = String(req.body?.role || "").trim();
  const email = normalizeEmail(req.body?.email);
  const color = String(req.body?.c || pickColor());
  const services = Array.isArray(req.body?.services)
    ? req.body.services.map(Number).filter(Number.isFinite)
    : [];
  const avail = Array.isArray(req.body?.avail) && req.body.avail.length === 7
    ? req.body.avail.map(Boolean)
    : [true, true, true, true, true, false, false];
  const DAYS_LIST = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const availability = Array.isArray(req.body?.availability) && req.body.availability.length === 7
    ? req.body.availability
    : avail.map((en, i) => ({ day: DAYS_LIST[i], enabled: en, startTime: "09:00", endTime: "18:00" }));
  const active = Boolean(req.body?.active ?? true);

  if (!name) throw httpError(400, "Name is required");
  if (!role) throw httpError(400, "Role is required");
  if (!email.includes("@")) throw httpError(400, "A valid email is required");

  let updatedStaff;
  await updateData(async (data) => {
    const staffMember = data.staff.find((item) => item.id === id);
    if (!staffMember) throw httpError(404, "Staff member not found");

    const duplicateStaff = data.staff.find(
      (item) => item.id !== id && normalizeEmail(item.email) === email
    );
    if (duplicateStaff) throw httpError(409, "Another staff member already uses this email");

    const duplicateUser = data.users.find(
      (item) => item.id !== req.authUser.id && normalizeEmail(item.email) === email
    );
    if (duplicateUser && duplicateUser.role !== "staff") {
      throw httpError(404, "Email already belongs to another account");
    }

    const oldName = staffMember.name;
    const oldEmail = staffMember.email;

    staffMember.name = name;
    staffMember.role = role;
    staffMember.email = email;
    staffMember.c = color;
    staffMember.i = initials(name);
    staffMember.services = services;
    staffMember.avail = avail;
    staffMember.availability = availability;
    staffMember.active = active;
    updatedStaff = staffMember;

    if (oldName !== name) {
      data.bookings.forEach((booking) => {
        if (booking.stf === oldName) {
          booking.stf = name;
        }
      });
    }

    const linkedUser = data.users.find(
      (item) =>
        item.role === "staff" &&
        (item.staffId === id || normalizeEmail(item.email) === normalizeEmail(oldEmail))
    );
    if (linkedUser) {
      linkedUser.name = name;
      linkedUser.email = email;
      linkedUser.roleTitle = role;
      linkedUser.status = active ? "active" : "disabled";
      linkedUser.staffId = active ? id : null;
    }

    return updatedStaff;
  });

  res.json(updatedStaff);
});

export const deleteStaff = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await updateData(async (data) => {
    const staffMember = data.staff.find((item) => item.id === id);
    if (!staffMember) throw httpError(404, "Staff member not found");

    data.staff = data.staff.filter((item) => item.id !== id);
    const linkedUser = data.users.find(u => u.role === "staff" && u.staffId === id);
    if (linkedUser) {
      data.users = data.users.filter(u => u.id !== linkedUser.id);
    }
    return true;
  });

  // Actual MongoDB Deletion
  const staff = await mongoose.model("Staff").findOne({ id });
  if (staff) {
    const email = staff.email;
    await mongoose.model("User").deleteOne({ email, role: "staff" });
    await mongoose.model("Staff").deleteOne({ id });
  }

  res.status(204).end();
});

export const deleteUser = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  
  // Prevent deleting self (main admin)
  if (id === req.authUser.id) {
    throw httpError(403, "You cannot delete your own account");
  }

  await updateData(async (data) => {
    const userIndex = data.users.findIndex((u) => u.id === id);
    if (userIndex === -1) throw httpError(404, "User not found");

    const user = data.users[userIndex];
    if (user.role === "admin") {
      throw httpError(403, "Admin accounts cannot be deleted for safety");
    }

    // If user is staff, also remove their staff record
    if (user.role === "staff" && user.staffId) {
      data.staff = data.staff.filter(s => s.id !== user.staffId);
    }

    // Remove any bookings for this user? 
    // Usually we keep them or mark as "Deleted User", but for simplicity here we keep data clean
    data.bookings = data.bookings.filter(b => b.userId !== id);

    data.users.splice(userIndex, 1);
    return true;
  });

  // Actual MongoDB Deletion
  const user = await mongoose.model("User").findOne({ id });
  if (user) {
    if (user.role === "staff" && user.staffId) {
      await mongoose.model("Staff").deleteOne({ id: user.staffId });
    }
    await mongoose.model("User").deleteOne({ id });
    await mongoose.model("Booking").deleteMany({ userId: id });
  }

  res.status(204).end();
});

import { hashPassword } from "../auth.js";

export const createSecurityUser = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "").trim();

  if (!name || !email || !password) throw httpError(400, "Name, email, and password are required");

  let createdUser;
  await updateData(async (data) => {
    const duplicate = data.users.find(
      (item) => normalizeEmail(item.email) === normalizeEmail(email)
    );
    if (duplicate) throw httpError(409, "Email already in use");

    createdUser = {
      id: await nextCounter("user").then(c => c.toString()),
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "security",
      status: "active",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      roleTitle: "Security Officer",
      availability: [
        { day: "Monday", enabled: true, startTime: "09:00", endTime: "20:00" },
        { day: "Tuesday", enabled: true, startTime: "09:00", endTime: "20:00" },
        { day: "Wednesday", enabled: true, startTime: "09:00", endTime: "20:00" },
        { day: "Thursday", enabled: true, startTime: "09:00", endTime: "20:00" },
        { day: "Friday", enabled: true, startTime: "09:00", endTime: "20:00" },
        { day: "Saturday", enabled: false, startTime: "09:00", endTime: "20:00" },
        { day: "Sunday", enabled: false, startTime: "09:00", endTime: "20:00" }
      ]
    };

    data.users.push(createdUser);
    return createdUser;
  });

  // Mask password before returning
  const { passwordHash, ...safeUser } = createdUser;
  res.status(201).json(safeUser);
});

export const approvePendingStaff = asyncHandler(async (req, res) => {
  const id = String(req.params.id);

  let approvedMember;
  let pendingStaff;
  await updateData(async (data) => {
    const pending = data.pendingStaff.find((item) => item.id === id);
    if (!pending) throw httpError(404, "Pending request not found");

    approvedMember = {
      id: await nextCounter("staff"),
      name: pending.name,
      role: pending.role || "Specialist",
      email: pending.email,
      i: pending.i || initials(pending.name),
      c: pending.c || pickColor(),
      services: pending.requestedServices || [],
      avail: [true, true, true, true, true, false, false],
      availability: [
        { day: "Monday", enabled: true, startTime: "09:00", endTime: "18:00" },
        { day: "Tuesday", enabled: true, startTime: "09:00", endTime: "18:00" },
        { day: "Wednesday", enabled: true, startTime: "09:00", endTime: "18:00" },
        { day: "Thursday", enabled: true, startTime: "09:00", endTime: "18:00" },
        { day: "Friday", enabled: true, startTime: "09:00", endTime: "18:00" },
        { day: "Saturday", enabled: false, startTime: "09:00", endTime: "18:00" },
        { day: "Sunday", enabled: false, startTime: "09:00", endTime: "18:00" }
      ],
      active: true,
    };

    data.staff.push(approvedMember);
    // Remove ALL pending requests for this email, not just the current ID
    data.pendingStaff = data.pendingStaff.filter((item) => normalizeEmail(item.email) !== normalizeEmail(pending.email));
    pendingStaff = data.pendingStaff;

    const user = data.users.find(
      (item) =>
        item.role === "staff" &&
        (item.id === pending.userId || normalizeEmail(item.email) === normalizeEmail(pending.email))
    );
    if (user) {
      user.name = approvedMember.name;
      user.email = approvedMember.email;
      user.roleTitle = approvedMember.role;
      user.status = "active";
      user.staffId = approvedMember.id;
      user.pendingId = null;
    }

    return approvedMember;
  });

  res.json({ staffMember: approvedMember, pendingStaff });

  // Notify Staff
  sendTemplatedEmail("staff_account_approved", approvedMember.email, {
    name: approvedMember.name,
  }).catch(err => console.error("Staff approval email failed", err));
});

export const rejectPendingStaff = asyncHandler(async (req, res) => {
  const id = String(req.params.id);

  let pendingStaff;
  await updateData(async (data) => {
    const pending = data.pendingStaff.find((item) => item.id === id);
    if (!pending) throw httpError(404, "Pending request not found");

    data.pendingStaff = data.pendingStaff.filter((item) => item.id !== id);
    pendingStaff = data.pendingStaff;

    const user = data.users.find(
      (item) =>
        item.role === "staff" &&
        (item.id === pending.userId || normalizeEmail(item.email) === normalizeEmail(pending.email))
    );
    if (user) {
      user.status = "rejected";
      user.pendingId = null;
    }

    return true;
  });

  res.json({ pendingStaff });
});

export const getStripeSettings = asyncHandler(async (req, res) => {
  const config = await getStripeConfig();
  // Mask secret key before sending to frontend
  const maskedSecret = config.secretKey 
    ? `sk_...${config.secretKey.slice(-4)}` 
    : "";
  
  res.json({
    publishableKey: config.publishableKey || "",
    secretKey: maskedSecret,
    connected: !!(config.publishableKey && config.secretKey)
  });
});

export const saveStripeSettings = asyncHandler(async (req, res) => {
  const publishableKey = String(req.body?.publishableKey || "").trim();
  const secretKey = String(req.body?.secretKey || "").trim();

  // If secretKey comes back masked (i.e. unchanged by user), don't overwrite it
  let configToSave = { publishableKey, secretKey };
  
  if (secretKey.includes("sk_...")) {
    const existing = await getStripeConfig();
    configToSave.secretKey = existing.secretKey;
  }

  await saveStripeConfig(configToSave);
  res.json({ success: true, connected: !!(configToSave.publishableKey && configToSave.secretKey) });
});

export const testEmail = asyncHandler(async (req, res) => {
  const targetEmail = req.body?.email || process.env.SMTP_FROM_EMAIL;
  
  console.log(`[Diagnostic] Triggering test email to: ${targetEmail}`);
  
  const result = await sendEmail({
    to: targetEmail,
    subject: "Snippo Diagnostic: Test Email",
    text: "This is a test email to verify your SMTP configuration.",
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #e63946;">Snippo Email Diagnostic</h2>
        <p>If you are reading this, your SMTP configuration is working correctly!</p>
        <hr/>
        <p style="font-size: 12px; color: #666;">
          Sent at: ${new Date().toISOString()}<br/>
          From: ${process.env.SMTP_FROM_EMAIL}<br/>
          Host: ${process.env.SMTP_HOST}
        </p>
      </div>
    `
  });

  if (result) {
    res.json({ success: true, message: "Email sent successfully. Check your inbox.", messageId: result.messageId });
  } else {
    res.status(500).json({ 
      success: false, 
      error: "Failed to send email. Check Render server logs for full SMTP debug output.",
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM_EMAIL
      }
    });
  }
});

export const getTemplates = asyncHandler(async (req, res) => {
  const templates = await getEmailTemplates();
  res.json(templates);
});

export const saveTemplate = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { subject, body } = req.body || {};
  if (!subject || !body) throw httpError(400, "Subject and body are required");
  await updateEmailTemplate(id, { subject, body });
  res.json({ success: true });
});
