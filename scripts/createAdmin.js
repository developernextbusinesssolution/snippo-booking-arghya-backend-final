import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import { hashPassword } from "../src/auth.js";

dotenv.config();

async function createAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Error: MONGODB_URI not found in .env");
    process.exit(1);
  }

  const email = "admin@gmail.com";
  const password = "admin123";

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    // Clear existing admin with same ID or Email to prevent duplicates
    await User.deleteOne({ id: "adm" });
    await User.deleteOne({ email });

    console.log(`Creating admin ${email}...`);
    await User.create({
      id: "adm",
      name: "Admin",
      email,
      passwordHash: await hashPassword(password),
      role: "admin",
      status: "active"
    });

    console.log("Admin account successfully prepared!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to create admin:", err);
    process.exit(1);
  }
}

createAdmin();
