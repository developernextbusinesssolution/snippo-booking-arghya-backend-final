import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["admin", "staff", "user", "security"], default: "user" },
  status: { type: String, default: "active" },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  zip: { type: String, default: "" },
  country: { type: String, default: "" },
  roleTitle: { type: String, default: "" },
  staffId: { type: Number, default: null },
  pendingId: { type: String, default: null },
  idDocument: { type: String, default: null },
  availability: [
    {
      day: { type: String }, // e.g. "Monday"
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: "09:00" },
      endTime: { type: String, default: "18:00" }
    }
  ]
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
