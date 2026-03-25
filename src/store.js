import mongoose from "mongoose";
import { hashPassword } from "./auth.js";
import { INITIAL_SERVICES, INITIAL_STAFF } from "./constants.js";
import { normalizeEmail } from "./utils.js";

export function rowToUser(r) {
  if (!r) return null;
  return { id: r.id, name: r.name, email: r.email, passwordHash: r.password_hash || r.passwordHash, role: r.role, status: r.status, phone: r.phone || "", roleTitle: r.role_title || r.roleTitle || "", staffId: r.staff_id || r.staffId || null, pendingId: r.pending_id || r.pendingId || null, idDocument: r.id_document || r.idDocument || null };
}

export async function getStripeConfig() {
  return { 
    publishableKey: process.env.STRIPE_PUBLIC_KEY || "", 
    secretKey: process.env.STRIPE_SECRET_KEY || "" 
  };
}

export async function saveStripeConfig(config) {
  return true;
}

// Models
import User from "./models/User.js";
import Service from "./models/Service.js";
import Staff from "./models/Staff.js";
import Booking from "./models/Booking.js";
import PendingStaff from "./models/PendingStaff.js";
import EmailTemplate from "./models/EmailTemplate.js";
import Counter from "./models/Counter.js";

export const initStore = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  await mongoose.connect(uri);
  console.log("[db] Connected to MongoDB");

  // Initial Seeding logic
  await seedInitialData();
};

async function seedInitialData() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log("[db] DB is empty. Please run 'npm run create-admin' to set up your first admin.");

    // Seed Services
    if (INITIAL_SERVICES.length > 0) {
      await Service.insertMany(INITIAL_SERVICES);
    }

    // Seed Staff
    if (INITIAL_STAFF.length > 0) {
      await Staff.insertMany(INITIAL_STAFF);
    }

    // Initialize Counters
    const counters = [
      { key: "user", value: 1 },
      { key: "service", value: INITIAL_SERVICES.length + 1 },
      { key: "staff", value: INITIAL_STAFF.length + 1 },
      { key: "pending", value: 1 },
      { key: "booking", value: 1001 }
    ];
    await Counter.insertMany(counters);
    

    console.log("[db] Seeding complete.");
  }

  // Seed default email templates if missing
  const templateCount = await EmailTemplate.countDocuments();
  if (templateCount === 0) {
    const defaultTemplates = [
      { id: 'welcome_user', subject: 'Welcome to Snippo Booking!', body: '<p>Hello {{name}},</p><p>Your account has been successfully created.</p>' },
      { id: 'user_booking_confirmation', subject: 'Booking Confirmed - {{bookingId}}', body: '<p>Hello {{name}}, your booking for {{service}} is confirmed.</p>' },
      { id: 'staff_booking_notification', subject: 'New Booking - {{bookingId}}', body: '<p>Hello {{staff}}, you have a new appointment with {{name}}.</p>' }
      // ... more can be added/updated via UI
    ];
    await EmailTemplate.insertMany(defaultTemplates);
  }
}

export async function nextCounter(key) {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return counter.value - 1;
}

export async function readData() {
  const [users, services, staff, pendingStaff, bookings] = await Promise.all([
    User.find().lean(),
    Service.find().lean(),
    Staff.find().lean(),
    PendingStaff.find().lean(),
    Booking.find().sort({ createdAt: -1 }).limit(100).lean()
  ]);

  if (staff.length > 0) {
    const s = staff[0];
    console.log(`[DB_CHECK] Specialist ${s.name} | Availability: ${s.availability?.length || 0} slots.`);
  }

  return { users, services, staff, pendingStaff, bookings };
}

export async function updateData(mutator) {
  const data = await readData();
  const result = await mutator(data);

  // Save changes back to MongoDB
  // This is a simplified version of the previous diff-based saver.
  // In a real Mongo app, we'd use specific update calls in the controllers,
  // but to keep compatibility with the existing mutator pattern:
  
  const savePromises = [];

  // 1. Sync Users
  for (const u of data.users) {
    savePromises.push(User.findOneAndUpdate({ id: u.id }, { $set: u }, { upsert: true }));
  }

  // 2. Sync Services
  for (const s of data.services) {
    savePromises.push(Service.findOneAndUpdate({ id: s.id }, { $set: s }, { upsert: true }));
  }

  // 3. Sync Staff
  for (const s of data.staff) {
    savePromises.push(Staff.findOneAndUpdate({ id: s.id }, { $set: s }, { upsert: true }));
  }

  // 4. Sync PendingStaff
  for (const p of data.pendingStaff) {
    savePromises.push(PendingStaff.findOneAndUpdate({ id: p.id }, { $set: p }, { upsert: true }));
  }

  // 5. Sync Bookings (Only those in the array)
  for (const b of data.bookings) {
    savePromises.push(Booking.findOneAndUpdate({ id: b.id }, { $set: b }, { upsert: true }));
  }

  await Promise.all(savePromises);
  return result;
}

export async function queryPaged(collectionName, { page = 1, limit = 10, where = {}, sort = { createdAt: -1 } } = {}) {
  const Model = mongoose.models[collectionName] || mongoose.model(collectionName);
  const skip = (page - 1) * limit;
  
  const [total, data] = await Promise.all([
    Model.countDocuments(where),
    Model.find(where).sort(sort).skip(skip).limit(limit).lean()
  ]);

  return {
    data,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  };
}

export async function getPagedBookings({ userId, staffName, staffId, page = 1, limit = 10, status = "all", sortBy = "createdAt", sortOrder = -1 } = {}) {
  const where = {};
  if (userId) where.userId = userId;
  if (staffName) where.stf = staffName;
  if (staffId !== undefined && staffId !== null) where.staffId = Number(staffId);
  if (status && status !== "all") where.s = status;

  // Map user-friendly sort fields to DB fields if necessary
  const sortMap = {
    customer: "u",
    service: "svc",
    staff: "stf",
    date: "dt",
    amount: "p",
    status: "s"
  };
  const sortField = sortMap[sortBy] || sortBy;

  return queryPaged("Booking", { page, limit, where, sort: { [sortField]: sortOrder } });
}

export async function getBookingCounts() {
  const all = await Booking.countDocuments();
  const upcoming = await Booking.countDocuments({ s: "upcoming" });
  const active = await Booking.countDocuments({ s: "active" });
  const completed = await Booking.countDocuments({ s: "completed" });
  const cancelled = await Booking.countDocuments({ s: "cancelled" });
  return { all, upcoming, active, completed, cancelled };
}

export async function getPagedStaff({ page = 1, limit = 10 } = {}) {
  return queryPaged("Staff", { page, limit, sort: { id: 1 } });
}

export async function getPagedUsers({ page = 1, limit = 10, role = null } = {}) {
  const where = role ? { role } : {};
  return queryPaged("User", { page, limit, sort: { id: 1 }, where });
}

export async function getUserByEmail(email) {
  return User.findOne({ email }).lean();
}

export async function getEmailTemplates() {
  return EmailTemplate.find().sort({ id: 1 }).lean();
}

export async function getEmailTemplate(id) {
  return EmailTemplate.findOne({ id }).lean();
}

export async function updateEmailTemplate(id, { subject, body }) {
  await EmailTemplate.findOneAndUpdate({ id }, { subject, body }, { upsert: true });
  return true;
}

export function getDataFilePath() {
  return "MongoDB Atlas";
}
