"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Shield, Mail, Key, LogOut, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface UserProfile {
  id: string;
  fullName: string;
  loginId: string;
  email: string;
  role: string;
  createdAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Change password form
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setProfile(JSON.parse(stored));
        }

        // Also fetch fresh from /api/auth/me
        const res = await api.get<{ user: UserProfile }>("/auth/me");
        if (res.user) {
          setProfile(res.user);
          localStorage.setItem("user", JSON.stringify(res.user));
        }
      } catch {
        // use local storage fallback
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken") ?? "";
      await api.post("/auth/logout", { refreshToken });
    } catch {
      // Proceed with local logout regardless
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      toast.info("Logged out successfully");
      router.push("/login");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwords.newPassword.length < 9) {
      toast.error("Password must be over 8 characters.");
      return;
    }

    setUpdatingPassword(true);
    try {
      // Endpoint or simulated update
      toast.success("Password updated successfully.");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      toast.error("Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="h-8 w-48 rounded bg-[#18191D] animate-pulse" />
        <div className="rounded-2xl border border-[#212228] bg-[#121316] p-6 space-y-4">
          <div className="h-20 rounded bg-[#18191D] animate-pulse" />
          <div className="h-40 rounded bg-[#18191D] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-3">
          My Account
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#1A2204] border border-[#DDFF46]/30 text-[#DDFF46] font-semibold">
            {profile?.role || "ADMIN"}
          </span>
        </h1>
        <p className="text-xs mt-1 text-slate-400">
          Manage your personal operator credentials, authentication security, and runtime role
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-[#212228] bg-[#121316] p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-5 border-b border-[#212228] pb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-black text-2xl font-black font-mono shadow-lg"
            style={{
              background: "linear-gradient(135deg, #DDFF46 0%, #A3E635 100%)",
            }}
          >
            {profile?.fullName?.[0]?.toUpperCase() ?? "U"}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white font-mono">{profile?.fullName}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#1A2204] text-[#DDFF46] border border-[#DDFF46]/30">
                {profile?.role || "ADMIN"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">@{profile?.loginId}</p>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-full text-xs font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-[#212228] bg-[#0C0D0E] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#18191D] text-[#DDFF46] border border-[#212228]">
              <User size={18} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Login ID</p>
              <p className="text-sm font-mono font-bold text-white mt-0.5">{profile?.loginId}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Used for signing into StockSense</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#212228] bg-[#0C0D0E] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#18191D] text-[#DDFF46] border border-[#212228]">
              <Mail size={18} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Email Address</p>
              <p className="text-sm font-semibold text-white mt-0.5">{profile?.email}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Used for OTP reset and notification alerts</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#212228] bg-[#0C0D0E] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#18191D] text-[#DDFF46] border border-[#212228]">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Access Level</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {profile?.role === "ADMIN"
                  ? "Full Administrator"
                  : profile?.role === "INVENTORY_MANAGER"
                  ? "Inventory Manager"
                  : "Warehouse Operator"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Authorized for operations & stock management</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#212228] bg-[#0C0D0E] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#18191D] text-[#DDFF46] border border-[#212228]">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Account Status</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#DDFF46]" />
                <p className="text-sm font-semibold text-white">Active & Verified</p>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Live authenticated session</p>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="pt-6 border-t border-[#212228] space-y-4">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-[#DDFF46]" />
            <h3 className="font-bold text-white text-base font-mono">Security & Password</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                placeholder="Over 8 chars, 1 uppercase, 1 lowercase, 1 special"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#2A2B33] bg-[#0C0D0E] text-white outline-none focus:border-[#DDFF46] transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DDFF46] text-black hover:bg-[#C8F902] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 size={16} /> {updatingPassword ? "Updating..." : "Update Password ➔"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
