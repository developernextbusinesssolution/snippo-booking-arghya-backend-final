import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";

dotenv.config();

async function checkUsers() {
  const uri = process.env.MONGODB_URI;
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
    const users = await User.find().lean();
    console.log("Users in DB:", JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
