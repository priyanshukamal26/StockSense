"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  GitBranch,
  Database,
  Lock,
  Radio,
  Sliders,
  Terminal,
  Warehouse,
  FileText,
  Clock,
  Sparkles,
  Check,
  Laptop
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"receipt" | "delivery" | "transfer" | "adjust">("receipt");
  const [auditToggle, setAuditToggle] = useState(true);
  const [autoHoldToggle, setAutoHoldToggle] = useState(true);
  const [wsSyncToggle, setWsSyncToggle] = useState(true);

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white selection:bg-[#405BFF] selection:text-white font-sans antialiased overflow-x-hidden">
      {/* ─── Grid & Radial Glow Background (LaunchDarkly Signature) ──────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Subtle engineering grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #405BFF 1px, transparent 1px),
              linear-gradient(to bottom, #405BFF 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />
        {/* Top-center electric blue spotlight */}
        <div
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1200px] h-[650px] rounded-full blur-[160px] opacity-40"
          style={{
            background: "radial-gradient(circle, #405BFF 0%, rgba(64,91,255,0.15) 60%, transparent 100%)",
          }}
        />
        {/* Secondary cyan glow */}
        <div
          className="absolute top-[35%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[170px] opacity-20"
          style={{ background: "#00E5FF" }}
        />
        {/* Violet depth glow */}
        <div
          className="absolute bottom-[10%] left-[-10%] w-[700px] h-[600px] rounded-full blur-[170px] opacity-15"
          style={{ background: "#7928CA" }}
        />
      </div>

      {/* ─── TOP NAVBAR (LaunchDarkly style) ─────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A0D14]/85 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#405BFF] to-[#607BFF] flex items-center justify-center shadow-lg shadow-[#405BFF]/30 transition-transform group-hover:scale-105">
              <Boxes size={22} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-white font-mono">
                Stock<span className="text-[#405BFF]">Sense</span>
              </span>
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">
                Inventory OS
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/70 font-medium">
            <a href="#platform" className="hover:text-white transition-colors">
              Platform
            </a>
            <a href="#ledger" className="hover:text-white transition-colors">
              Double-Entry Ledger
            </a>
            <a href="#steppers" className="hover:text-white transition-colors">
              Automated Steppers
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Architecture
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-semibold rounded-full text-white/80 hover:text-white hover:bg-white/[0.08] transition-all border border-white/10"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-semibold rounded-full text-white/80 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#405BFF] hover:bg-[#344ee6] shadow-lg shadow-[#405BFF]/30 hover:shadow-[#405BFF]/50 transition-all flex items-center gap-1.5"
            >
              Sign Up <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ──────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 px-6 text-center max-w-6xl mx-auto space-y-8">
        {/* LaunchDarkly-styled Pill Tag */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#405BFF]/40 bg-[#405BFF]/10 backdrop-blur-md text-xs font-semibold text-[#8FA2FF] shadow-inner">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span>Odoo Hiring Hackathon 2026 · Real-Time Multi-Warehouse Engine</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-5xl mx-auto">
          Control inventory velocity with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#405BFF] via-[#7B93FF] to-[#00E5FF]">
            mathematical precision.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/60 leading-relaxed font-normal">
          A double-entry stock ledger, auto-incremental reference sequences, live out-of-stock guard rails,
          and sub-50ms WebSocket telemetry — built strictly to official hackathon specifications.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/dashboard"
            className="px-8 py-3.5 rounded-full font-bold text-sm bg-[#405BFF] hover:bg-[#324be6] text-white shadow-xl shadow-[#405BFF]/30 hover:shadow-[#405BFF]/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            Launch Dashboard <ArrowRight size={16} />
          </Link>
          <Link
            href="/signup"
            className="px-8 py-3.5 rounded-full font-bold text-sm border border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-white backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-full font-semibold text-sm text-white/60 hover:text-white transition-colors"
          >
            Sign In with Demo Credentials →
          </Link>
        </div>

        {/* ─── INTERACTIVE OPERATIONS TERMINAL (LaunchDarkly Hero Visualizer) ── */}
        <div className="pt-10">
          <div className="rounded-2xl border border-white/10 bg-[#121622]/90 shadow-2xl backdrop-blur-2xl text-left overflow-hidden ring-1 ring-white/5 max-w-5xl mx-auto">
            {/* Terminal Window Header */}
            <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0E121B]/80 gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 font-mono text-xs text-white/50 flex items-center gap-2">
                  <Terminal size={14} className="text-[#405BFF]" />
                  StockSense Engine · live_topology_v1
                </span>
              </div>

              {/* Live Metric Pills */}
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Radio size={10} className="animate-pulse" />
                  Drift: 0.00%
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#405BFF]/10 text-[#8FA2FF] border border-[#405BFF]/20">
                  Latency: 14ms
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">
                  Invariants: Balanced
                </span>
              </div>
            </div>

            {/* Interactive Control Toolbar */}
            <div className="px-6 py-3 border-b border-white/[0.06] bg-[#121622] flex flex-wrap items-center justify-between gap-4">
              {/* Tab Selector */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                {[
                  { id: "receipt", label: "Receipts (IN)", code: "WH/IN" },
                  { id: "delivery", label: "Delivery (OUT)", code: "WH/OUT" },
                  { id: "transfer", label: "Internal Transfer", code: "WH/INT" },
                  { id: "adjust", label: "Stock Adjustment", code: "WH/ADJ" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === tab.id
                        ? "bg-[#405BFF] text-white shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* LaunchDarkly Feature Toggles */}
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-white/60">Ledger Invariant</span>
                  <div
                    onClick={() => setAuditToggle(!auditToggle)}
                    className={`w-9 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      auditToggle ? "bg-[#405BFF]" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                        auditToggle ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </div>
                </label>

                <label className="hidden sm:flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-white/60">Auto-Hold</span>
                  <div
                    onClick={() => setAutoHoldToggle(!autoHoldToggle)}
                    className={`w-9 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      autoHoldToggle ? "bg-[#10B981]" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                        autoHoldToggle ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Simulated Live Stage */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Operation Card */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-[#405BFF] uppercase tracking-wider font-bold">
                        {activeTab === "receipt" && "Operation WH/IN/0001"}
                        {activeTab === "delivery" && "Operation WH/OUT/0001"}
                        {activeTab === "transfer" && "Operation WH/INT/0001"}
                        {activeTab === "adjust" && "Operation WH/ADJ/0001"}
                      </span>
                      <h4 className="text-base font-bold text-white">
                        {activeTab === "receipt" && "Incoming Supplier Stock Batch"}
                        {activeTab === "delivery" && "Outbound Customer Order Fulfillment"}
                        {activeTab === "transfer" && "Inter-Location Bin Transfer"}
                        {activeTab === "adjust" && "Physical Cycle Count Reconciliation"}
                      </h4>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      DONE · Validated
                    </span>
                  </div>

                  {/* Flow Route */}
                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                      <span className="text-white/40 block text-[10px] uppercase font-mono">Source Location</span>
                      <span className="font-semibold text-white">
                        {activeTab === "receipt" && "Vendors (Virtual)"}
                        {activeTab === "delivery" && "WH/Stock1 (Physical)"}
                        {activeTab === "transfer" && "WH/Stock1 (Physical)"}
                        {activeTab === "adjust" && "Inventory Loss (Virtual)"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                      <span className="text-white/40 block text-[10px] uppercase font-mono">Destination</span>
                      <span className="font-semibold text-white">
                        {activeTab === "receipt" && "WH/Stock1 (Physical)"}
                        {activeTab === "delivery" && "Customers (Virtual)"}
                        {activeTab === "transfer" && "WH/Stock2 (Physical)"}
                        {activeTab === "adjust" && "WH/Stock1 (Physical)"}
                      </span>
                    </div>
                  </div>

                  {/* Item table preview */}
                  <div className="rounded-lg border border-white/[0.06] overflow-hidden text-xs">
                    <div className="grid grid-cols-12 px-3 py-2 bg-white/[0.04] text-white/50 font-semibold font-mono text-[11px]">
                      <span className="col-span-6">PRODUCT</span>
                      <span className="col-span-3 text-right">DEMAND</span>
                      <span className="col-span-3 text-right">DONE</span>
                    </div>
                    <div className="grid grid-cols-12 px-3 py-2.5 border-t border-white/[0.04] text-white/90 font-medium items-center">
                      <span className="col-span-6 font-mono text-white">
                        {activeTab === "receipt" && "[DESK001] Desk"}
                        {activeTab === "delivery" && "[MAT001] Mat"}
                        {activeTab === "transfer" && "[CHAIR001] Chair"}
                        {activeTab === "adjust" && "[TABLE001] Table"}
                      </span>
                      <span className="col-span-3 text-right text-white/60">
                        {activeTab === "receipt" && "100 Units"}
                        {activeTab === "delivery" && "25 Units"}
                        {activeTab === "transfer" && "40 Units"}
                        {activeTab === "adjust" && "10 Units"}
                      </span>
                      <span className="col-span-3 text-right font-bold text-emerald-400 font-mono">
                        {activeTab === "receipt" && "100"}
                        {activeTab === "delivery" && "25"}
                        {activeTab === "transfer" && "40"}
                        {activeTab === "adjust" && "10"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Double Entry Ledger Inspector */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#0E121B] space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-white/50 pb-2 border-b border-white/[0.06]">
                    <span className="flex items-center gap-1.5 text-white/80">
                      <Database size={13} className="text-[#405BFF]" />
                      Double-Entry Invariant
                    </span>
                    <span className="text-emerald-400 text-[10px]">Δ Net = 0.00</span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                      <div className="flex justify-between text-[11px]">
                        <span>DEBIT (Dest)</span>
                        <span className="font-bold">+100 Units</span>
                      </div>
                      <span className="text-[10px] text-emerald-400/80">WH/Stock1 · On-Hand Updated</span>
                    </div>

                    <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-300">
                      <div className="flex justify-between text-[11px]">
                        <span>CREDIT (Source)</span>
                        <span className="font-bold">-100 Units</span>
                      </div>
                      <span className="text-[10px] text-red-400/80">Vendors · Balance Conserved</span>
                    </div>
                  </div>

                  <div className="pt-1 text-[11px] text-white/40 space-y-1">
                    <p className="flex items-center gap-1">
                      <Check size={12} className="text-[#405BFF]" />
                      Serializable PostgreSQL Transaction
                    </p>
                    <p className="flex items-center gap-1">
                      <Check size={12} className="text-[#405BFF]" />
                      Immutable StockMove Record Created
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  className="w-full py-2.5 rounded-lg bg-[#405BFF]/15 hover:bg-[#405BFF]/25 border border-[#405BFF]/30 text-[#8FA2FF] font-semibold text-xs text-center transition-all flex items-center justify-center gap-1.5"
                >
                  Inspect Live in StockSense Dashboard <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS STRIP (LaunchDarkly Metrics Bar) ─────────────────────────── */}
      <section className="border-y border-white/[0.08] bg-[#0E121B]/70 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">0.00%</span>
            <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Inventory Drift</p>
          </div>
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">4</span>
            <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Core Lifecycle Ops</p>
          </div>
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">&lt;50ms</span>
            <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">WebSocket Event Latency</p>
          </div>
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">100%</span>
            <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">Audit Trail Coverage</p>
          </div>
        </div>
      </section>

      {/* ─── THE CORE PLATFORM (Dual-Canvas Section) ───────────────────────── */}
      <section id="platform" className="py-24 px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono font-bold tracking-widest text-[#405BFF] uppercase">
            Four Core Pillars
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Complete inventory operations, unified into one control plane.
          </h2>
          <p className="text-base text-white/60">
            Every movement flows through strict lifecycle states: Draft → Waiting → Ready → Done,
            preventing incomplete or unverified inventory updates.
          </p>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Receipts */}
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#121622]/60 hover:border-[#405BFF]/40 hover:bg-[#121622] transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-[#405BFF]/15 text-[#405BFF] flex items-center justify-center font-bold transition-transform group-hover:scale-105">
              <ArrowDownLeft size={22} />
            </div>
            <h3 className="text-lg font-bold text-white">Receipts</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Log incoming goods from external vendors. Auto-increments warehouse stock with matching supplier reference identifiers.
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-mono font-semibold text-[#8FA2FF] bg-[#405BFF]/10 px-2.5 py-1 rounded-md">
                WH/IN/XXXX
              </span>
            </div>
          </div>

          {/* Deliveries */}
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#121622]/60 hover:border-[#405BFF]/40 hover:bg-[#121622] transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold transition-transform group-hover:scale-105">
              <ArrowUpRight size={22} />
            </div>
            <h3 className="text-lg font-bold text-white">Deliveries</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Fulfill customer shipments with automatic stock availability check. Red alerts highlight out-of-stock items before validation.
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                WH/OUT/XXXX
              </span>
            </div>
          </div>

          {/* Internal Transfers */}
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#121622]/60 hover:border-[#405BFF]/40 hover:bg-[#121622] transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold transition-transform group-hover:scale-105">
              <GitBranch size={22} />
            </div>
            <h3 className="text-lg font-bold text-white">Internal Transfers</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Move items between physical storage racks, bins, and warehouses with balanced multi-location tracking.
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-mono font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md">
                WH/INT/XXXX
              </span>
            </div>
          </div>

          {/* Stock Adjustments */}
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#121622]/60 hover:border-[#405BFF]/40 hover:bg-[#121622] transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold transition-transform group-hover:scale-105">
              <Sliders size={22} />
            </div>
            <h3 className="text-lg font-bold text-white">Adjustments</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Reconcile physical stock counts with digital records. Auto-routes discrepancies through virtual inventory loss locations.
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-mono font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md">
                WH/ADJ/XXXX
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DOUBLE-ENTRY LEDGER ARCHITECTURE SECTION ───────────────────────── */}
      <section id="ledger" className="py-20 px-6 border-t border-white/[0.08] bg-[#0E121B]/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-mono font-bold tracking-widest text-[#405BFF] uppercase">
              Mathematical Integrity
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              A double-entry engine that never loses a single item.
            </h2>
            <p className="text-base text-white/60 leading-relaxed">
              Traditional inventory tools overwrite balance fields directly, creating drift and phantom stock.
              StockSense adopts the accounting principle of double-entry ledgering: every addition to a physical bin
              is offset by a decrement to a corresponding virtual source.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { title: "Zero Drift Guarantee", desc: "Every transaction generates balanced immutable stock moves." },
                { title: "Audit Trail Reproducibility", desc: "Rebuild the exact inventory state at any point in history." },
                { title: "Atomic PostgreSQL Transactions", desc: "No partial operations: either all lines balance or the operation aborts." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#405BFF]/20 text-[#405BFF] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-white/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-[#121622] space-y-4 font-mono text-xs shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-white/60">schema_definition.prisma</span>
                <span className="text-[#405BFF]">StockSense DB Schema</span>
              </div>
              <pre className="text-white/70 overflow-x-auto text-[11px] leading-relaxed">
{`model StockMove {
  id              String        @id @default(uuid())
  operationId     String        @map("operation_id")
  productId       String        @map("product_id")
  fromLocationId  String        @map("from_location_id")
  toLocationId    String        @map("to_location_id")
  quantity        Decimal       @db.Decimal(12, 2)
  reference       String
  createdAt       DateTime      @default(now())

  // Double-Entry Invariant:
  // sum(quantity WHERE toLocationId = L) 
  //   - sum(quantity WHERE fromLocationId = L) 
  //   = onHandQty(L)
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CALL TO ACTION BANNER (LaunchDarkly Gradient Mesh) ─────────────── */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center">
        <div className="p-12 sm:p-16 rounded-3xl border border-white/10 bg-gradient-to-r from-[#171E33] via-[#111625] to-[#171E33] shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#405BFF]/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#00E5FF]/10 rounded-full blur-[100px] pointer-events-none" />

          <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to experience zero-drift inventory?
          </h3>
          <p className="text-white/60 max-w-xl mx-auto text-base">
            Log in with the seeded demo credentials or create your own account to run the full end-to-end inventory lifecycle.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-8 py-3.5 rounded-full font-bold text-sm bg-[#405BFF] hover:bg-[#344ee6] text-white shadow-lg shadow-[#405BFF]/30 hover:shadow-[#405BFF]/50 transition-all flex items-center gap-2"
            >
              Launch Dashboard Now <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-full font-semibold text-sm border border-white/20 bg-white/[0.04] text-white hover:bg-white/[0.08] transition-all"
            >
              Sign In to App
            </Link>
            <Link
              href="/signup"
              className="px-8 py-3.5 rounded-full font-semibold text-sm border border-white/20 bg-white/[0.04] text-white hover:bg-white/[0.08] transition-all"
            >
              Create New Account
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] py-12 px-6 text-center text-xs text-white/40 space-y-4">
        <div className="flex items-center justify-center gap-2 font-mono text-sm text-white/80 font-bold">
          <Boxes size={18} className="text-[#405BFF]" /> StockSense Inventory OS
        </div>
        <p>Built for Odoo Hiring Hackathon 2026 · Team: Priyanshu Kamal, Somya Vishnoi, Aditya Kumar</p>
        <p className="text-white/20">Design inspired by LaunchDarkly design token specifications</p>
      </footer>
    </div>
  );
}
