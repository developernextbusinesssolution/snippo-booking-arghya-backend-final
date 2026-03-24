import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import { checkPassword } from "../src/auth.js";
import { normalizeEmail } from "../src/utils.js";

dotenv.config();

async function testLogin() {
  const uri = process.env.MONGODB_URI;
  const email = normalizeEmail("admin@gmail.com");
  const password = "admin123";

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const user = await User.findOne({ email }).lean();
    if (!user) {
      console.log("User not found");
      process.exit(1);
    }

    console.log("User found:", user.email, "Role:", user.role);
    
    const isValid = await checkPassword(password, user.passwordHash || user.password_hash);
    console.log("Password valid:", isValid);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testLogin();
