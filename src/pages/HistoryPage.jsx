import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronRight, Edit3, Plus } from "lucide-react"
import toast from "react-hot-toast"
import { historyApi, txApi } from "../lib/api"
import { AppLayout } from "../components/layout/AppLayout"
import { TopBar } from "../components/layout/TopBar"
import { Card } from "../components/ui/Card"
import { SkeletonCard } from "../components/ui/SkeletonCard"
import { Button } from "../components/ui/Button"
import { Badge } from "../components/ui/Badge"
import { formatRupiah, formatDate, getStatusConfig } from "../lib/utils"

export default function HistoryPage() {
  const navigate = useNavigate()
  const [loading, setLoading]       = useState(true)
  const [stats, setStats]           = useState(null)
  const [items, setItems]           = useState([])     // analisis v1
  const [txItems, setTxItems]       = useState([])     // transaksi kasir v2
  const [selected, setSelected]     = useState(null)
  const [tab, setTab]               = useState("transaksi") // "transaksi" | "analisis"

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [sRes, hRes, txRes] = await Promise.allSettled([
        historyApi.stats(),
        historyApi.list(20),
        txApi.list({ limit: 50 }),
      ])
      if (sRes.status === "fulfilled") setStats(sRes.value.data)
      if (hRes.status === "fulfilled") setItems(hRes.value.data?.items || hRes.value.data || [])
      if (txRes.status === "fulfilled") {
        const d = txRes.value.data?.data || txRes.value.data
        setTxItems(d?.items || d?.transactions || Array.isArray(d) ? d : [])
      }
    } catch {
      toast.error("Gagal memuat riwayat.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout topbar={<TopBar title="📋 Riwayat" showBack={false} />}>
      <div className="px-4 py-4 flex flex-col gap-4">

        {/* ── Tab Switch ── */}
        <div className="flex bg-surface border border-border rounded-xl p-1 gap-1">
          <button
            onClick={() => setTab("transaksi")}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === "transaksi"
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-muted"
            }`}
          >
            ⚡ Transaksi Kasir
          </button>
          <button
            onClick={() => setTab("analisis")}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === "analisis"
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-muted"
            }`}
          >
            📊 Analisis AI
          </button>
        </div>

        {/* ── TAB: Transaksi Kasir (v2) ── */}
        {tab === "transaksi" && (
          <>
            <button
              onClick={() => navigate("/input")}
              className="w-full h-12 bg-primary text-white rounded-xl text-sm font-semibold
                         flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Plus size={18} /> Catat Transaksi Baru
            </button>

            {loading ? (
              <div className="flex flex-col gap-2">
                {[1,2,3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : txItems.length > 0 ? (
              <div className="flex flex-col gap-2">
                {txItems.map((tx, i) => (
                  <TransactionCard
                    key={tx.transaction_code || i}
                    tx={tx}
                    onEdit={(code) => navigate(`/input?edit=${code}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-5xl mb-3">⚡</span>
                <p className="font-poppins font-semibold text-text-primary mb-1">Belum ada transaksi kasir</p>
                <p className="text-sm text-text-muted mb-4">Mulai catat transaksi satu per satu</p>
                <div className="w-48">
                  <Button onClick={() => navigate("/input")}>Catat Sekarang</Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── TAB: Analisis AI (v1) ── */}
        {tab === "analisis" && (
          <>
            {loading ? (
              <SkeletonCard />
            ) : stats ? (
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Total Analisis" value={stats.data?.total_sessions || stats.total_sessions || 0} />
                <StatBox label="Rata-rata Skor" value={Math.round(stats.data?.avg_health || stats.avg_health || stats.avg_score || 0)} />
                <StatBox label="Skor Terbaik" value={Math.round(stats.data?.best_health || stats.best_health || 0)} color="text-success" />
                <StatBox label="Skor Terendah" value={Math.round(stats.data?.worst_health || stats.worst_health || 0)} color="text-danger" />
              </div>
            ) : null}

            {loading ? (
              <div className="flex flex-col gap-2">
                {[1,2,3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : items.length > 0 ? (
              <div className="flex flex-col gap-2">
                {items.map((item, i) => (
                  <HistoryItemCard key={i} item={item} onSelect={setSelected} />
                ))}
              </div>
            ) : (
              <EmptyState navigate={navigate} />
            )}
          </>
        )}

        <HistoryDetailDrawer item={selected} onClose={() => setSelected(null)} />
      </div>
    </AppLayout>
  )
}

function StatBox({ label, value, color = "text-text-primary" }) {
  return (
    <Card className="p-3 text-center">
      <p className="text-xs text-text-muted font-inter">{label}</p>
      <p className={`font-mono-num font-bold text-xl mt-0.5 ${color}`}>{value}</p>
    </Card>
  )
}

// ── Kartu transaksi kasir (v2) ────────────────────────────────────────────────
function TransactionCard({ tx, onEdit }) {
  const isIncome = tx.type === "income"
  const dateStr  = tx.datetime_wib
    ? new Date(tx.datetime_wib).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
    : ""
  const timeStr  = tx.datetime_wib
    ? new Date(tx.datetime_wib).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : ""

  return (
    <Card className="p-3 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        isIncome ? "bg-green-100" : "bg-red-100"
      }`}>
        <span className="text-lg">{isIncome ? "💰" : "💸"}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{tx.description}</p>
            <p className="text-xs text-text-muted">{tx.category || "–"} · {dateStr} {timeStr}</p>
          </div>
          <p className={`font-mono-num font-bold text-sm flex-shrink-0 ${isIncome ? "text-success" : "text-danger"}`}>
            {isIncome ? "+" : "-"}{formatRupiah(tx.amount, true)}
          </p>
        </div>

        {tx.transaction_code && (
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-text-muted font-mono bg-gray-100 px-2 py-0.5 rounded">
              {tx.transaction_code}
            </span>
            <button
              onClick={() => onEdit(tx.transaction_code)}
              className="flex items-center gap-1 text-[10px] text-primary font-semibold
                         bg-primary/10 px-2 py-0.5 rounded-md hover:bg-primary/20 transition-all"
            >
              <Edit3 size={10} /> Edit
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}

// ── Kartu analisis harian (v1) ────────────────────────────────────────────────
function HistoryItemCard({ item, onSelect }) {
  const status    = item.health_status || item.status || "SAFE"
  const score     = item.health_score  || item.score  || 0
  const dateObj   = new Date(item.created_at || item.date)
  const day       = dateObj.getDate()
  const month     = dateObj.toLocaleDateString("id-ID", { month: "short" })
  const runway    = item.runway_days || item.runway_expected || 0
  const narrative = item.executive_summary || item.narrative || ""

  return (
    <Card className="p-3 flex items-center gap-3 cursor-pointer active:scale-[0.99]"
      onClick={() => onSelect(item)}>
      <div className="text-center flex-shrink-0 w-12">
        <p className="font-poppins font-bold text-lg text-text-primary leading-none">{day}</p>
        <p className="text-xs text-text-muted uppercase">{month}</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Badge status={status} />
          <span className="font-mono-num font-bold text-sm text-text-primary">{Math.round(score)}</span>
        </div>
        <p className="text-xs text-text-secondary">
          {formatRupiah(item.total_income, true)} masuk · {formatRupiah(item.total_expense, true)} keluar
        </p>
        {runway > 0 && (
          <p className="text-xs text-text-muted">Bertahan {Math.round(runway)} hari</p>
        )}
        {narrative && (
          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{narrative}</p>
        )}
        <p className="text-[10px] text-primary font-medium mt-1.5">Lihat selengkapnya →</p>
      </div>
      <ChevronRight size={16} className="text-text-muted flex-shrink-0" />
    </Card>
  )
}

function EmptyState({ navigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-6xl mb-4">📊</span>
      <h3 className="font-poppins font-semibold text-lg text-text-primary mb-1">
        Belum ada riwayat analisis
      </h3>
      <p className="text-sm text-text-muted mb-6">Mulai catat transaksi pertamamu</p>
      <div className="w-48">
        <Button onClick={() => navigate("/input")}>Catat Sekarang</Button>
      </div>
    </div>
  )
}

function HistoryDetailDrawer({ item, onClose }) {
  if (!item) return null
  const status = item.health_status || "SAFE"
  const cfg    = getStatusConfig(status)

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-[480px] mx-auto bg-white rounded-t-3xl
                      max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="px-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-poppins font-bold text-lg">Detail Analisis</h2>
            <span className="text-sm text-text-muted">
              {formatDate(item.created_at || item.date)}
            </span>
          </div>

          <div className={`p-4 rounded-2xl mb-4 ${cfg.bg} border ${cfg.border}`}>
            <div className="flex items-center gap-3">
              <span className={`font-mono-num font-bold text-3xl ${cfg.text}`}>
                {Math.round(item.health_score || item.score || 0)}
              </span>
              <div>
                <Badge status={status} />
                <p className="text-xs text-text-muted mt-1">dari 100</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="card p-3">
              <p className="text-xs text-text-muted">Pemasukan</p>
              <p className="font-mono-num font-bold text-base text-success">
                {formatRupiah(item.total_income, true)}
              </p>
            </div>
            <div className="card p-3">
              <p className="text-xs text-text-muted">Pengeluaran</p>
              <p className="font-mono-num font-bold text-base text-danger">
                {formatRupiah(item.total_expense, true)}
              </p>
            </div>
            <div className="card p-3">
              <p className="text-xs text-text-muted">Uang Bertahan</p>
              <p className="font-mono-num font-bold text-base text-text-primary">
                {Math.round(item.runway_days || item.runway_expected || 0)} hari
              </p>
            </div>
            <div className="card p-3">
              <p className="text-xs text-text-muted">Sisa Bersih</p>
              <p className={`font-mono-num font-bold text-base ${
                (item.net_cashflow || 0) >= 0 ? "text-success" : "text-danger"
              }`}>
                {formatRupiah(item.net_cashflow, true)}
              </p>
            </div>
          </div>

          {(item.narrative || item.executive_summary) && (
            <div className="card p-4 border-l-4 border-l-primary mb-4">
              <p className="text-xs font-semibold text-primary mb-1">🤖 Analisis AI</p>
              <p className="text-sm text-text-primary leading-relaxed">
                {item.narrative || item.executive_summary}
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full h-12 bg-primary text-white font-poppins font-semibold
                       rounded-xl active:scale-[0.98] transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
