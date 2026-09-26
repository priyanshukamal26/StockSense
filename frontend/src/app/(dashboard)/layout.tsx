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
      className="flex flex-col h-full"
      style={{ background: "var(--ink)", minWidth: "240px", width: "240px" }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.5 px-5 py-5 border-b hover:opacity-90 transition-opacity"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
        title="Go to StockSense Landing Page"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow"
          style={{ background: "var(--brand-primary)" }}
        >
          S
        </div>
        <span className="text-white font-display font-bold text-lg">StockSense</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {navigation.map((item) => {
          const isActive = item.href ? pathname === item.href : false;
          const isOpen = openMenus.includes(item.label);

          if (!item.children) {
            return (
              <Link
                key={item.label}
                href={item.href!}
                className={cn(
                  "nav-item",
                  isActive && "active"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          }

          const isChildActive = item.children.some((c) => pathname.startsWith(c.href));

          return (
            <div key={item.label}>
              <button
                onClick={() => toggleMenu(item.label)}
                className={cn("nav-item w-full", isChildActive && "!text-white")}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isOpen && (
                <div className="pl-4 mt-1 space-y-0.5">
                  {item.children.map((child) => {
                    const childActive = pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all",
                          childActive
                            ? "text-white font-medium"
                            : "text-white/50 hover:text-white/80 hover:bg-white/5"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        {child.icon}
                        {child.label}
                        {childActive && (
                          <div className="ml-auto w-1 h-4 rounded-full" style={{ background: "var(--brand-primary)" }} />
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

      {/* User footer */}
      {user && (
        <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "var(--brand-primary)" }}
            >
              {user.fullName?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.fullName}</p>
              <p className="text-white/40 text-xs truncate">{user.role?.replace("_", " ")}</p>
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all">
              <User size={14} /> My Profile
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--muted-1)" }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0 h-full overflow-y-auto shadow-xl">
        {Sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative h-full overflow-y-auto shadow-xl flex">
            {Sidebar}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center gap-4 px-6 py-4 border-b flex-shrink-0"
          style={{ background: "white", borderColor: "var(--muted-2)", height: "64px" }}
        >
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <Link
            href="/"
            className="lg:hidden flex items-center gap-2 hover:opacity-85 transition-opacity"
            title="Go to StockSense Landing Page"
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
              style={{ background: "var(--brand-primary)" }}
            >
              S
            </div>
            <span className="font-bold text-gray-900 font-display">StockSense</span>
          </Link>

          <div className="flex-1" />

          <NotificationBell />

          <Link
            href="/profile"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold transition-transform hover:scale-105"
            style={{ background: "var(--brand-primary)" }}
            title="My Profile"
          >
            {user?.fullName?.[0]?.toUpperCase() ?? "U"}
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
