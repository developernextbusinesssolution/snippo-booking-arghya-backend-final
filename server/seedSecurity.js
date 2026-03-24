import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./src/models/User.js";
import Booking from "./src/models/Booking.js";

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    // 1. Create a Security User
    const secEmail = "testsecurity@example.com";
    await User.deleteOne({ email: secEmail });
    
    const hashedPassword = await bcrypt.hash("password123", 10);
    const secUser = new User({
      id: "sec-" + Math.floor(Math.random() * 1000000),
      name: "Test Security",
      email: secEmail,
      passwordHash: hashedPassword,
      role: "security"
    });
    await secUser.save();
    console.log("Created security user:", secEmail);

    // 2. Create a booking for today
    const dt = new Date();
    const dtStr = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = "10:00 AM";

    const testBookingId = "BKG-" + Math.floor(Math.random() * 100000);
    const newBooking = new Booking({
      id: testBookingId,
      u: "Test Customer",
      uId: "user-id",
      svc: "Nightclub Bouncer",
      stf: "Test Staff",
      dt: dtStr,
      t: timeStr,
      p: 150,
      paid: true,
      originalDuration: 120,
      notes: "Test booking for security flow",
      s: "upcoming", // initial status
      address: {
        line1: "123 Test St",
        city: "Test City",
        state: "TS",
        postalCode: "12345",
        country: "US"
      }
    });

    await newBooking.save();
    console.log("Created booking:", testBookingId);

    process.exit(0);
  } catch (err) {
    console.error("Seed error", err);
    process.exit(1);
  }
}

seed();
