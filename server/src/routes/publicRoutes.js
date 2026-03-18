import express from "express";
import { getHealth, getBootstrap } from "../controllers/publicController.js";
import { optionalAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/health", getHealth);
router.get("/bootstrap", optionalAuth, getBootstrap);

export default router;
