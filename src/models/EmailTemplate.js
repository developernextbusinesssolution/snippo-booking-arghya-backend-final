import mongoose from "mongoose";

const EmailTemplateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("EmailTemplate", EmailTemplateSchema);
