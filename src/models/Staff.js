import mongoose from "mongoose";

const StaffSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String, required: true },
  i: { type: String, default: "" },
  c: { type: String, default: "#E63946" },
  services: [{ type: Number }],
  avail: [{ type: Boolean }],
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
