import { cn } from "@/lib/utils";

type Status = "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELLED";

const CONFIG: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  DRAFT:     { label: "Draft",     color: "#94A3B8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.25)" },
  WAITING:   { label: "Waiting",   color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)" },
  READY:     { label: "Ready",     color: "#DDFF46", bg: "rgba(221,255,70,0.12)",  border: "rgba(221,255,70,0.35)" },
  DONE:      { label: "Done",      color: "#10B981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)" },
  CANCELLED: { label: "Cancelled", color: "#EF4444", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status as Status] ?? CONFIG.DRAFT;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase shadow-sm"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}
