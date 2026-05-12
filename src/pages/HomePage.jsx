import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronRight, PenLine, Sparkles } from "lucide-react"
import toast from "react-hot-toast"
import useAuthStore from "../store/useAuthStore"
import { historyApi } from "../lib/api"
import { AppLayout } from "../components/layout/AppLayout"
import { HealthGauge } from "../components/features/HealthGauge"
import { MetricCard } from "../components/features/MetricCard"
import { Badge } from "../components/ui/Badge"
import { Card } from "../components/ui/Card"
import { SkeletonCard } from "../components/ui/SkeletonCard"
import { Button } from "../components/ui/Button"
import { formatRupiah, formatDate, getStatusConfig } from "../lib/utils"

export default function HomePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [loading, setLoading] = useState(true)
  const [stats, setStats]     = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [statsRes, histRes] = await Promise.allSettled([
        historyApi.stats(),
        historyApi.list(5),
      ])
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data)
      if (histRes.status === "fulfilled") setHistory(histRes.value.data?.items || histRes.value.data || [])
    } catch (err) {
      toast.error("Gagal memuat data. Coba lagi nanti.")
    } finally {
      setLoading(false)
    }
  }

  const latest = history.length > 0 ? history[0] : null
  const hasData = !!latest
  const initials = (user?.business_name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <AppLayout>
      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* ── GREETING ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-poppins font-semibold text-xl text-text-primary">
              Halo, {user?.business_name || "Pebisnis"} 👋
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">Pantau kesehatan bisnismu</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-poppins font-bold text-sm">{initials}</span>
          </div>
        </div>

        {/* ── HEALTH CARD ── */}
        {loading ? (
          <SkeletonCard className="h-48" />
        ) : hasData ? (
          <HealthCard latest={latest} navigate={navigate} />
        ) : (
          <OnboardingCard navigate={navigate} />
        )}

        {/* ── QUICK STATS ── */}
        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {[1,2,3].map(i => <SkeletonCard key={i} className="min-w-[140px] flex-shrink-0" />)}
          </div>
        ) : hasData ? (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            <div className="min-w-[140px] flex-shrink-0">
              <MetricCard icon="💰" label="Pemasukan" value={latest.total_income} compact />
            </div>
            <div className="min-w-[140px] flex-shrink-0">
              <MetricCard icon="📤" label="Pengeluaran" value={latest.total_expense} compact color="text-danger" />
            </div>
            <div className="min-w-[140px] flex-shrink-0">
              <MetricCard icon="💵" label="Saldo" value={latest.current_balance || latest.cash_balance} compact
                color={(latest.current_balance || latest.cash_balance || 0) >= 0 ? "text-success" : "text-danger"} />
            </div>
          </div>
        ) : null}

        {/* ── PRIMARY ACTION ── */}
        <Button onClick={() => navigate("/input")}>
          <PenLine size={18} /> Catat Transaksi Sekarang
        </Button>

        {/* ── INSIGHT CARD ── */}
        {hasData && latest.anomalies && latest.anomalies.length > 0 && (
          <Card className="p-4 border-l-4 border-l-warning" onClick={() => navigate("/result")}>
            <div className="flex items-start gap-2">
              <span className="text-lg mt-0.5">💡</span>
              <div className="flex-1">
                <p className="text-sm text-text-primary font-medium leading-snug">
                  {latest.anomalies[0].description || latest.anomalies[0].category}
                </p>
                <p className="text-xs text-primary font-semibold mt-1 flex items-center gap-1">
                  Lihat detail <ChevronRight size={14} />
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ── RECENT HISTORY ── */}
        {history.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-poppins font-semibold text-base text-text-primary">Analisis Terakhir</h2>
              <button onClick={() => navigate("/history")} className="text-xs text-primary font-semibold flex items-center gap-0.5">
                Lihat semua <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {history.slice(0, 3).map((item, i) => (
                <HistoryItem key={i} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function HealthCard({ latest, navigate }) {
  const status = latest.health_status || latest.status || "SAFE"
  const score = latest.health_score || latest.score || 0
  const cfg = getStatusConfig(status)
  const runway = latest.runway_days || latest.runway_expected || 0
  const narrative = latest.executive_summary || latest.narrative || ""

  return (
    <Card
      className={`p-5 overflow-hidden relative ${cfg.bg} ${cfg.border} border-2 ${
        status === "DANGER" ? "animate-pulse-slow" : ""
      }`}
      onClick={() => navigate("/result")}
    >
      <div className="flex items-center gap-4">
        <HealthGauge score={score} status={status} size={110} />
        <div className="flex-1 min-w-0">
          <Badge status={status} />
          <p className="font-poppins font-bold text-2xl text-text-primary mt-2 leading-tight">
            Uang bertahan <span className="text-primary">{runway}</span> hari
          </p>
          {narrative && (
            <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">{narrative}</p>
          )}
          {status === "DANGER" && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate("/result") }}
              className="mt-3 w-full h-10 bg-danger text-white text-xs font-poppins
                         font-semibold rounded-lg flex items-center justify-center gap-1.5
                         active:scale-[0.98] transition-all"
            >
              🚨 Lihat Apa yang Harus Dilakukan Sekarang
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

function OnboardingCard({ navigate }) {
  return (
    <Card className="p-6 text-center overflow-hidden relative"
      style={{ background: "linear-gradient(160deg, #C0392B 0%, #922B21 100%)" }}>
      <div className="relative z-10">
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Sparkles size={28} className="text-white" />
        </div>
        <h2 className="font-poppins font-bold text-xl text-white">Mulai analisis pertamamu 🚀</h2>
        <p className="text-white/75 text-sm mt-1 mb-4">Ceritakan transaksi bisnis hari ini</p>
        <button
          onClick={() => navigate("/input")}
          className="w-full h-12 bg-white text-primary font-poppins font-semibold rounded-xl
                     transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Mulai Sekarang →
        </button>
      </div>
    </Card>
  )
}

function HistoryItem({ item }) {
  const status = item.health_status || item.status || "SAFE"
  const score  = item.health_score || item.score || 0
  const cfg    = getStatusConfig(status)
  const date   = formatDate(item.created_at || item.date)

  return (
    <Card className="p-3 flex items-center gap-3">
      <div className="text-center flex-shrink-0 w-12">
        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold ${cfg.pill}`}>
          {Math.round(score)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted">{date}</p>
        <p className="text-sm font-medium text-text-primary truncate">
          {formatRupiah(item.total_income, true)} masuk · {formatRupiah(item.total_expense, true)} keluar
        </p>
        {(item.runway_days || item.runway_expected) && (
          <p className="text-xs text-text-secondary">
            Bertahan {item.runway_days || item.runway_expected} hari
          </p>
        )}
      </div>
      <ChevronRight size={16} className="text-text-muted flex-shrink-0" />
    </Card>
  )
}
