import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  ChevronRight, Plus, RefreshCw, AlertTriangle,
  TrendingUp, TrendingDown, Activity, X,
} from "lucide-react"
import toast from "react-hot-toast"
import useAuthStore from "../store/useAuthStore"
import { dashboardApi } from "../lib/api"
import { AppLayout } from "../components/layout/AppLayout"
import { HealthGauge } from "../components/features/HealthGauge"
import { SkeletonCard } from "../components/ui/SkeletonCard"
import { formatRupiah, getStatusConfig } from "../lib/utils"

export default function HomePage() {
  const navigate = useNavigate()
  const user     = useAuthStore((s) => s.user)

  const [loading,       setLoading]       = useState(true)
  const [refreshing,    setRefreshing]    = useState(false)
  const [dashboard,     setDashboard]     = useState(null)
  const [showAnalysis,  setShowAnalysis]  = useState(false) // ← drawer full analisis

  const initials = (user?.business_name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else         setRefreshing(true)
    try {
      const res = await dashboardApi.get()
      setDashboard(res.data?.data)
    } catch (err) {
      if (!silent) toast.error("Gagal memuat dashboard.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const score      = dashboard?.health?.score      ?? 0
  const status     = dashboard?.health?.status     ?? "SAFE"
  const trend      = dashboard?.health?.trend      ?? "STABLE"
  const metrics    = dashboard?.metrics            ?? {}
  const rawNarrative = dashboard?.narrative ?? ""
  const narrative = (() => {
    if (typeof rawNarrative !== "string") return ""
    const trimmed = rawNarrative.trim()
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed)
        return parsed.narrative || parsed.agent_narrative || ""
      } catch {
        return ""
      }
    }
    return trimmed
  })()
  const anomalies  = dashboard?.anomalies          ?? []
  const hasCrit    = dashboard?.has_critical       ?? false
  const anomCount  = dashboard?.anomaly_count      ?? 0
  const cfg        = getStatusConfig(status)

  return (
    <AppLayout
      topbar={
        <div className="bg-white border-b border-border px-4 py-3 flex items-center justify-between z-10 relative shadow-sm">
          <div>
            <h1 className="font-poppins font-semibold text-xl text-text-primary">
              Halo, {user?.business_name || "Pebisnis"} 👋
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">Dashboard Keuangan</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center transition-all active:scale-95"
            >
              <RefreshCw size={16} className={`text-text-muted ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-white font-poppins font-bold text-sm">{initials}</span>
            </div>
          </div>
        </div>
      }
    >
      <div className="px-4 pt-4 flex flex-col gap-4 pb-24">

        {/* ── HEALTH CARD (clickable → full analisis) ─────────── */}
        {loading ? (
          <SkeletonCard className="h-48" />
        ) : !dashboard ? (
          <OnboardingCard navigate={navigate} />
        ) : (
          <button
            onClick={() => setShowAnalysis(true)}
            className={`card p-5 overflow-hidden relative border-2 ${cfg.border} ${cfg.bg} ${
              status === "DANGER" ? "animate-pulse-slow" : ""
            } w-full text-left transition-all active:scale-[0.98]`}
          >
            <div className="flex items-center gap-4">
              <HealthGauge score={score} status={status} size={110} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.pill}`}>
                    {status === "SAFE" ? "✅ AMAN" : status === "WARNING" ? "⚠️ WASPADA" : "🚨 BAHAYA"}
                  </span>
                  <TrendIcon trend={trend} />
                </div>
                <p className="font-poppins font-bold text-base text-text-primary leading-snug mt-1">
                  {metrics.runway_days > 90
                    ? <>Kas <span className="text-success">Stabil</span></>
                    : metrics.runway_days > 0
                      ? <>Kas tahan <span className="text-primary">{Math.round(metrics.runway_days)}</span> hari</>
                      : <>Mulai pantau bisnismu</>
                  }
                </p>
                {narrative && (
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                    {narrative}
                  </p>
                )}
                {/* Hint tap to expand */}
                <p className="text-[10px] text-primary font-semibold mt-2 flex items-center gap-1">
                  🤖 Lihat analisis lengkap <ChevronRight size={11} />
                </p>
              </div>
            </div>
          </button>
        )}

        {/* ── QUICK METRICS ────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3].map(i => <SkeletonCard key={i} className="h-20" />)}
          </div>
        ) : dashboard && (
          <div className="grid grid-cols-3 gap-2">
            <MetricTile
              label="Pemasukan"
              value={metrics.total_income}
              color="text-success"
              icon="💰"
            />
            <MetricTile
              label="Pengeluaran"
              value={metrics.total_expense}
              color="text-danger"
              icon="📤"
            />
            <MetricTile
              label="Saldo Kas"
              value={metrics.cash_balance}
              color={(metrics.cash_balance ?? 0) >= 0 ? "text-success" : "text-danger"}
              icon="💵"
            />
          </div>
        )}

        {/* ── TOMBOL CATAT ─────────────────────────────────── */}
        <button
          onClick={() => navigate("/input")}
          className="w-full h-14 bg-primary text-white rounded-2xl flex items-center justify-center
                     gap-2 font-poppins font-semibold text-base shadow-lg shadow-primary/30
                     transition-all active:scale-[0.97]"
        >
          <Plus size={20} /> Catat Transaksi
        </button>

        {/* ── ANOMALI ALERT ─────────────────────────────────── */}
        {!loading && anomCount > 0 && (
          <button
            onClick={() => navigate("/chat")}
            className={`w-full card p-4 text-left transition-all active:scale-[0.98] border-l-4 ${
              hasCrit ? "border-l-danger" : "border-l-warning"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{hasCrit ? "🚨" : "⚠️"}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  {anomCount} anomali terdeteksi
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {anomalies[0]?.description || "Ada pengeluaran yang tidak biasa bulan ini."}
                </p>
                <p className="text-xs text-primary font-semibold mt-1.5 flex items-center gap-1">
                  Tanya CFO AI <ChevronRight size={13} />
                </p>
              </div>
            </div>
          </button>
        )}

        {/* ── BURN RATE & RUNWAY ────────────────────────────── */}
        {!loading && dashboard && (
          <div className="card p-4">
            <h2 className="text-sm font-poppins font-semibold text-text-primary mb-3">
              ⚡ Kecepatan Bakar Uang
            </h2>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-xs text-text-muted mb-1">Per hari</p>
                <p className="text-base font-bold text-danger">
                  {metrics.burn_rate_daily > 0 ? formatRupiah(metrics.burn_rate_daily, true) : "–"}
                </p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center flex-1">
                <p className="text-xs text-text-muted mb-1">Tahan sampai</p>
                <p className={`text-base font-bold ${
                  (metrics.runway_days ?? 0) > 30 ? "text-success" : "text-danger"
                }`}>
                  {metrics.runway_days > 0 && metrics.runway_days < 365 ? `${Math.round(metrics.runway_days)} hari` : "–"}
                </p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center flex-1">
                <p className="text-xs text-text-muted mb-1">Arus Kas</p>
                <p className={`text-base font-bold ${
                  (metrics.net_cashflow ?? 0) >= 0 ? "text-success" : "text-danger"
                }`}>
                  {(metrics.net_cashflow ?? 0) >= 0 ? "+" : ""}
                  {formatRupiah(metrics.net_cashflow ?? 0, true)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── TOMBOL CHAT ───────────────────────────────────── */}
        {!loading && (
          <button
            onClick={() => navigate("/chat")}
            className="w-full h-12 border-2 border-primary/30 rounded-2xl flex items-center
                       justify-center gap-2 text-primary font-semibold text-sm
                       hover:border-primary hover:bg-primary/5 transition-all active:scale-[0.97]"
          >
            <Activity size={16} /> Tanya CFO AI
          </button>
        )}

      </div>

      {/* ── FULL ANALISIS DRAWER ─────────────────────────────── */}
      {showAnalysis && dashboard && (
        <FullAnalysisDrawer
          dashboard={dashboard}
          score={score}
          status={status}
          narrative={narrative}
          metrics={metrics}
          anomalies={anomalies}
          cfg={cfg}
          onClose={() => setShowAnalysis(false)}
          onChat={() => { setShowAnalysis(false); navigate("/chat") }}
        />
      )}
    </AppLayout>
  )
}

// ─── Full Analisis Drawer ─────────────────────────────────────────────────────
function FullAnalysisDrawer({ dashboard, score, status, narrative, metrics, anomalies, cfg, onClose, onChat }) {
  const healthHistory = dashboard?.health_history ?? []
  const lastUpdated   = dashboard?.last_updated ?? ""

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-[480px] mx-auto bg-white rounded-t-3xl
                      max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="font-poppins font-bold text-lg text-text-primary">🤖 Analisis AI Lengkap</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X size={16} className="text-text-muted" />
          </button>
        </div>

        <div className="px-5 pb-8 pt-4 flex flex-col gap-4">

          {/* Health Score Card */}
          <div className={`p-4 rounded-2xl border-2 ${cfg.border} ${cfg.bg}`}>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className={`font-mono-num font-bold text-4xl ${cfg.text}`}>{Math.round(score)}</p>
                <p className="text-xs text-text-muted">dari 100</p>
              </div>
              <div>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${cfg.pill} block mb-1`}>
                  {status === "SAFE" ? "✅ BISNIS SEHAT" : status === "WARNING" ? "⚠️ PERLU PERHATIAN" : "🚨 KONDISI KRITIS"}
                </span>
                {lastUpdated && (
                  <p className="text-xs text-text-muted">
                    Dianalisis: {new Date(lastUpdated).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* AI Narrative */}
          {narrative && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1.5">
                🤖 Narasi CFO AI
              </p>
              <p className="text-sm text-text-primary leading-relaxed">{narrative}</p>
            </div>
          )}

          {/* Metrics Grid */}
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Ringkasan Hari Ini</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="card p-3">
                <p className="text-xs text-text-muted">💰 Pemasukan</p>
                <p className="font-mono-num font-bold text-success">{formatRupiah(metrics.total_income, true)}</p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-text-muted">📤 Pengeluaran</p>
                <p className="font-mono-num font-bold text-danger">{formatRupiah(metrics.total_expense, true)}</p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-text-muted">⚡ Burn Rate/Hari</p>
                <p className="font-mono-num font-bold text-text-primary">
                  {metrics.burn_rate_daily > 0 ? formatRupiah(metrics.burn_rate_daily, true) : "–"}
                </p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-text-muted">🏃 Kas Tahan</p>
                <p className={`font-mono-num font-bold ${(metrics.runway_days ?? 0) > 30 ? "text-success" : "text-danger"}`}>
                  {metrics.runway_days > 0 && metrics.runway_days < 999 ? `${Math.round(metrics.runway_days)} hari` : "–"}
                </p>
              </div>
            </div>
          </div>

          {/* Anomali List */}
          {anomalies.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                ⚠️ Anomali Terdeteksi ({anomalies.length})
              </p>
              <div className="flex flex-col gap-2">
                {anomalies.map((a, i) => (
                  <div key={i} className={`card p-3 border-l-4 ${
                    a.severity === "HIGH" ? "border-l-danger" : "border-l-warning"
                  }`}>
                    <p className="text-xs font-semibold text-text-primary">{a.category}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{a.description}</p>
                    {a.suggested_action && (
                      <p className="text-xs text-primary font-medium mt-1">💡 {a.suggested_action}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health History Mini Chart */}
          {healthHistory.length > 1 && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                📈 Tren 7 Hari Terakhir
              </p>
              <div className="flex items-end gap-1.5 h-16 card p-3">
                {healthHistory.slice(0, 7).reverse().map((h, i) => {
                  const s = Math.max(h.health_score || 0, 5)
                  const color = s >= 65 ? "bg-success" : s >= 40 ? "bg-warning" : "bg-danger"
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className={`w-full rounded-sm ${color} transition-all`}
                        style={{ height: `${Math.min(s, 100)}%` }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-1">
            <button
              onClick={onChat}
              className="flex-1 h-12 bg-primary text-white rounded-xl font-poppins font-semibold text-sm
                         flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Activity size={16} /> Tanya CFO AI
            </button>
            <button
              onClick={onClose}
              className="h-12 px-5 border-2 border-border rounded-xl font-semibold text-sm
                         text-text-secondary active:scale-[0.98] transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TrendIcon({ trend }) {
  if (trend === "UP")   return <TrendingUp size={14} className="text-success" />
  if (trend === "DOWN") return <TrendingDown size={14} className="text-danger" />
  return null
}

function MetricTile({ label, value, color, icon }) {
  return (
    <div className="card p-3 flex flex-col items-center text-center gap-1">
      <span className="text-xl">{icon}</span>
      <p className={`text-sm font-bold leading-tight ${color}`}>
        {formatRupiah(value ?? 0, true)}
      </p>
      <p className="text-[10px] text-text-muted leading-tight">{label}</p>
    </div>
  )
}

function OnboardingCard({ navigate }) {
  return (
    <div
      className="card p-6 text-center overflow-hidden relative"
      style={{ background: "linear-gradient(160deg, #C0392B 0%, #922B21 100%)" }}
    >
      <div className="relative z-10">
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <AlertTriangle size={28} className="text-white" />
        </div>
        <h2 className="font-poppins font-bold text-xl text-white">
          Mulai catat transaksi pertamamu 🚀
        </h2>
        <p className="text-white/75 text-sm mt-1 mb-4">
          AI akan menganalisis kesehatan bisnismu secara otomatis
        </p>
        <button
          onClick={() => navigate("/input")}
          className="w-full h-12 bg-white text-primary font-poppins font-semibold rounded-xl
                     transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Catat Sekarang →
        </button>
      </div>
    </div>
  )
}
