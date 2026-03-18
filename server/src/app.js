import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import helmet from "helmet";
import morgan from "morgan";

import { globalLimiter } from "./middlewares/rateLimiters.js";
import publicRoutes from "./routes/publicRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

// ── Trust proxy (Render, Vercel, Nginx etc.) ──────────────────────────────────
const trustProxy = String(process.env.TRUST_PROXY || (isProduction ? "true" : "false")).trim().toLowerCase();
if (trustProxy === "true" || trustProxy === "1") {
  app.set("trust proxy", 1);
}

// ── Security middleware ────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false, // Disabled so self-hosted React JS/CSS bundles load
    frameguard: false, // Allow embedding in iframes on other websites (widget embed)
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Origin not allowed"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(globalLimiter);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ── Serve Vite-built frontend (production only) ───────────────────────────────
// Resolves to: <repo-root>/client/dist
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
const distPath = path.resolve(__dirname2, "..", "..", "client", "dist");
const indexHtml = path.join(distPath, "index.html");

console.log("[Static] distPath:", distPath, "| exists:", fs.existsSync(distPath));

if (fs.existsSync(distPath)) {
  // Serve static assets (JS, CSS, images, etc.) — express.static handles MIME types
  app.use(express.static(distPath, { index: false }));

  // SPA fallback — serve index.html for all non-API, non-asset GET requests
  // index: false above prevents express.static from auto-serving index.html,
  // so we can handle the fallback ourselves here with the correct exclusions.
  app.get(/(.*)/, (req, res, next) => {
    // Let API requests fall through to the 404 handler
    if (req.path.startsWith("/api")) return next();
    // Let any unmatched asset requests fall through (returns 404, not index.html)
    if (/\.\w+$/.test(req.path)) return next();
    // All other paths (/, /admin, /staff, /user/*, etc.) → serve the React app
    if (fs.existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      next();
    }
  });
} else {
  console.warn("[Static] client/dist not found — frontend will not be served.");
}

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  console.error("[Error]", status, err.message);
  res.status(status).json({ error: status >= 500 ? "Internal server error" : err.message });
});

export default app;
