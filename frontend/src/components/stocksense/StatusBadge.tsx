import { cn } from "@/lib/utils";

type Status = "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELLED";

const CONFIG: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  DRAFT:     { label: "Draft",     color: "#969696", bg: "rgba(150,150,150,0.1)", border: "rgba(150,150,150,0.2)" },
  WAITING:   { label: "Waiting",   color: "#D97706", bg: "rgba(217,119,6,0.1)",  border: "rgba(217,119,6,0.25)" },
  READY:     { label: "Ready",     color: "#405BFF", bg: "rgba(64,91,255,0.1)",  border: "rgba(64,91,255,0.2)" },
  DONE:      { label: "Done",      color: "#16A34A", bg: "rgba(22,163,74,0.1)",  border: "rgba(22,163,74,0.2)" },
  CANCELLED: { label: "Cancelled", color: "#DC2626", bg: "rgba(220,38,38,0.1)",  border: "rgba(220,38,38,0.2)" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status as Status] ?? CONFIG.DRAFT;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}
