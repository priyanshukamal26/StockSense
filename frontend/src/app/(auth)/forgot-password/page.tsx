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
    background: "#0C0D0E",
    border: "1px solid #2A2B33",
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
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
      className="w-full rounded-2xl border border-[#212228] p-8 shadow-2xl"
      style={{ background: "#121316" }}
    >
      <Link href="/login" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Sign In
      </Link>

      {error && (
        <div className="rounded-xl px-4 py-3 text-xs font-mono mb-5 border border-rose-500/30 bg-rose-950/30 text-rose-300">
          {error}
        </div>
      )}

      {step === "request" && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#18191D] border border-[#212228] text-[#DDFF46]">
              <Mail size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                <span className="text-[#DDFF46]">➔</span> Password Recovery
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Enter your Login ID or registered Email</p>
            </div>
          </div>
          <form onSubmit={step1Form.handleSubmit(onStep1)} className="space-y-4">
            <div>
              <input {...step1Form.register("loginIdOrEmail")} placeholder="Login ID or Email address" style={inputStyle} />
              {step1Form.formState.errors.loginIdOrEmail && (
                <p className="text-xs text-rose-400 mt-1 font-mono">{step1Form.formState.errors.loginIdOrEmail.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={step1Form.formState.isSubmitting}
              className="w-full py-3 font-bold text-xs uppercase tracking-wider text-black bg-[#DDFF46] hover:bg-[#C8F902] transition-colors rounded-full flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {step1Form.formState.isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Send Recovery OTP ➔
            </button>
          </form>
        </>
      )}

      {step === "otp" && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#18191D] border border-[#212228] text-[#DDFF46]">
              <Key size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                <span className="text-[#DDFF46]">➔</span> Enter Code
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">6-digit verification code · expires in 5 minutes</p>
            </div>
          </div>
          {devOtp && (
            <div className="mb-4 rounded-xl px-4 py-3 text-xs font-mono border border-[#DDFF46]/30 bg-[#1A2204] text-[#DDFF46]">
              <strong>Dev Mode OTP:</strong> {devOtp}
            </div>
          )}
          <form onSubmit={step2Form.handleSubmit(onStep2)} className="space-y-4">
            <div>
              <input
                {...step2Form.register("otp")}
                placeholder="000000"
                maxLength={6}
                style={{ ...inputStyle, textAlign: "center", letterSpacing: "10px", fontSize: "24px", fontWeight: "bold", fontFamily: "monospace" }}
              />
              {step2Form.formState.errors.otp && (
                <p className="text-xs text-rose-400 mt-1 font-mono">{step2Form.formState.errors.otp.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={step2Form.formState.isSubmitting}
              className="w-full py-3 font-bold text-xs uppercase tracking-wider text-black bg-[#DDFF46] hover:bg-[#C8F902] transition-colors rounded-full flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {step2Form.formState.isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Verify Code ➔
            </button>
          </form>
        </>
      )}

      {step === "reset" && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#18191D] border border-[#212228] text-[#DDFF46]">
              <Lock size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                <span className="text-[#DDFF46]">➔</span> New Password
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Configure your new secure password</p>
            </div>
          </div>
          <form onSubmit={step3Form.handleSubmit(onStep3)} className="space-y-4">
            <div>
              <input {...step3Form.register("newPassword")} type="password" placeholder="New Password" style={inputStyle} />
              {step3Form.formState.errors.newPassword && (
                <p className="text-xs text-rose-400 mt-1 font-mono">{step3Form.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <input {...step3Form.register("confirmPassword")} type="password" placeholder="Confirm New Password" style={inputStyle} />
              {step3Form.formState.errors.confirmPassword && (
                <p className="text-xs text-rose-400 mt-1 font-mono">{step3Form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={step3Form.formState.isSubmitting}
              className="w-full py-3 font-bold text-xs uppercase tracking-wider text-black bg-[#DDFF46] hover:bg-[#C8F902] transition-colors rounded-full flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {step3Form.formState.isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Update Password & Sign In ➔
            </button>
          </form>
        </>
      )}
    </div>
  );
}
