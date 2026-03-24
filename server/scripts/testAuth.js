import { hashPassword, checkPassword } from "../src/auth.js";
import bcrypt from "bcryptjs";

async function test() {
  const pass = "admin123";
  const hash = await hashPassword(pass);
  console.log("Hash created:", hash);
  
  const isValid = await checkPassword(pass, hash);
  console.log("Is valid (via checkPassword):", isValid);
  
  const isValidDirect = await bcrypt.compare(pass, hash);
  console.log("Is valid (direct bcrypt.compare):", isValidDirect);
}

test();
