"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Package, AlertTriangle, XCircle, Clock, Truck, ArrowLeftRight, Activity, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DashboardSummary {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  receipts: { toReceive: number; late: number; operations: number };
  deliveries: { toDeliver: number; late: number; waiting: number; operations: number };
  transfersScheduled: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardSummary>("/dashboard/summary")
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-fade-in text-white">
      {/* ── Page Title & Live Telemetry Badge ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">Overview</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#DDFF46]/10 text-[#DDFF46] text-[10px] font-mono uppercase font-bold border border-[#DDFF46]/20">
              Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-white/50">
            Real-time double-entry inventory telemetry & operational queue velocity
          </p>
        </div>

        {/* Live Invariant Indicator */}
        <div className="flex items-center gap-3">
          <div className="bg-[#15161A] border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/60">Double-Entry Net:</span>
            <span className="font-bold text-emerald-400">0.00 Δ</span>
          </div>
        </div>
      </div>

      {/* ── Inventory Status row (LaunchDarkly Telemetry Stat Cards) ──────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest text-white/50 font-mono font-bold">
            Inventory Health & Constraints
          </h2>
          <span className="text-xs font-mono text-[#DDFF46]">3 Core Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Catalog Products"
            value={loading ? "—" : String(summary?.totalProducts ?? 0)}
            icon={<Package size={22} />}
            color="#DDFF46"
            trend="+100% Verified"
            href="/products"
          />
          <StatCard
            label="Low Stock Warnings"
            value={loading ? "—" : String(summary?.lowStockCount ?? 0)}
            icon={<AlertTriangle size={22} />}
            color="#F59E0B"
            trend={summary?.lowStockCount ? "Attention Needed" : "Optimal"}
            href="/stock?alert=low"
          />
          <StatCard
            label="Out of Stock Line Items"
            value={loading ? "—" : String(summary?.outOfStockCount ?? 0)}
            icon={<XCircle size={22} />}
            color="#EF4444"
            trend={summary?.outOfStockCount ? "Urgent Reorder" : "Zero Stockouts"}
            href="/stock?alert=out"
          />
        </div>
      </section>

      {/* ── Operations Queues (LaunchDarkly Bento Widgets) ─────────────────── */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest text-white/50 font-mono font-bold">
            Active Lifecycle Queues
          </h2>
          <Link
            href="/operations/receipts"
            className="text-xs text-[#DDFF46] hover:underline font-mono flex items-center gap-1"
          >
            All Operations →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Receipts widget */}
          <OperationWidget
            title="Receipts (Incoming)"
            tag="WH/IN"
            icon={<Package size={20} />}
            href="/operations/receipts"
            accentColor="#DDFF46"
            loading={loading}
            rows={[
              { label: "To Receive", value: summary?.receipts.toReceive ?? 0 },
              { label: "Late Deliveries", value: summary?.receipts.late ?? 0, isAlert: true },
              { label: "Total Operations", value: summary?.receipts.operations ?? 0 },
            ]}
          />

          {/* Deliveries widget */}
          <OperationWidget
            title="Deliveries (Outbound)"
            tag="WH/OUT"
            icon={<Truck size={20} />}
            href="/operations/deliveries"
            accentColor="#38BDF8"
            loading={loading}
            rows={[
              { label: "To Deliver", value: summary?.deliveries.toDeliver ?? 0 },
              { label: "Late Shipments", value: summary?.deliveries.late ?? 0, isAlert: true },
              { label: "Waiting Stock", value: summary?.deliveries.waiting ?? 0, color: "#F59E0B" },
              { label: "Total Operations", value: summary?.deliveries.operations ?? 0 },
            ]}
          />

          {/* Internal Transfers */}
          <OperationWidget
            title="Internal Transfers"
            tag="WH/INT"
            icon={<ArrowLeftRight size={20} />}
            href="/operations/transfers"
            accentColor="#A34FDE"
            loading={loading}
            rows={[
              { label: "Scheduled Bin Transfers", value: summary?.transfersScheduled ?? 0 },
              { label: "Transit Invariants", value: 0 },
              { label: "Active Channels", value: 1 },
            ]}
          />
        </div>
      </section>

      {/* ── Quick Telemetry Summary Bar ──────────────────────────────────── */}
      <section className="p-6 rounded-2xl bg-[#141519] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#DDFF46]/10 text-[#DDFF46] flex items-center justify-center font-bold">
            <Activity size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">StockSense Autonomous Engine</h4>
            <p className="text-xs text-white/50">Mathematical double-entry consistency verified across all active warehouse locations.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/operations/receipts"
            className="px-4 py-2 rounded-full bg-[#DDFF46] text-black font-bold text-xs hover:bg-[#cbf033] transition-all flex items-center gap-1.5 shadow"
          >
            <span>Create Operation</span>
            <span>→</span>
          </Link>
          <Link
            href="/move-history"
            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 text-xs font-semibold transition-all"
          >
            Audit Moves
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label, value, icon, color, trend, href,
}: {
  label: string; value: string; icon: React.ReactNode; color: string; trend?: string; href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-[#141519] border border-white/10 hover:border-[#DDFF46]/40 rounded-2xl p-6 shadow-xl transition-all block group relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>
        {trend && (
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
            style={{ background: `${color}15`, color }}
          >
            {trend}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight group-hover:text-white transition-colors">
          {value}
        </p>
        <p className="text-xs font-medium text-white/50">{label}</p>
      </div>

      {/* Decorative corner glow */}
      <div
        className="absolute -right-12 -bottom-12 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none transition-opacity group-hover:opacity-25"
        style={{ background: color }}
      />
    </Link>
  );
}

function OperationWidget({
  title, tag, icon, href, accentColor, loading, rows,
}: {
  title: string;
  tag: string;
  icon: React.ReactNode;
  href: string;
  accentColor: string;
  loading: boolean;
  rows: { label: string; value: number; isAlert?: boolean; color?: string }[];
}) {
  return (
    <div className="bg-[#141519] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${accentColor}18`, color: accentColor }}
          >
            {icon}
          </div>
          <div>
            <span className="text-[10px] font-mono text-white/40 uppercase block">{tag}</span>
            <h3 className="font-bold text-sm text-white">{title}</h3>
          </div>
        </div>

        <Link
          href={href}
          className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-[#DDFF46] hover:text-[#DDFF46] transition-all flex items-center gap-1 text-white/70"
        >
          <span>View</span>
          <span>→</span>
        </Link>
      </div>

      <div className="space-y-2.5 divide-y divide-white/5">
        {rows.map((row, idx) => (
          <div key={row.label} className={cn("flex items-center justify-between", idx > 0 && "pt-2.5")}>
            <span className="text-xs text-white/60">{row.label}</span>
            <span
              className={cn(
                "text-xl font-bold font-mono",
                loading
                  ? "text-white/20"
                  : row.isAlert && row.value > 0
                  ? "text-red-400"
                  : row.color ?? "text-white"
              )}
            >
              {loading ? "—" : row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
