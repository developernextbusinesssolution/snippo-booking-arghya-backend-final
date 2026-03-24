import mongoose from "mongoose";

const PendingStaffSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: "" },
  role: { type: String, default: "" },
  requestedServices: [{ type: Number }],
  appliedAt: { type: String, default: "" },
  i: { type: String, default: "" },
  c: { type: String, default: "#E63946" },
  status: { type: String, default: "pending" },
  idDocument: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model("PendingStaff", PendingStaffSchema);
