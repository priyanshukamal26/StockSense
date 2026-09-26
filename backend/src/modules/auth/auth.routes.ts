import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validate } from "../../common/middleware/validate";
import { requireAuth } from "../../common/middleware/auth-guard";
import { authLimiter, otpLimiter } from "../../common/middleware/rate-limiter";
import {
  signupDto,
  loginDto,
  refreshDto,
  logoutDto,
  forgotPasswordDto,
  verifyOtpDto,
  resetPasswordDto,
} from "./auth.dto";

export const authRouter = Router();

authRouter.post(
  "/signup",
  authLimiter,
  validate(signupDto),
  AuthController.signup
);

authRouter.post(
  "/login",
  authLimiter,
  validate(loginDto),
  AuthController.login
);

authRouter.post(
  "/refresh",
  validate(refreshDto),
  AuthController.refresh
);

authRouter.post(
  "/logout",
  validate(logoutDto),
  AuthController.logout
);

authRouter.post(
  "/forgot-password",
  otpLimiter,
  validate(forgotPasswordDto),
  AuthController.forgotPassword
);

authRouter.post(
  "/verify-otp",
  validate(verifyOtpDto),
  AuthController.verifyOtp
);

authRouter.post(
  "/reset-password",
  validate(resetPasswordDto),
  AuthController.resetPassword
);

authRouter.get(
  "/me",
  requireAuth,
  AuthController.me
);
