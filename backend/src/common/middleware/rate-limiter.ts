import rateLimit from "express-rate-limit";

/**
 * Rate limiter for auth endpoints — 5 attempts per 15 minutes per IP
 * Per docs/09 §3
 */
export const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS ?? "900000", 10),
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX ?? "5", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many attempts. Please try again in 15 minutes.",
    },
  },
  skip: () => process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development",
});

/**
 * Rate limiter for OTP — 1 request per 60 seconds per IP
 * Per docs/09 §3
 */
export const otpLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_OTP_WINDOW_MS ?? "60000", 10),
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Please wait 60 seconds before requesting another OTP.",
    },
  },
  skip: () => process.env.NODE_ENV === "test",
});

/**
 * General API rate limiter — 200 req/min per IP (prevents scraping)
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
});
