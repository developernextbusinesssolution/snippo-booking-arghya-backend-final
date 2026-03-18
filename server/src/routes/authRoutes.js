import express from "express";
import { 
  registerUser, 
  loginUser, 
  loginAdmin, 
  registerStaff, 
  loginStaff,
  getMe
} from "../controllers/authController.js";
import { authLimiter } from "../middlewares/rateLimiters.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import upload from "../utils/upload.js";

const router = express.Router();

router.get("/me", requireAuth(), getMe);

router.use(authLimiter);

router.post("/register-user", upload.single("idDocument"), registerUser);
router.post("/login-user", loginUser);
router.post("/login-admin", loginAdmin);
router.post("/register-staff", upload.single("idDocument"), registerStaff);
router.post("/login-staff", loginStaff);

export default router;
