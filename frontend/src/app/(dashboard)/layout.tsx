"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Package, History, Settings, ChevronDown,
  ChevronRight, Receipt, Truck, ArrowLeftRight, SlidersHorizontal,
  Warehouse, MapPin, Bell, LogOut, User, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/stocksense/NotificationBell";
import { toast } from "sonner";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string; icon: React.ReactNode }[];
}

const navigation: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Operations",
    icon: <SlidersHorizontal size={18} />,
    children: [
      { label: "Receipts", href: "/operations/receipts", icon: <Receipt size={16} /> },
      { label: "Delivery", href: "/operations/deliveries", icon: <Truck size={16} /> },
      { label: "Internal Transfer", href: "/operations/transfers", icon: <ArrowLeftRight size={16} /> },
      { label: "Adjustment", href: "/operations/adjustments", icon: <SlidersHorizontal size={16} /> },
    ],
  },
  {
    label: "Products",
    icon: <Package size={18} />,
    children: [
      { label: "Products List", href: "/products", icon: <Package size={16} /> },
      { label: "Stock Availability", href: "/products/stock", icon: <LayoutDashboard size={16} /> },
    ],
  },
  {
    label: "Move History",
    href: "/move-history",
    icon: <History size={18} />,
  },
  {
    label: "Settings",
    icon: <Settings size={18} />,
    children: [
      { label: "Warehouse", href: "/settings/warehouses", icon: <Warehouse size={16} /> },
      { label: "Locations", href: "/settings/locations", icon: <MapPin size={16} /> },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ fullName: string; loginId: string; role: string } | null>(null);
  const [openMenus, setOpenMenus] = useState<string[]>(["Operations"]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, [router]);

  // Auto-open parent menu based on current path
  useEffect(() => {
    for (const item of navigation) {
      if (item.children) {
        const isChildActive = item.children.some((c) => pathname.startsWith(c.href));
        if (isChildActive && !openMenus.includes(item.label)) {
          setOpenMenus((prev) => [...prev, item.label]);
        }
      }
    }
  }, [pathname]);

  function toggleMenu(label: string) {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  }

  function handleLogout() {
    const refreshToken = localStorage.getItem("refreshToken") ?? "";
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).finally(() => {
      localStorage.clear();
      toast.success("Logged out successfully");
      router.replace("/login");
    });
  }

  const Sidebar = (
    <div
      className="flex flex-col h-full bg-[#101114] border-r border-white/10 text-white"
      style={{ minWidth: "250px", width: "250px" }}
    >
      {/* Brand Header with LaunchDarkly Arrow Emblem */}
      <Link
        href="/"
        className="flex items-center justify-between px-5 py-5 border-b border-white/10 hover:opacity-90 transition-opacity group"
        title="Go to StockSense Landing Page"
      >
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-lg tracking-tight text-white font-sans">
            StockSense
          </span>
          <svg
            width="18"
            height="18"
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
        </div>
        <span className="text-[10px] font-mono bg-[#DDFF46]/10 text-[#DDFF46] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
          Runtime
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1.5">
        {navigation.map((item) => {
          const isActive = item.href ? pathname === item.href : false;
          const isOpen = openMenus.includes(item.label);

          if (!item.children) {
            return (
              <Link
                key={item.label}
                href={item.href!}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
                  isActive
                    ? "bg-[#DDFF46] text-black shadow-md font-bold"
                    : "text-white/70 hover:text-white hover:bg-white/[0.08]"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
              </Link>
            );
          }

          const isChildActive = item.children.some((c) => pathname.startsWith(c.href));

          return (
            <div key={item.label} className="space-y-1">
              <button
                onClick={() => toggleMenu(item.label)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
                  isChildActive
                    ? "text-white bg-white/[0.06]"
                    : "text-white/70 hover:text-white hover:bg-white/[0.08]"
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {isOpen ? <ChevronDown size={14} className="text-white/40" /> : <ChevronRight size={14} className="text-white/40" />}
              </button>
              {isOpen && (
                <div className="pl-4 ml-3 border-l border-white/10 space-y-1 py-0.5">
                  {item.children.map((child) => {
                    const childActive = pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all",
                          childActive
                            ? "bg-[#DDFF46] text-black font-bold shadow-sm"
                            : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        {child.icon}
                        <span className="flex-1">{child.label}</span>
                        {childActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-black" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User footer with LaunchDarkly style */}
      {user && (
        <div className="p-3 border-t border-white/10 bg-[#0C0D0E]/80">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/5">
            <div className="w-8 h-8 rounded-full bg-[#DDFF46] text-black flex items-center justify-center text-xs font-black flex-shrink-0 shadow">
              {user.fullName?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{user.fullName}</p>
              <p className="text-[#DDFF46] text-[10px] font-mono uppercase tracking-wider truncate">
                {user.role?.replace("_", " ")}
              </p>
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <User size={14} /> My Profile
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all text-left"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0C0D0E] text-white">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0 h-full overflow-y-auto shadow-2xl">
        {Sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative h-full overflow-y-auto shadow-2xl flex">
            {Sidebar}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with LaunchDarkly Live Telemetry */}
        <header className="flex items-center justify-between px-6 border-b border-white/10 bg-[#121316] flex-shrink-0 h-16 z-10">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <Link
              href="/"
              className="lg:hidden flex items-center gap-2 hover:opacity-85 transition-opacity"
              title="Go to StockSense Landing Page"
            >
              <span className="font-bold text-white text-base">StockSense</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#DDFF46]">
                <path d="M5 19L19 5M19 5H9M19 5V15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            {/* Current Context Pill */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-white/50">
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">WAREHOUSE_OS</span>
              <span>/</span>
              <span className="text-white/80 capitalize font-medium">{pathname.split("/").filter(Boolean)[0] || "Dashboard"}</span>
            </div>
          </div>

          {/* Center Engine Telemetry Pill */}
          <div className="hidden md:flex items-center gap-2 bg-[#1A1B20] border border-white/10 rounded-full px-4 py-1 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#DDFF46] animate-pulse" />
            <span className="text-white/80">Core Engine: <strong className="text-[#DDFF46]">LIVE</strong></span>
            <span className="text-white/30">|</span>
            <span className="text-white/60">Drift: <strong className="text-emerald-400">0.00%</strong></span>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/operations/receipts"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#DDFF46] hover:bg-[#cbf033] text-black font-bold text-xs px-3.5 py-1.5 rounded-full transition-all shadow"
            >
              <span>+ New Operation</span>
              <span>→</span>
            </Link>

            <NotificationBell />

            <Link
              href="/profile"
              className="w-8 h-8 rounded-full bg-[#1F2026] border border-[#DDFF46]/40 hover:border-[#DDFF46] flex items-center justify-center text-[#DDFF46] text-xs font-bold transition-all shadow"
              title="My Profile"
            >
              {user?.fullName?.[0]?.toUpperCase() ?? "U"}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#0C0D0E]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
