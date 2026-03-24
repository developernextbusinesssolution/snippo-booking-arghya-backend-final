import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  desc: { type: String, default: "" },
  price: { type: Number, required: true },
  dur: { type: String, default: "60" },
  img: { type: String, default: "" },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Service", ServiceSchema);
