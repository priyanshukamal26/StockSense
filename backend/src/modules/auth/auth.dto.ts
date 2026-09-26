import { z } from "zod";

// Password complexity rule per docs/02 §2.2 and docs/09 §1
export const passwordSchema = z
  .string()
  .min(9, "Password must be over 8 characters.")
  .regex(/[a-z]/, "Password must contain a lowercase letter.")
  .regex(/[A-Z]/, "Password must contain an uppercase letter.")
  .regex(/[^a-zA-Z0-9]/, "Password must contain a special character.");

export const signupDto = z
  .object({
    loginId: z
      .string()
      .min(6, "Login ID must be 6–12 characters.")
      .max(12, "Login ID must be 6–12 characters.")
      .regex(/^[a-zA-Z0-9]+$/, "Login ID must be alphanumeric."),
    email: z.string().email("Enter a valid email address."),
    password: passwordSchema,
    confirmPassword: z.string(),
    fullName: z.string().min(1, "Full name is required.").max(100),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginDto = z.object({
  loginId: z.string().min(1, "Login ID is required."),
  password: z.string().min(1, "Password is required."),
});

export const refreshDto = z.object({
  refreshToken: z.string().min(1, "Refresh token is required."),
});

export const logoutDto = z.object({
  refreshToken: z.string().min(1, "Refresh token is required."),
});

export const forgotPasswordDto = z.object({
  loginIdOrEmail: z.string().min(1, "Login ID or email is required."),
});

export const verifyOtpDto = z.object({
  loginIdOrEmail: z.string().min(1),
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits.")
    .regex(/^\d{6}$/, "OTP must be 6 digits."),
});

export const resetPasswordDto = z
  .object({
    resetToken: z.string().min(1),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignupDto = z.infer<typeof signupDto>;
export type LoginDto = z.infer<typeof loginDto>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordDto>;
export type VerifyOtpDto = z.infer<typeof verifyOtpDto>;
export type ResetPasswordDto = z.infer<typeof resetPasswordDto>;
