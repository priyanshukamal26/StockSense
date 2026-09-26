import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0C0D0E]"
    >
      {/* LaunchDarkly Background grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
        }}
      />
      {/* Subtle radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #DDFF46 0%, transparent 70%)" }}
      />
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-3 hover:opacity-90 transition-opacity group"
            title="Go to StockSense Landing Page"
          >
            <span className="text-white font-display font-extrabold text-2xl sm:text-3xl tracking-tight">
              StockSense
            </span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#DDFF46] transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            >
              <path
                d="M5 19L19 5M19 5H9M19 5V15"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <p className="text-white/40 text-xs font-mono tracking-wider uppercase">Runtime Inventory Control</p>
        </div>
        {children}
      </div>
    </div>
  );
}
