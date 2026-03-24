import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  bookingId: { type: String, required: true },
  userId: { type: String, required: true },
  staffId: { type: Number, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("Review", ReviewSchema);
