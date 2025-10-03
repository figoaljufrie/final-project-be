// middlewares/rate-limit.ts
import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: "Too many login attempts, please try again later",
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: "Too many password reset requests, please try again later",
});

export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: "Too many verification requests, please try again later",
});

export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 30,
})
