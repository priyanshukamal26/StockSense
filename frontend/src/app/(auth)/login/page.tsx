"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "@/lib/validations";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginFormData) {
    setServerError(null);
    try {
      const res = await authApi.login(data.loginId, data.password);
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      localStorage.setItem("user", JSON.stringify(res.user));
      toast.success(`Welcome back, ${res.user.fullName}!`);
      router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as { error?: { message?: string }; message?: string };
      setServerError(e?.error?.message || e?.message || "An error occurred. Please try again.");
    }
  }

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
        Sign In
      </h1>
      <p className="text-white/50 text-sm mb-8">Enter your credentials to access your inventory</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Server error */}
        {serverError && (
          <div
            className="rounded-lg px-4 py-3 text-sm font-medium"
            style={{
              background: "rgba(220,38,38,0.1)",
              border: "1px solid rgba(220,38,38,0.3)",
              color: "#fca5a5",
            }}
          >
            {serverError}
          </div>
        )}

        {/* Login ID */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/70">Login ID</label>
          <input
            {...register("loginId")}
            type="text"
            placeholder="Enter your Login ID"
            autoComplete="username"
            className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-white/30 outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: errors.loginId ? "1px solid rgba(220,38,38,0.6)" : "1px solid rgba(255,255,255,0.1)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#405BFF")}
            onBlur={(e) =>
              (e.target.style.borderColor = errors.loginId
                ? "rgba(220,38,38,0.6)"
                : "rgba(255,255,255,0.1)")
            }
          />
          {errors.loginId && (
            <p className="text-xs" style={{ color: "#fca5a5" }}>
              {errors.loginId.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/70">Password</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm text-white placeholder-white/30 outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: errors.password ? "1px solid rgba(220,38,38,0.6)" : "1px solid rgba(255,255,255,0.1)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#405BFF")}
              onBlur={(e) =>
                (e.target.style.borderColor = errors.password
                  ? "rgba(220,38,38,0.6)"
                  : "rgba(255,255,255,0.1)")
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs" style={{ color: "#fca5a5" }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-full font-bold text-sm bg-[#DDFF46] hover:bg-[#cbf033] text-black transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#DDFF46]/20 hover:scale-[1.01] active:scale-[0.99]"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin text-black" />
          ) : (
            <>
              <span>SIGN IN</span>
              <span>→</span>
            </>
          )}
        </button>

        {/* Links — exact per wireframe docs/02 §2.1 */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/forgot-password"
            className="text-xs text-white/50 hover:text-white transition-colors"
          >
            Forget Password ?
          </Link>
          <Link
            href="/signup"
            className="text-xs font-bold text-[#DDFF46] hover:underline transition-colors flex items-center gap-1"
          >
            <span>Create Account</span>
            <span>→</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
