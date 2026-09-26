"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, SignupFormData } from "@/lib/validations";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { Metadata } from "next";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(data: SignupFormData) {
    setServerError(null);
    try {
      await authApi.signup(data);
      toast.success("Account created! Please sign in.");
      router.push("/login");
    } catch (err: unknown) {
      const e = err as {
        error?: { message?: string; fields?: Record<string, string> };
        message?: string;
        fields?: Record<string, string>;
      };
      const fieldErrors = e?.fields || e?.error?.fields;
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        const firstField = Object.entries(fieldErrors)[0];
        setServerError(`${firstField[0]}: ${firstField[1]}`);
      } else {
        setServerError(e?.error?.message || e?.message || "An error occurred. Please try again.");
      }
    }
  }

  const inputStyle = (hasError: boolean) => ({
    background: "rgba(255,255,255,0.06)",
    border: hasError ? "1px solid rgba(220,38,38,0.6)" : "1px solid rgba(255,255,255,0.1)",
    width: "100%",
    padding: "10px 16px",
    borderRadius: "10px",
    color: "white",
    fontSize: "14px",
    outline: "none",
  });

  return (
    <div
      className="w-full rounded-2xl border p-8"
      style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(20px)",
      }}
    >
      <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
        Create Account
      </h1>
      <p className="text-white/50 text-sm mb-6">Sign up to start managing your inventory</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5" }}
          >
            {serverError}
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-white/70">Full Name</label>
          <input {...register("fullName")} placeholder="Your full name" style={inputStyle(!!errors.fullName)} />
          {errors.fullName && <p className="text-xs" style={{ color: "#fca5a5" }}>{errors.fullName.message}</p>}
        </div>

        {/* Login ID — per docs/02 §2.2: "Enter Login Id" */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-white/70">Login ID</label>
          <input {...register("loginId")} placeholder="Enter Login Id (6–12 chars)" style={inputStyle(!!errors.loginId)} />
          {errors.loginId && <p className="text-xs" style={{ color: "#fca5a5" }}>{errors.loginId.message}</p>}
          {!errors.loginId && <p className="text-xs text-white/30">6–12 alphanumeric characters</p>}
        </div>

        {/* Email — per docs/02 §2.2: "Enter Email Id" */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-white/70">Email ID</label>
          <input {...register("email")} type="email" placeholder="Enter Email Id" style={inputStyle(!!errors.email)} />
          {errors.email && <p className="text-xs" style={{ color: "#fca5a5" }}>{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-white/70">Password</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              style={{ ...inputStyle(!!errors.password), paddingRight: "40px" }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs" style={{ color: "#fca5a5" }}>{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-white/70">Confirm Password</label>
          <div className="relative">
            <input
              {...register("confirmPassword")}
              type={showConfirm ? "text" : "password"}
              placeholder="Re-Enter Password"
              style={{ ...inputStyle(!!errors.confirmPassword), paddingRight: "40px" }}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs" style={{ color: "#fca5a5" }}>{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-full font-bold text-sm bg-[#DDFF46] hover:bg-[#cbf033] text-black transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-[#DDFF46]/20 hover:scale-[1.01] active:scale-[0.99]"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin text-black" />
          ) : (
            <>
              <span>SIGN UP</span>
              <span>→</span>
            </>
          )}
        </button>

        <p className="text-center text-xs text-white/50 pt-2">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#DDFF46] hover:underline">
            Sign In →
          </Link>
        </p>
      </form>
    </div>
  );
}
