import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, default: null }, // Optional for guest bookings
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: "" },
  peopleCount: { type: Number, default: 1 },
  svc: { type: String, required: true },
  stf: { type: String, required: true },
  dt: { type: String, required: true },
  t: { type: String, required: true },
  p: { type: String, required: true },
  s: { type: String, required: true, default: "upcoming" },
  paid: { type: Boolean, default: false },
  u: { type: String, required: true }, // Duplicate of name for legacy support
  serviceId: { type: Number, default: null },
  staffId: { type: Number, default: null },
  notes: { type: String, default: "" },
  additionalHours: { type: Number, default: 0 },
  additionalCost: { type: Number, default: 0 },
  originalDuration: { type: String, default: "" },
  verifiedBySecurity: { type: Boolean, default: false },
  securityVerifiedAt: { type: Date, default: null },
  securityId: { type: String, default: null },
  verifiedByName: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("Booking", BookingSchema);
