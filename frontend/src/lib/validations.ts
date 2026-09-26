import { z } from "zod";

// Mirrored from backend/src/modules/auth/auth.dto.ts
// Keep in sync with backend — these are the same rules

export const passwordSchema = z
  .string()
  .min(9, "Password must be over 8 characters.")
  .regex(/[a-z]/, "Password must contain a lowercase letter.")
  .regex(/[A-Z]/, "Password must contain an uppercase letter.")
  .regex(/[^a-zA-Z0-9]/, "Password must contain a special character.");

export const loginSchema = z.object({
  loginId: z.string().min(1, "Login ID is required."),
  password: z.string().min(1, "Password is required."),
});

export const signupSchema = z
  .object({
    loginId: z
      .string()
      .min(6, "Login ID must be 6–12 characters.")
      .max(12, "Login ID must be 6–12 characters.")
      .regex(/^[a-zA-Z0-9]+$/, "Login ID must be alphanumeric."),
    email: z.string().email("Enter a valid email address."),
    password: passwordSchema,
    confirmPassword: z.string(),
    fullName: z.string().min(1, "Full name is required."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  loginIdOrEmail: z.string().min(1, "Login ID or email is required."),
});

export const verifyOtpSchema = z.object({
  loginIdOrEmail: z.string().min(1),
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits.")
    .regex(/^\d{6}$/, "OTP must be numeric."),
});

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
