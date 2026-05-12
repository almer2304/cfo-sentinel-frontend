import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import toast from "react-hot-toast"
import { historyApi } from "../lib/api"
import { AppLayout } from "../components/layout/AppLayout"
import { TopBar } from "../components/layout/TopBar"
import { Card } from "../components/ui/Card"
import { SkeletonCard } from "../components/ui/SkeletonCard"
import { Button } from "../components/ui/Button"
import { Badge } from "../components/ui/Badge"
import { formatRupiah, formatDate, getStatusConfig } from "../lib/utils"

export default function HistoryPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats]     = useState(null)
  const [items, setItems]     = useState([])

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [sRes, hRes] = await Promise.allSettled([
        historyApi.stats(),
        historyApi.list(20),
      ])
      if (sRes.status === "fulfilled") setStats(sRes.value.data)
      if (hRes.status === "fulfilled") setItems(hRes.value.data?.items || hRes.value.data || [])
    } catch {
      toast.error("Gagal memuat riwayat.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <TopBar title="📊 Riwayat Analisis" showBack={false} />
      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Stats summary */}
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

        {/* History list */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : items.length > 0 ? (
          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <HistoryItemCard key={i} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState navigate={navigate} />
        )}
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

function HistoryItemCard({ item }) {
  const status = item.health_status || item.status || "SAFE"
  const score  = item.health_score || item.score || 0
  const date   = formatDate(item.created_at || item.date)
  const dateObj = new Date(item.created_at || item.date)
  const day    = dateObj.getDate()
  const month  = dateObj.toLocaleDateString("id-ID", { month: "short" })
  const runway = item.runway_days || item.runway_expected || 0
  const narrative = item.executive_summary || item.narrative || ""

  return (
    <Card className="p-3 flex items-center gap-3">
      <div className="text-center flex-shrink-0 w-12">
        <p className="font-poppins font-bold text-lg text-text-primary leading-none">{day}</p>
        <p className="text-xs text-text-muted uppercase">{month}</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Badge status={status} />
        </div>
        <p className="text-xs text-text-secondary">
          {formatRupiah(item.total_income, true)} masuk · {formatRupiah(item.total_expense, true)} keluar
        </p>
        {runway > 0 && (
          <p className="text-xs text-text-muted">Bertahan {runway} hari</p>
        )}
        {narrative && (
          <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{narrative}</p>
        )}
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
      <p className="text-sm text-text-muted mb-6">
        Mulai catat transaksi pertamamu
      </p>
      <div className="w-48">
        <Button onClick={() => navigate("/input")}>Catat Sekarang</Button>
      </div>
    </div>
  )
}
