"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, verifyOtpSchema, resetPasswordSchema } from "@/lib/validations";
import { authApi } from "@/lib/api";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail, Key, Lock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";

type Step = "request" | "otp" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [loginIdOrEmail, setLoginIdOrEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    width: "100%",
    padding: "10px 16px",
    borderRadius: "10px",
    color: "white",
    fontSize: "14px",
    outline: "none",
  };

  // Step 1: Request OTP
  const step1Form = useForm<{ loginIdOrEmail: string }>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onStep1(data: { loginIdOrEmail: string }) {
    setError(null);
    try {
      const res = await authApi.forgotPassword(data.loginIdOrEmail);
      setLoginIdOrEmail(data.loginIdOrEmail);
      if (res._devOtp) setDevOtp(res._devOtp);
      toast.success("If an account exists, an OTP has been sent.");
      setStep("otp");
    } catch {
      setError("Failed to send OTP. Please try again.");
    }
  }

  // Step 2: Verify OTP
  const step2Form = useForm<{ otp: string }>({
    resolver: zodResolver(z.object({ otp: z.string().length(6, "OTP must be 6 digits.").regex(/^\d{6}$/) })),
  });

  async function onStep2(data: { otp: string }) {
    setError(null);
    try {
      const res = await authApi.verifyOtp(loginIdOrEmail, data.otp);
      setResetToken(res.resetToken);
      setStep("reset");
    } catch {
      setError("This code is invalid or has expired.");
    }
  }

  // Step 3: Reset password
  const step3Form = useForm<{ newPassword: string; confirmPassword: string }>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onStep3(data: { newPassword: string; confirmPassword: string }) {
    setError(null);
    try {
      await authApi.resetPassword(resetToken, data.newPassword, data.confirmPassword);
      toast.success("Password reset successfully! Please sign in.");
      router.push("/login");
    } catch {
      setError("Failed to reset password. Please start again.");
    }
  }

  return (
    <div
      className="w-full rounded-2xl border p-8"
      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}
    >
      <Link href="/login" className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 transition-colors w-fit">
        <ArrowLeft size={14} /> Back to Sign In
      </Link>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm mb-4" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {step === "request" && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(64,91,255,0.15)" }}>
              <Mail size={18} style={{ color: "#405BFF" }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Forgot Password</h2>
              <p className="text-white/50 text-sm">Enter your Login ID or Email</p>
            </div>
          </div>
          <form onSubmit={step1Form.handleSubmit(onStep1)} className="space-y-4">
            <input {...step1Form.register("loginIdOrEmail")} placeholder="Login ID or Email address" style={inputStyle} />
            {step1Form.formState.errors.loginIdOrEmail && (
              <p className="text-xs" style={{ color: "#fca5a5" }}>{step1Form.formState.errors.loginIdOrEmail.message}</p>
            )}
            <button type="submit" disabled={step1Form.formState.isSubmitting}
              className="w-full py-3 font-semibold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: "var(--brand-primary)", borderRadius: "var(--radius-pill)" }}>
              {step1Form.formState.isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Send OTP
            </button>
          </form>
        </>
      )}

      {step === "otp" && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(64,91,255,0.15)" }}>
              <Key size={18} style={{ color: "#405BFF" }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Enter OTP</h2>
              <p className="text-white/50 text-sm">6-digit code · expires in 5 minutes</p>
            </div>
          </div>
          {devOtp && (
            <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(64,91,255,0.1)", border: "1px solid rgba(64,91,255,0.3)", color: "#a5b4fc" }}>
              <strong>Dev mode OTP:</strong> {devOtp}
            </div>
          )}
          <form onSubmit={step2Form.handleSubmit(onStep2)} className="space-y-4">
            <input {...step2Form.register("otp")} placeholder="Enter 6-digit OTP" maxLength={6} style={{ ...inputStyle, textAlign: "center", letterSpacing: "8px", fontSize: "24px", fontWeight: "bold" }} />
            {step2Form.formState.errors.otp && <p className="text-xs" style={{ color: "#fca5a5" }}>{step2Form.formState.errors.otp.message}</p>}
            <button type="submit" disabled={step2Form.formState.isSubmitting}
              className="w-full py-3 font-semibold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: "var(--brand-primary)", borderRadius: "var(--radius-pill)" }}>
              {step2Form.formState.isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Verify OTP
            </button>
          </form>
        </>
      )}

      {step === "reset" && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(64,91,255,0.15)" }}>
              <Lock size={18} style={{ color: "#405BFF" }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">New Password</h2>
              <p className="text-white/50 text-sm">Choose a strong password</p>
            </div>
          </div>
          <form onSubmit={step3Form.handleSubmit(onStep3)} className="space-y-4">
            <input {...step3Form.register("newPassword")} type="password" placeholder="New Password" style={inputStyle} />
            {step3Form.formState.errors.newPassword && <p className="text-xs" style={{ color: "#fca5a5" }}>{step3Form.formState.errors.newPassword.message}</p>}
            <input {...step3Form.register("confirmPassword")} type="password" placeholder="Confirm New Password" style={inputStyle} />
            {step3Form.formState.errors.confirmPassword && <p className="text-xs" style={{ color: "#fca5a5" }}>{step3Form.formState.errors.confirmPassword.message}</p>}
            <button type="submit" disabled={step3Form.formState.isSubmitting}
              className="w-full py-3 font-semibold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: "var(--brand-primary)", borderRadius: "var(--radius-pill)" }}>
              {step3Form.formState.isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Reset Password
            </button>
          </form>
        </>
      )}
    </div>
  );
}
