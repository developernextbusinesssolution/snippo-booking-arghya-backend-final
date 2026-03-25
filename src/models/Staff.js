import mongoose from "mongoose";

const StaffSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String, required: true },
  i: { type: String, default: "" },
  c: { type: String, default: "#E63946" },
  services: [{ type: Number }],
  avail: [{ type: Boolean }], // Legacy: keeps compatibility with existing boolean-only logic if any
  availability: [
    {
      day: { type: String }, // e.g. "Monday"
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: "09:00" },
      endTime: { type: String, default: "18:00" }
    }
  ],
  active: { type: Boolean, default: true },
  profileImage: { type: String, default: "" },
  experience: { type: String, default: "" },
  totalWorkDone: { type: Number, default: 0 },
  bio: { type: String, default: "" },
  hourlyRate: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Staff", StaffSchema);
