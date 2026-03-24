import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

async function checkDates() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Booking = mongoose.model("Booking", new mongoose.Schema({ dt: String, s: String }));
  
  const today = new Date();
  const todayKey = today.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
  
  console.log("Server Time:", today.toISOString());
  console.log("Today Key (NY):", todayKey);
  
  const all = await Booking.find();
  console.log("Total Bookings:", all.length);
  
  const sample = all.slice(0, 10).map(b => ({ dt: b.dt, s: b.s }));
  console.log("Sample Data:", sample);
  
  const matched = all.filter(b => b.dt.includes(todayKey));
  console.log("Matched for Today:", matched.length);

  await mongoose.disconnect();
}

checkDates();
