import express from "express";
import { updateUserProfile } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.put("/me", requireAuth(["user"]), updateUserProfile);

export default router;
