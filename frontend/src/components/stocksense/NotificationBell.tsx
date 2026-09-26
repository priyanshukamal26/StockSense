"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { cn, timeAgo } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time notifications
    const socket = getSocket();
    socket.on("notification:new", (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 50));
      setUnreadCount((n) => n + 1);
    });

    return () => {
      socket.off("notification:new");
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await api.get<{ data: Notification[]; unreadCount: number }>("/notifications");
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
    } catch {
      // Ignore if not authenticated yet
    }
  }

  async function markAllRead() {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }

  const typeColor: Record<string, string> = {
    LOW_STOCK: "#D97706",
    OUT_OF_STOCK: "#DC2626",
    OPERATION_LATE: "#DC2626",
    OPERATION_READY: "#405BFF",
    SYSTEM: "#969696",
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} style={{ color: "var(--muted-4)" }} />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-xs font-bold leading-none"
            style={{ background: "var(--danger)", fontSize: "10px", padding: "0 4px" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ background: "white", border: "1px solid var(--muted-2)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--muted-2)" }}>
            <h3 className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium transition-colors"
                style={{ color: "var(--brand-primary)" }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--muted-3)" }}>
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className="px-4 py-3 border-b transition-colors"
                  style={{
                    borderColor: "var(--muted-2)",
                    background: n.isRead ? "transparent" : "rgba(64,91,255,0.03)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: n.isRead ? "transparent" : typeColor[n.type] ?? "#969696" }}
                    />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>{n.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted-3)" }}>{n.message}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--muted-3)" }}>{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
