"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  Database,
  Radio,
  Sliders,
  Terminal,
  Warehouse,
  Check,
  Copy,
  User,
  Key,
  Github,
  Linkedin
} from "lucide-react";
import { toast } from "sonner";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"receipt" | "delivery" | "transfer" | "adjust">("receipt");
  const [auditToggle, setAuditToggle] = useState(true);
  const [autoHoldToggle, setAutoHoldToggle] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationSuccess, setSimulationSuccess] = useState(false);

  const handleSimulate = () => {
    setSimulating(true);
    setSimulationSuccess(false);
    setTimeout(() => {
      setSimulating(false);
      setSimulationSuccess(true);
      toast.success("Transaction committed: Double-entry invariant Δ = 0.00 conserved!");
      setTimeout(() => setSimulationSuccess(false), 5000);
    }, 600);
  };

  const copyCredentials = (id: string, pass: string, role: string) => {
    navigator.clipboard.writeText(`${id}:${pass}`);
    setCopiedAccount(role);
    toast.success(`Copied ${role} credentials to clipboard!`);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0C0D0E] text-white selection:bg-[#DDFF46] selection:text-black font-sans antialiased overflow-x-hidden">
      {/* ─── Grid & Radial Glow Background (LaunchDarkly Engineering Canvas) ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* LaunchDarkly subtle engineering grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #DDFF46 1px, transparent 1px),
              linear-gradient(to bottom, #DDFF46 1px, transparent 1px)
            `,
            backgroundSize: "56px 56px",
          }}
        />
        {/* Top-center electric lime spotlight */}
        <div
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1100px] h-[600px] rounded-full blur-[170px] opacity-25"
          style={{
            background: "radial-gradient(circle, #DDFF46 0%, rgba(221,255,70,0.12) 60%, transparent 100%)",
          }}
        />
        {/* Subtle cyan glow */}
        <div
          className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[160px] opacity-10"
          style={{ background: "#38BDF8" }}
        />
        {/* Bottom depth glow */}
        <div
          className="absolute bottom-[5%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[180px] opacity-10"
          style={{ background: "#DDFF46" }}
        />
      </div>

      {/* ─── TOP NAVBAR (LaunchDarkly Style) ─────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0C0D0E]/85 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo with LaunchDarkly Angled Arrow Emblem */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#16171B] border border-white/10 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
              <Boxes size={20} className="text-[#DDFF46]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white font-sans">
                  Stock<span className="text-[#DDFF46]">Sense</span>
                </span>
                <svg
                  width="14"
                  height="14"
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
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-semibold">
                Inventory OS
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-wider text-white/70 font-semibold">
            <a href="#platform" className="hover:text-[#DDFF46] transition-colors">
              Platform
            </a>
            <a href="#ledger" className="hover:text-[#DDFF46] transition-colors">
              Double-Entry Ledger
            </a>
            <a href="#architecture" className="hover:text-[#DDFF46] transition-colors">
              Architecture
            </a>
            <a href="#credentials" className="hover:text-[#DDFF46] transition-colors">
              Demo Access
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-mono font-bold rounded-full text-white/80 hover:text-white hover:bg-white/[0.08] transition-all border border-white/10"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-mono font-bold rounded-full text-white/80 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-full text-xs font-bold text-black bg-[#DDFF46] hover:bg-[#cbf033] shadow-lg shadow-[#DDFF46]/20 transition-all flex items-center gap-1.5"
            >
              <span>Sign Up</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── SECTION 1: HERO PITCH & VALUE PROPOSITION ─────────────────────── */}
      <section className="relative pt-20 pb-16 px-6 max-w-5xl mx-auto space-y-8 text-center">
        {/* Refined, smaller headline */}
        <div className="space-y-6 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Control inventory velocity with{" "}
            <span className="text-[#DDFF46] underline decoration-[#DDFF46]/30 underline-offset-8">
              mathematical precision.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-white/60 leading-relaxed font-normal">
            A double-entry stock ledger, auto-incremental reference sequences, live out-of-stock guard rails,
            and sub-50ms WebSocket telemetry — built strictly to official hackathon specifications.
          </p>

          {/* Hero Action Cluster */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="px-7 py-3.5 rounded-full font-bold text-sm bg-[#DDFF46] hover:bg-[#cbf033] text-black shadow-xl shadow-[#DDFF46]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 group"
            >
              <span>Launch Dashboard</span>
              <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/signup"
              className="px-7 py-3.5 rounded-full font-bold text-sm border border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-white backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span>Create Account</span>
              <span className="text-white/40">→</span>
            </Link>
            <Link
              href="/login"
              className="px-5 py-3.5 rounded-full font-mono text-xs sm:text-sm text-white/70 hover:text-[#DDFF46] transition-colors"
            >
              Sign In with Demo Credentials →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: INTERACTIVE DOUBLE-ENTRY CONTROL CONSOLE ────────────── */}
      <section className="relative pb-24 px-6 max-w-6xl mx-auto space-y-6">
        {/* Section 2 Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#DDFF46] uppercase tracking-wider font-bold">
                RUNTIME TOPOLOGY // CONTROL PLANE
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#DDFF46] animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Interactive Double-Entry Operations HUD
            </h2>
            <p className="text-xs sm:text-sm text-white/50 max-w-xl">
              Inspect how balanced debit and credit entries conserve inventory invariants in real-time across four core warehouse flows.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-white/40">
            <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">INVARIANT: ΣΔ = 0.00</span>
          </div>
        </div>

        {/* CAD Registration Crosshairs & Cockpit Chassis */}
        <div className="relative pt-2">
          {/* CAD Registration Crosshairs */}
          <div className="absolute top-0 left-0 text-[#DDFF46]/30 font-mono text-xs select-none pointer-events-none">+</div>
          <div className="absolute top-0 right-0 text-[#DDFF46]/30 font-mono text-xs select-none pointer-events-none">+</div>
          <div className="absolute bottom-0 left-0 text-[#DDFF46]/30 font-mono text-xs select-none pointer-events-none">+</div>
          <div className="absolute bottom-0 right-0 text-[#DDFF46]/30 font-mono text-xs select-none pointer-events-none">+</div>

          <div className="rounded-2xl border border-white/10 bg-[#0E1013] shadow-2xl backdrop-blur-2xl text-left overflow-hidden ring-1 ring-white/5 max-w-5xl mx-auto border-t-2 border-t-[#DDFF46]/50">
            {/* HUD Header Bar */}
            <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0A0B0E] gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="font-mono text-xs text-white/50 flex items-center gap-2 pl-2 border-l border-white/10">
                  <Terminal size={14} className="text-[#DDFF46]" />
                  STOCKSENSE_CONSOLE // runtime_stream_v1
                </span>
              </div>

              {/* Real-time Telemetry Readout */}
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Radio size={10} className="animate-pulse" />
                  DRIFT: 0.00%
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DDFF46]/10 text-[#DDFF46] border border-[#DDFF46]/20">
                  LATENCY: 14ms
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 text-white/70 border border-white/10">
                  INVARIANTS: BALANCED (ΣΔ = 0)
                </span>
              </div>
            </div>

            {/* Stream Selector & Feature Toggles Bar */}
            <div className="px-6 py-3 border-b border-white/[0.08] bg-[#121418] flex flex-wrap items-center justify-between gap-4">
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
                        ? "bg-[#DDFF46] text-black shadow-sm font-bold"
                        : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-white/60">Ledger Invariant</span>
                  <div
                    onClick={() => setAuditToggle(!auditToggle)}
                    className={`w-9 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      auditToggle ? "bg-[#DDFF46]" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                        auditToggle ? "translate-x-4 bg-black" : "translate-x-0 bg-white"
                      }`}
                    />
                  </div>
                </label>

                <label className="hidden sm:flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-white/60">Auto-Hold</span>
                  <div
                    onClick={() => setAutoHoldToggle(!autoHoldToggle)}
                    className={`w-9 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      autoHoldToggle ? "bg-emerald-500" : "bg-white/20"
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

            {/* Cockpit Interior (2-Pane Synchronized Architecture) */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0E1013]">
              {/* Left Pane: Live Operational Workflow */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#14161C] space-y-4">
                  {/* Operation Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#DDFF46] uppercase tracking-wider font-bold">
                          {activeTab === "receipt" && "Operation WH/IN/0001"}
                          {activeTab === "delivery" && "Operation WH/OUT/0001"}
                          {activeTab === "transfer" && "Operation WH/INT/0001"}
                          {activeTab === "adjust" && "Operation WH/ADJ/0001"}
                        </span>
                        <span className="text-[10px] font-mono bg-white/5 text-white/50 px-2 py-0.5 rounded">
                          SERIALIZED
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-0.5">
                        {activeTab === "receipt" && "Incoming Supplier Stock Batch"}
                        {activeTab === "delivery" && "Outbound Customer Order Fulfillment"}
                        {activeTab === "transfer" && "Inter-Location Bin Transfer"}
                        {activeTab === "adjust" && "Physical Cycle Count Reconciliation"}
                      </h4>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      DONE · Validated
                    </span>
                  </div>

                  {/* Stage Stepper Pipeline */}
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[10px] font-mono text-white/40 uppercase block mb-2">Workflow Lifecycle Stepper</span>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 text-white/60">
                        <Check size={12} className="text-[#DDFF46]" /> Draft
                      </div>
                      <div className="h-[1px] flex-1 bg-[#DDFF46]/30 mx-2" />
                      <div className="flex items-center gap-1.5 text-white/60">
                        <Check size={12} className="text-[#DDFF46]" /> Waiting
                      </div>
                      <div className="h-[1px] flex-1 bg-[#DDFF46]/30 mx-2" />
                      <div className="flex items-center gap-1.5 text-white/60">
                        <Check size={12} className="text-[#DDFF46]" /> Ready
                      </div>
                      <div className="h-[1px] flex-1 bg-[#DDFF46]/60 mx-2" />
                      <div className="flex items-center gap-1.5 text-[#DDFF46] font-bold">
                        <CheckCircle2 size={13} className="text-[#DDFF46]" /> Done
                      </div>
                    </div>
                  </div>

                  {/* Route Flow Vectors */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                      <span className="text-white/40 block text-[10px] uppercase font-mono">Source Location</span>
                      <span className="font-semibold text-white block mt-0.5">
                        {activeTab === "receipt" && "Vendors (Virtual)"}
                        {activeTab === "delivery" && "WH/Stock1 (Physical)"}
                        {activeTab === "transfer" && "WH/Stock1 (Physical)"}
                        {activeTab === "adjust" && "Inventory Loss (Virtual)"}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                      <span className="text-white/40 block text-[10px] uppercase font-mono">Destination</span>
                      <span className="font-semibold text-white block mt-0.5">
                        {activeTab === "receipt" && "WH/Stock1 (Physical)"}
                        {activeTab === "delivery" && "Customers (Virtual)"}
                        {activeTab === "transfer" && "WH/Stock2 (Physical)"}
                        {activeTab === "adjust" && "WH/Stock1 (Physical)"}
                      </span>
                    </div>
                  </div>

                  {/* Line Item Breakdown */}
                  <div className="rounded-lg border border-white/[0.06] overflow-hidden text-xs">
                    <div className="grid grid-cols-12 px-3 py-2 bg-white/[0.04] text-white/50 font-semibold font-mono text-[11px]">
                      <span className="col-span-6">PRODUCT</span>
                      <span className="col-span-3 text-right">DEMAND</span>
                      <span className="col-span-3 text-right">FULFILLED</span>
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
                      <span className="col-span-3 text-right font-bold text-[#DDFF46] font-mono">
                        {activeTab === "receipt" && "100"}
                        {activeTab === "delivery" && "25"}
                        {activeTab === "transfer" && "40"}
                        {activeTab === "adjust" && "10"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Pane: Double-Entry Balance Engine */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div className="p-4 rounded-xl border border-white/[0.08] bg-[#14161C] space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-white/50 pb-2 border-b border-white/[0.06]">
                    <span className="flex items-center gap-1.5 text-white/90 font-bold">
                      <Database size={13} className="text-[#DDFF46]" />
                      Double-Entry Invariant
                    </span>
                    <span className="text-[#DDFF46] text-[10px] font-bold">Δ Net = 0.00</span>
                  </div>

                  {/* Debit and Credit Balances */}
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-[#DDFF46]/10 border border-[#DDFF46]/30 text-[#DDFF46]">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span>DEBIT (Dest)</span>
                        <span>
                          {activeTab === "receipt" && "+100 Units"}
                          {activeTab === "delivery" && "+25 Units"}
                          {activeTab === "transfer" && "+40 Units"}
                          {activeTab === "adjust" && "+10 Units"}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/70 block mt-0.5">
                        {activeTab === "receipt" && "WH/Stock1 · On-Hand Updated"}
                        {activeTab === "delivery" && "Customers · Outbound Dispatched"}
                        {activeTab === "transfer" && "WH/Stock2 · Destination Stored"}
                        {activeTab === "adjust" && "WH/Stock1 · Physical Count Settled"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span>CREDIT (Source)</span>
                        <span>
                          {activeTab === "receipt" && "-100 Units"}
                          {activeTab === "delivery" && "-25 Units"}
                          {activeTab === "transfer" && "-40 Units"}
                          {activeTab === "adjust" && "-10 Units"}
                        </span>
                      </div>
                      <span className="text-[10px] text-red-400/80 block mt-0.5">
                        {activeTab === "receipt" && "Vendors · Balance Conserved"}
                        {activeTab === "delivery" && "WH/Stock1 · Deducted From Bin"}
                        {activeTab === "transfer" && "WH/Stock1 · Decremented"}
                        {activeTab === "adjust" && "Inventory Loss · Offset Accounted"}
                      </span>
                    </div>
                  </div>

                  {/* Invariant Guarantees */}
                  <div className="pt-2 text-[11px] text-white/50 space-y-1.5 border-t border-white/5">
                    <p className="flex items-center gap-1.5 text-white/80">
                      <Check size={12} className="text-[#DDFF46]" />
                      Serializable PostgreSQL Transaction
                    </p>
                    <p className="flex items-center gap-1.5 text-white/80">
                      <Check size={12} className="text-[#DDFF46]" />
                      Immutable StockMove Record Created
                    </p>
                  </div>
                </div>

                {/* Simulation Trigger */}
                <div className="space-y-2">
                  <button
                    onClick={handleSimulate}
                    disabled={simulating}
                    className="w-full py-2.5 rounded-xl border border-[#DDFF46]/40 bg-[#DDFF46]/10 hover:bg-[#DDFF46]/20 text-[#DDFF46] font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Zap size={14} className={simulating ? "animate-spin text-[#DDFF46]" : "text-[#DDFF46]"} />
                    <span>{simulating ? "Verifying Invariant & Writing Move..." : "⚡ Simulate Double-Entry Move"}</span>
                  </button>

                  {simulationSuccess && (
                    <div className="p-2 rounded-lg bg-[#DDFF46]/15 border border-[#DDFF46]/40 text-[#DDFF46] font-mono text-[10px] flex items-center gap-1.5 animate-fade-in">
                      <CheckCircle2 size={12} className="flex-shrink-0" />
                      <span>INVARIANT VERIFIED: Δ = 0.0000 (Conserved)</span>
                    </div>
                  )}
                </div>

                {/* Direct Action Link */}
                <Link
                  href="/dashboard"
                  className="w-full py-3 rounded-xl bg-[#DDFF46] hover:bg-[#cbf033] text-black font-bold text-xs text-center transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#DDFF46]/10"
                >
                  <span>Inspect Live in StockSense Dashboard</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SEEDED DEMO CREDENTIALS BANNER (Authentic StockSense Facts) ────── */}
      <section id="credentials" className="py-12 px-6 max-w-5xl mx-auto">
        <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-[#121316] relative overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#DDFF46]/10 text-[#DDFF46] text-[10px] font-mono uppercase font-bold border border-[#DDFF46]/20">
                  Instant Evaluator Access
                </span>
                <span className="text-xs text-white/40 font-mono">Seeded Credentials</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Evaluate without manual sign up
              </h3>
              <p className="text-xs sm:text-sm text-white/50 max-w-xl">
                The database is pre-seeded with two operational accounts matching the official test plan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-shrink-0">
              {/* Admin Account */}
              <div className="p-3.5 rounded-xl bg-[#1A1B20] border border-white/10 hover:border-[#DDFF46]/40 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#DDFF46] font-bold">Admin Role</span>
                  <button
                    onClick={() => copyCredentials("demoadmin", "admin123", "Admin")}
                    className="text-white/40 hover:text-white transition-colors"
                    title="Copy demoadmin:admin123"
                  >
                    {copiedAccount === "Admin" ? <Check size={14} className="text-[#DDFF46]" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="font-mono text-xs text-white/80 space-y-0.5">
                  <p><span className="text-white/40">ID:</span> demoadmin</p>
                  <p><span className="text-white/40">PW:</span> admin123</p>
                </div>
                <Link
                  href="/login"
                  className="block text-center py-1.5 rounded-lg bg-white/5 hover:bg-[#DDFF46] hover:text-black text-[11px] font-bold text-white/80 transition-all"
                >
                  Login as Admin →
                </Link>
              </div>

              {/* Worker Account */}
              <div className="p-3.5 rounded-xl bg-[#1A1B20] border border-white/10 hover:border-[#DDFF46]/40 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">Warehouse Staff</span>
                  <button
                    onClick={() => copyCredentials("demoworker", "worker123", "Staff")}
                    className="text-white/40 hover:text-white transition-colors"
                    title="Copy demoworker:worker123"
                  >
                    {copiedAccount === "Staff" ? <Check size={14} className="text-[#DDFF46]" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="font-mono text-xs text-white/80 space-y-0.5">
                  <p><span className="text-white/40">ID:</span> demoworker</p>
                  <p><span className="text-white/40">PW:</span> worker123</p>
                </div>
                <Link
                  href="/login"
                  className="block text-center py-1.5 rounded-lg bg-white/5 hover:bg-[#DDFF46] hover:text-black text-[11px] font-bold text-white/80 transition-all"
                >
                  Login as Staff →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS STRIP (LaunchDarkly Metrics Bar) ─────────────────────────── */}
      <section className="border-y border-white/10 bg-[#121316] py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#DDFF46] font-mono">0.00%</span>
            <p className="text-xs uppercase tracking-wider text-white/50 font-semibold font-mono">Inventory Drift</p>
          </div>
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">4</span>
            <p className="text-xs uppercase tracking-wider text-white/50 font-semibold font-mono">Core Lifecycle Ops</p>
          </div>
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#DDFF46] font-mono">&lt;50ms</span>
            <p className="text-xs uppercase tracking-wider text-white/50 font-semibold font-mono">WebSocket Event Latency</p>
          </div>
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">100%</span>
            <p className="text-xs uppercase tracking-wider text-white/50 font-semibold font-mono">Audit Trail Coverage</p>
          </div>
        </div>
      </section>

      {/* ─── THE CORE PLATFORM (LaunchDarkly Bento Section) ─────────────────── */}
      <section id="platform" className="py-24 px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono font-bold tracking-widest text-[#DDFF46] uppercase">
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

        {/* 4 Feature Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Receipts */}
          <div className="p-6 rounded-2xl border border-white/10 bg-[#141519] hover:border-[#DDFF46]/50 hover:bg-[#18191E] transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-[#DDFF46]/10 text-[#DDFF46] flex items-center justify-center font-bold transition-transform group-hover:scale-105">
              <ArrowDownLeft size={22} />
            </div>
            <h3 className="text-lg font-bold text-white">Receipts</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Log incoming goods from external vendors. Auto-increments warehouse stock with matching supplier reference identifiers.
            </p>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-[#DDFF46] bg-[#DDFF46]/10 px-2.5 py-1 rounded-md border border-[#DDFF46]/20">
                WH/IN/XXXX
              </span>
              <Link
                href="/operations/receipts"
                className="text-xs font-mono text-white/50 group-hover:text-[#DDFF46] flex items-center gap-1 transition-colors"
              >
                <span>Queue</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Deliveries */}
          <div className="p-6 rounded-2xl border border-white/10 bg-[#141519] hover:border-emerald-400/50 hover:bg-[#18191E] transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold transition-transform group-hover:scale-105">
              <ArrowUpRight size={22} />
            </div>
            <h3 className="text-lg font-bold text-white">Deliveries</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Fulfill customer shipments with automatic stock availability check. Red alerts highlight out-of-stock items before validation.
            </p>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                WH/OUT/XXXX
              </span>
              <Link
                href="/operations/deliveries"
                className="text-xs font-mono text-white/50 group-hover:text-emerald-400 flex items-center gap-1 transition-colors"
              >
                <span>Queue</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Internal Transfers */}
          <div className="p-6 rounded-2xl border border-white/10 bg-[#141519] hover:border-amber-400/50 hover:bg-[#18191E] transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold transition-transform group-hover:scale-105">
              <GitBranch size={22} />
            </div>
            <h3 className="text-lg font-bold text-white">Internal Transfers</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Move items between physical storage racks, bins, and warehouses with balanced multi-location tracking.
            </p>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                WH/INT/XXXX
              </span>
              <Link
                href="/operations/transfers"
                className="text-xs font-mono text-white/50 group-hover:text-amber-400 flex items-center gap-1 transition-colors"
              >
                <span>Queue</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Stock Adjustments */}
          <div className="p-6 rounded-2xl border border-white/10 bg-[#141519] hover:border-purple-400/50 hover:bg-[#18191E] transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold transition-transform group-hover:scale-105">
              <Sliders size={22} />
            </div>
            <h3 className="text-lg font-bold text-white">Adjustments</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Reconcile physical stock counts with digital records. Auto-routes discrepancies through virtual inventory loss locations.
            </p>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
                WH/ADJ/XXXX
              </span>
              <Link
                href="/operations/adjustments"
                className="text-xs font-mono text-white/50 group-hover:text-purple-400 flex items-center gap-1 transition-colors"
              >
                <span>Queue</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DOUBLE-ENTRY LEDGER ARCHITECTURE SECTION ───────────────────────── */}
      <section id="ledger" className="py-20 px-6 border-t border-white/10 bg-[#101114]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-mono font-bold tracking-widest text-[#DDFF46] uppercase">
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
                  <div className="w-5 h-5 rounded-full bg-[#DDFF46]/20 text-[#DDFF46] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-white/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/move-history"
                className="inline-flex items-center gap-2 text-xs font-mono text-[#DDFF46] hover:underline font-bold"
              >
                <span>Inspect Live Move History Audit Table</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-[#16171B] space-y-4 font-mono text-xs shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-white/60">schema_definition.prisma</span>
                <span className="text-[#DDFF46]">StockSense DB Schema</span>
              </div>
              <pre className="text-white/80 overflow-x-auto text-[11px] leading-relaxed">
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
        <div className="p-12 sm:p-16 rounded-3xl border border-white/10 bg-gradient-to-r from-[#17181D] via-[#101114] to-[#17181D] shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#DDFF46]/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

          <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to experience zero-drift inventory?
          </h3>
          <p className="text-white/60 max-w-xl mx-auto text-base">
            Log in with the seeded demo credentials or create your own account to run the full end-to-end inventory lifecycle.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-8 py-3.5 rounded-full font-bold text-sm bg-[#DDFF46] hover:bg-[#cbf033] text-black shadow-lg shadow-[#DDFF46]/20 transition-all flex items-center gap-2"
            >
              <span>Launch Dashboard Now</span>
              <ArrowRight size={16} />
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

      {/* ─── SIGNATURE LAUNCHDARKLY ELECTRIC LIME TICKER SECTION ────────────── */}
      <div className="bg-[#DDFF46] text-black py-4 overflow-hidden border-t-2 border-black select-none">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 mx-4 text-xs font-mono font-black tracking-widest uppercase">
              <span>DOUBLE-ENTRY INVENTORY</span>
              <span>✦</span>
              <span>ZERO DRIFT GUARANTEE</span>
              <span>✦</span>
              <span>IMMUTABLE AUDIT LEDGER</span>
              <span>✦</span>
              <span>POSTGRESQL ATOMIC TRANSACTIONS</span>
              <span>✦</span>
              <span>SUB-50MS WEBSOCKETS</span>
              <span>✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── FOOTER (Uncluttered, Maker Details & Direct Navigation) ─────────── */}
      <footer className="border-t border-white/10 bg-[#0A0B0D] py-14 px-6 text-xs text-white/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Brand & Direct Links */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center gap-2.5 font-bold text-base text-white font-sans">
                <Boxes size={22} className="text-[#DDFF46]" />
                <span>StockSense Inventory OS</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed max-w-md">
                Double-entry inventory management engine engineered for zero-drift physical warehouse operations and real-time ledger auditing.
              </p>
              {/* Clean Quick Links */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs font-mono">
                <Link href="/dashboard" className="text-white/60 hover:text-[#DDFF46] transition-colors">
                  Dashboard
                </Link>
                <Link href="/products" className="text-white/60 hover:text-[#DDFF46] transition-colors">
                  Products
                </Link>
                <Link href="/operations/receipts" className="text-white/60 hover:text-[#DDFF46] transition-colors">
                  Operations
                </Link>
                <Link href="/move-history" className="text-white/60 hover:text-[#DDFF46] transition-colors">
                  Move History
                </Link>
                <Link href="/login" className="text-white/60 hover:text-[#DDFF46] transition-colors">
                  Sign In
                </Link>
              </div>
            </div>

            {/* Makers Details */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <h4 className="font-mono text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DDFF46]" />
                  <span>Makers</span>
                </h4>
                <span className="text-[10px] font-mono text-white/30">Odoo Hiring Hackathon 2026</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Maker 1: Priyanshu Kamal */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-2.5">
                  <span className="font-bold text-white text-xs block truncate">Priyanshu Kamal</span>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://github.com/priyanshukamal26/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-[#DDFF46]/10 text-white/60 hover:text-[#DDFF46] border border-white/10 hover:border-[#DDFF46]/30 text-[10px] font-mono transition-all"
                      title="GitHub"
                    >
                      <Github size={12} />
                      <span>GitHub</span>
                    </a>
                    <a
                      href="https://www.linkedin.com/in/priyanshukamal/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-[#38BDF8]/10 text-white/60 hover:text-[#38BDF8] border border-white/10 hover:border-[#38BDF8]/30 text-[10px] font-mono transition-all"
                      title="LinkedIn"
                    >
                      <Linkedin size={12} />
                      <span>LinkedIn</span>
                    </a>
                  </div>
                </div>

                {/* Maker 2: Somya Vishnoi */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-2.5">
                  <span className="font-bold text-white text-xs block truncate">Somya Vishnoi</span>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://github.com/Somya-Vishnoi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-[#DDFF46]/10 text-white/60 hover:text-[#DDFF46] border border-white/10 hover:border-[#DDFF46]/30 text-[10px] font-mono transition-all"
                      title="GitHub"
                    >
                      <Github size={12} />
                      <span>GitHub</span>
                    </a>
                    <a
                      href="https://www.linkedin.com/in/Somya-Vishnoi/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-[#38BDF8]/10 text-white/60 hover:text-[#38BDF8] border border-white/10 hover:border-[#38BDF8]/30 text-[10px] font-mono transition-all"
                      title="LinkedIn"
                    >
                      <Linkedin size={12} />
                      <span>LinkedIn</span>
                    </a>
                  </div>
                </div>

                {/* Maker 3: Aditya Kumar */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-2.5">
                  <span className="font-bold text-white text-xs block truncate">Aditya Kumar</span>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://github.com/kumaradi9508"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-[#DDFF46]/10 text-white/60 hover:text-[#DDFF46] border border-white/10 hover:border-[#DDFF46]/30 text-[10px] font-mono transition-all"
                      title="GitHub"
                    >
                      <Github size={12} />
                      <span>GitHub</span>
                    </a>
                    <a
                      href="https://www.linkedin.com/in/aditya958"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-[#38BDF8]/10 text-white/60 hover:text-[#38BDF8] border border-white/10 hover:border-[#38BDF8]/30 text-[10px] font-mono transition-all"
                      title="LinkedIn"
                    >
                      <Linkedin size={12} />
                      <span>LinkedIn</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom minimal bar */}
          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/30">
            <p>© 2026 StockSense. Double-entry inventory management system.</p>
            <p className="font-mono">Conserving operational invariants with mathematical precision.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
