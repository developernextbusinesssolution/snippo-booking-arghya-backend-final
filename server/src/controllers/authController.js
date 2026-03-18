import { updateData, readData, nextCounter, getUserByEmail } from "../store.js";
import { hashPassword, checkPassword, makeToken, sanitizeUser } from "../auth.js";
import { normalizeEmail, initials, pickColor } from "../utils.js";
import { httpError, asyncHandler } from "../utils/errorHelpers.js";
import { resolveStaffForUser, resolvePendingForUser } from "../utils/userHelpers.js";
import { sendEmail, sendTemplatedEmail } from "../utils/mailer.js";
import fs from "node:fs/promises";
import path from "node:path";

export const registerUser = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const phone = String(req.body?.phone || "").trim();

  if (!name) throw httpError(400, "Name is required");
  if (!email.includes("@")) throw httpError(400, "A valid email is required");
  if (password.length < 6) throw httpError(400, "Password must be at least 6 characters");

  let createdUser;
  let idDocBase64 = null;

  if (req.file) {
    try {
      const buffer = await fs.readFile(req.file.path);
      idDocBase64 = `data:${req.file.mimetype};base64,${buffer.toString("base64")}`;
      await fs.unlink(req.file.path); // Delete local temp file
    } catch (err) {
      console.error("[upload] Base64 conversion failed:", err);
    }
  }

  await updateData(async (data) => {
    if (await getUserByEmail(email)) {
      throw httpError(409, "An account with this email already exists");
    }

    const idNumber = await nextCounter("user");
    const user = {
      id: `u${idNumber}`,
      name,
      email,
      phone,
      passwordHash: await hashPassword(password),
      role: "user",
      status: "active",
      idDocument: idDocBase64,
    };

    data.users.push(user);
    createdUser = user;
    return user;
  });

  const token = makeToken(createdUser);
  res.status(201).json({ token, user: sanitizeUser(createdUser) });

  // Welcome email to User
  sendTemplatedEmail("welcome_user", createdUser.email, {
    name: createdUser.name,
  }).catch(err => console.error("Welcome email failed", err));

  // Admin notification
  sendTemplatedEmail("admin_user_registration", process.env.SMTP_FROM_EMAIL || 'info@snippo.com', {
    name: createdUser.name,
    email: createdUser.email,
    date: new Date().toLocaleDateString()
  }).catch(err => console.error("Admin user registration email failed", err));
});

export const loginUser = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  const user = await getUserByEmail(email);
  if (!user || user.role !== "user") {
    throw httpError(401, "Invalid credentials");
  }

  const valid = await checkPassword(password, user.passwordHash);
  if (!valid) throw httpError(401, "Invalid credentials");

  res.json({ token: makeToken(user), user: sanitizeUser(user) });
});

export const loginAdmin = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  const user = await getUserByEmail(email);
  if (!user || user.role !== "admin") {
    throw httpError(401, "Invalid credentials");
  }

  const valid = await checkPassword(password, user.passwordHash);
  if (!valid) throw httpError(401, "Invalid credentials");

  res.json({ token: makeToken(user), user: sanitizeUser(user) });
});

export const registerStaff = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const designation = String(req.body?.designation || "").trim();
  const phone = String(req.body?.phone || "").trim();

  if (!name) throw httpError(400, "Name is required");
  if (!designation) throw httpError(400, "Designation is required");
  if (!email.includes("@")) throw httpError(400, "A valid email is required");
  if (password.length < 6) throw httpError(400, "Password must be at least 6 characters");

  let createdUser;
  let pendingEntry;
  let idDocBase64 = null;

  if (req.file) {
    try {
      const buffer = await fs.readFile(req.file.path);
      idDocBase64 = `data:${req.file.mimetype};base64,${buffer.toString("base64")}`;
      await fs.unlink(req.file.path); // Delete local temp file
    } catch (err) {
      console.error("[upload] Base64 conversion failed:", err);
    }
  }

  await updateData(async (data) => {
    if (await getUserByEmail(email)) {
      throw httpError(409, "An account with this email already exists");
    }

    const userId = `stf_${await nextCounter("user")}`;
    const pendingId = `ps_${await nextCounter("pending")}`;

    pendingEntry = {
      id: pendingId,
      userId,
      name,
      email,
      phone,
      role: designation,
      requestedServices: [],
      appliedAt: new Date().toLocaleString("en-US"),
      i: initials(name),
      c: pickColor(),
      status: "pending",
      idDocument: idDocBase64,
    };

    createdUser = {
      id: userId,
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "staff",
      status: "pending",
      roleTitle: designation,
      phone,
      pendingId,
      idDocument: idDocBase64,
    };

    data.pendingStaff.push(pendingEntry);
    data.users.push(createdUser);
    return createdUser;
  });

  res.status(201).json({
    token: makeToken(createdUser),
    user: sanitizeUser(createdUser),
    staffData: pendingEntry,
  });

  // To Staff candidate
  sendTemplatedEmail("staff_application_received", createdUser.email, {
    name: createdUser.name,
    role: createdUser.roleTitle
  }).catch(err => console.error("Staff application email failed", err));

  // To Admin
  sendTemplatedEmail("admin_staff_application_alert", process.env.SMTP_FROM_EMAIL, {
    name: createdUser.name,
    role: createdUser.roleTitle,
    email: createdUser.email,
    phone: createdUser.phone || 'N/A'
  }).catch(err => console.error("Admin staff application email failed", err));
});

export const loginStaff = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  const data = await readData();
  const user = await getUserByEmail(email);
  if (!user || user.role !== "staff") {
    throw httpError(401, "Invalid credentials");
  }

  if (user.status === "rejected" || user.status === "disabled") {
    throw httpError(403, "Your staff account is not active");
  }

  const valid = await checkPassword(password, user.passwordHash);
  if (!valid) throw httpError(401, "Invalid credentials");

  const response = {
    token: makeToken(user),
    user: sanitizeUser(user),
  };

  if (user.status === "pending") {
    response.staffData = resolvePendingForUser(data, user);
  } else {
    response.staffRef = resolveStaffForUser(data, user);
  }

  res.json(response);
});

export const getMe = asyncHandler(async (req, res) => {
  const data = await readData();
  const user = data.users.find((item) => item.id === req.authUser.id);
  if (!user) {
    throw httpError(401, "Session invalid");
  }

  if (user.role === "staff" && (user.status === "rejected" || user.status === "disabled")) {
    throw httpError(403, "Staff account inactive");
  }

  const payload = { user: sanitizeUser(user) };
  if (user.role === "staff") {
    if (user.status === "pending") {
      payload.staffData = resolvePendingForUser(data, user);
    } else {
      payload.staffRef = resolveStaffForUser(data, user);
    }
  }

  res.json(payload);
});
