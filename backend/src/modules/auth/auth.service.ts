import prisma from "../../common/lib/prisma";
import { hashPassword, comparePassword } from "../../common/lib/bcrypt";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../common/lib/jwt";
import { sendOtpEmail } from "../../common/lib/mailer";
import { AppError } from "../../common/middleware/error-handler";
import { UserRole } from "@prisma/client";
import {
  SignupDto,
  LoginDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
} from "./auth.dto";
import bcrypt from "bcrypt";
import crypto from "crypto";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateOtp(): string {
  // 6-digit numeric OTP
  return String(Math.floor(100000 + Math.random() * 900000));
}

function sanitizeUser(user: {
  id: string;
  loginId: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    loginId: user.loginId,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const AuthService = {
  async signup(dto: SignupDto) {
    // Check uniqueness (clean 409 before hitting DB constraint)
    const [existingLogin, existingEmail] = await Promise.all([
      prisma.user.findUnique({ where: { loginId: dto.loginId } }),
      prisma.user.findUnique({ where: { email: dto.email } }),
    ]);

    if (existingLogin) {
      throw new AppError(
        "VALIDATION_ERROR",
        "This Login ID is already taken.",
        400
      );
    }
    if (existingEmail) {
      throw new AppError(
        "VALIDATION_ERROR",
        "This email is already registered.",
        400
      );
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await prisma.user.create({
      data: {
        loginId: dto.loginId,
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: UserRole.ADMIN,
      },
    });

    return { user: sanitizeUser(user) };
  },

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { loginId: dto.loginId },
    });

    // Use constant-time comparison even if user doesn't exist to prevent timing attacks
    const dummyHash =
      "$2b$12$invalidhashfortimingnonsense.thatpreventsuserdiscovery";
    const passwordMatch = await comparePassword(
      dto.password,
      user?.passwordHash ?? dummyHash
    );

    if (!user || !passwordMatch || !user.isActive) {
      // Exact error message per docs/02 §2.1 and docs/09 §1
      throw new AppError(
        "UNAUTHENTICATED",
        "Invalid Login Id or Password",
        401
      );
    }

    const payload = { sub: user.id, role: user.role, loginId: user.loginId };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store hashed refresh token
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d
    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken, user: sanitizeUser(user) };
  },

  async refresh(refreshToken: string) {
    let payload: ReturnType<typeof verifyRefreshToken>;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("UNAUTHENTICATED", "Invalid or expired token.", 401);
    }

    // Find and validate stored token
    const stored = await prisma.refreshToken.findMany({
      where: { userId: payload.sub, expiresAt: { gt: new Date() } },
    });

    let matchedToken: (typeof stored)[0] | null = null;
    for (const t of stored) {
      if (await bcrypt.compare(refreshToken, t.tokenHash)) {
        matchedToken = t;
        break;
      }
    }

    if (!matchedToken) {
      throw new AppError("UNAUTHENTICATED", "Refresh token is invalid.", 401);
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
    });

    // Rotate: delete old, issue new
    await prisma.refreshToken.delete({ where: { id: matchedToken.id } });

    const newPayload = {
      sub: user.id,
      role: user.role,
      loginId: user.loginId,
    };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);
    const tokenHash = await bcrypt.hash(newRefreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    // Find and revoke the stored refresh token
    const stored = await prisma.refreshToken.findMany({
      where: { expiresAt: { gt: new Date() } },
    });

    for (const t of stored) {
      if (await bcrypt.compare(refreshToken, t.tokenHash)) {
        await prisma.refreshToken.delete({ where: { id: t.id } });
        break;
      }
    }
    // Always return 200 — don't leak whether the token existed
  },

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ devOtp?: string }> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { loginId: dto.loginIdOrEmail },
          { email: dto.loginIdOrEmail },
        ],
      },
    });

    // Always return 200 — never reveal whether the account exists
    if (!user) return {};

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.passwordResetOtp.create({
      data: { userId: user.id, otpCode: otp, expiresAt },
    });

    const result = await sendOtpEmail(user.email, otp);
    return result;
  },

  async verifyOtp(
    dto: VerifyOtpDto
  ): Promise<{ resetToken: string; devOtp?: string }> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { loginId: dto.loginIdOrEmail },
          { email: dto.loginIdOrEmail },
        ],
      },
    });

    const otpRecord = user
      ? await prisma.passwordResetOtp.findFirst({
          where: {
            userId: user.id,
            otpCode: dto.otp,
            expiresAt: { gt: new Date() },
            consumedAt: null,
          },
          orderBy: { createdAt: "desc" },
        })
      : null;

    if (!otpRecord) {
      throw new AppError(
        "VALIDATION_ERROR",
        "This code is invalid or has expired.",
        400
      );
    }

    // Mark consumed
    await prisma.passwordResetOtp.update({
      where: { id: otpRecord.id },
      data: { consumedAt: new Date() },
    });

    // Issue a short-lived reset token (JWT-signed, 10 min)
    const resetToken = signAccessToken({
      sub: user!.id,
      role: "PASSWORD_RESET",
      loginId: user!.loginId,
    });

    return { resetToken };
  },

  async resetPassword(dto: ResetPasswordDto) {
    // Verify the reset token (it's a short-lived access token with role PASSWORD_RESET)
    let payload: ReturnType<typeof verifyRefreshToken>;
    try {
      payload = verifyRefreshToken(dto.resetToken);
      // Try access token verification too (reset tokens are access tokens)
    } catch {
      // Try access token
      try {
        const { verifyAccessToken } = await import("../../common/lib/jwt");
        payload = verifyAccessToken(dto.resetToken) as typeof payload;
      } catch {
        throw new AppError("VALIDATION_ERROR", "Reset token is invalid or expired.", 400);
      }
    }

    if (payload.role !== "PASSWORD_RESET") {
      throw new AppError("VALIDATION_ERROR", "Invalid reset token.", 400);
    }

    const passwordHash = await hashPassword(dto.newPassword);
    await prisma.user.update({
      where: { id: payload.sub },
      data: { passwordHash },
    });

    // Revoke all refresh tokens for this user (force re-login)
    await prisma.refreshToken.deleteMany({ where: { userId: payload.sub } });
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("User not found.");
    return sanitizeUser(user);
  },
};
