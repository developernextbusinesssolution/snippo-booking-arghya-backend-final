import rateLimit from "express-rate-limit";

const isProduction = process.env.NODE_ENV === "production";

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const globalRateLimitWindowMs = parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const globalRateLimitMax = parsePositiveInt(
  process.env.RATE_LIMIT_MAX,
  isProduction ? 300 : 2000
);
const authRateLimitMax = parsePositiveInt(
  process.env.AUTH_RATE_LIMIT_MAX,
  isProduction ? 20 : 500
);

export const globalLimiter = rateLimit({
  windowMs: globalRateLimitWindowMs,
  max: globalRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

export const authLimiter = rateLimit({
  windowMs: globalRateLimitWindowMs,
  max: authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please try again later." },
});
