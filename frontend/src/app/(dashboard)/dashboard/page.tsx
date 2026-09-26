"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Package, AlertTriangle, XCircle, Clock, Truck, ArrowLeftRight } from "lucide-react";
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
    <div className="space-y-8 animate-fade-in">
      {/* Page title — exact from wireframe docs/02 §3 */}
      <div>
        <h1 className="page-title">Overview</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-3)" }}>
          Your real-time inventory at a glance
        </p>
      </div>

      {/* ── Inventory Status row — docs/02 §3.1 ── */}
      <section>
        <h2 className="text-base font-semibold mb-4" style={{ color: "var(--ink)", fontFamily: "Inter" }}>
          Inventory Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            label="Total Products"
            value={loading ? "—" : String(summary?.totalProducts ?? 0)}
            icon={<Package size={20} />}
            color="#405BFF"
            href="/products"
          />
          <StatCard
            label="Low Stock"
            value={loading ? "—" : String(summary?.lowStockCount ?? 0)}
            icon={<AlertTriangle size={20} />}
            color="#D97706"
            href="/stock?alert=low"
          />
          <StatCard
            label="Out of Stock"
            value={loading ? "—" : String(summary?.outOfStockCount ?? 0)}
            icon={<XCircle size={20} />}
            color="#DC2626"
            href="/stock?alert=out"
          />
        </div>
      </section>

      {/* ── Operations row — docs/02 §3.2 ── */}
      <section>
        <h2 className="text-base font-semibold mb-4" style={{ color: "var(--ink)", fontFamily: "Inter" }}>
          Operations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Receipts widget */}
          <OperationWidget
            title="Receipts"
            icon={<Package size={20} />}
            href="/operations/receipts"
            color="#405BFF"
            loading={loading}
            rows={[
              { label: "To Receive", value: summary?.receipts.toReceive ?? 0 },
              { label: "Late", value: summary?.receipts.late ?? 0, isAlert: true },
              { label: "Operations", value: summary?.receipts.operations ?? 0 },
            ]}
          />

          {/* Deliveries widget */}
          <OperationWidget
            title="Delivery"
            icon={<Truck size={20} />}
            href="/operations/delivery"
            color="#16A34A"
            loading={loading}
            rows={[
              { label: "To Deliver", value: summary?.deliveries.toDeliver ?? 0 },
              { label: "Late", value: summary?.deliveries.late ?? 0, isAlert: true },
              { label: "Waiting", value: summary?.deliveries.waiting ?? 0, color: "#D97706" },
              { label: "Operations", value: summary?.deliveries.operations ?? 0 },
            ]}
          />

          {/* Internal Transfers */}
          <OperationWidget
            title="Internal Transfers"
            icon={<ArrowLeftRight size={20} />}
            href="/operations/transfers"
            color="#7C3AED"
            loading={loading}
            rows={[
              { label: "Scheduled", value: summary?.transfersScheduled ?? 0 },
            ]}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label, value, icon, color, href,
}: {
  label: string; value: string; icon: React.ReactNode; color: string; href: string;
}) {
  return (
    <Link href={href} className="ss-card flex items-center gap-4 group cursor-pointer block">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white transition-transform group-hover:scale-105"
        style={{ background: `${color}18`, color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold" style={{ color: "var(--ink)", fontFamily: "Space Grotesk, sans-serif" }}>
          {value}
        </p>
        <p className="text-sm" style={{ color: "var(--muted-3)" }}>{label}</p>
      </div>
    </Link>
  );
}

function OperationWidget({
  title, icon, href, color, loading, rows,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  loading: boolean;
  rows: { label: string; value: number; isAlert?: boolean; color?: string }[];
}) {
  return (
    <div className="ss-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color}18`, color }}
          >
            {icon}
          </div>
          <h3 className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{title}</h3>
        </div>
        <Link
          href={href}
          className="text-xs font-medium px-3 py-1 rounded-pill transition-colors hover:bg-brand/5"
          style={{ color: "var(--brand-primary)" }}
        >
          View →
        </Link>
      </div>

      <div className="space-y-3 divide-y" style={{ borderColor: "var(--muted-2)" }}>
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between pt-3 first:pt-0 first:border-t-0">
            <span className="text-sm" style={{ color: "var(--muted-4)" }}>{row.label}</span>
            <span
              className="text-2xl font-bold"
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                color: loading ? "var(--muted-2)" : row.isAlert && row.value > 0 ? "#DC2626" : row.color ?? "var(--ink)",
              }}
            >
              {loading ? "—" : row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
