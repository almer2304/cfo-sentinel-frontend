import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { MessageCircle, FileText, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import useAnalysisStore from "../store/useAnalysisStore"
import { AppLayout } from "../components/layout/AppLayout"
import { TopBar } from "../components/layout/TopBar"
import { HealthGauge } from "../components/features/HealthGauge"
import { MetricCard } from "../components/features/MetricCard"
import { ForecastChart } from "../components/features/ForecastChart"
import { AgentLog } from "../components/features/AgentLog"
import { Badge } from "../components/ui/Badge"
import { Card } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { getStatusConfig, getUrgencyConfig, getSeverityConfig, formatRupiah } from "../lib/utils"

export default function ResultPage() {
  const navigate = useNavigate()
  const result   = useAnalysisStore((s) => s.result)

  useEffect(() => {
    if (!result) navigate("/input", { replace: true })
  }, [result, navigate])

  if (!result) return null

  const data = result.result || result
  const health   = data.health_score || data.health_metrics || data.health || {}
  const status   = health.health_status || health.status || data.health_status || "SAFE"
  const score    = health.current || health.health_score || health.score || 0
  const metrics  = data.financial_metrics || data.metrics || {}
  const actions  = data.action_items || []
  const anomalies = data.anomalies || []
  const scenario = data.scenarios?.[0] || data.scenario || null
  const forecast = data.forecast_30d || data.forecast?.daily_forecast || data.forecast || []
  const agentLogs = data.agent_logs || data.pipeline_log || []
  const execSummary = data.executive_summary || ""
  const detailedAdvice = data.detailed_advice || ""
  const uncertainty = data.uncertainty_statement || ""
  const earlyWarning = data.early_warning || null
  const hasEarlyWarning = earlyWarning?.has_warning || data.has_early_warning || false

  return (
    <AppLayout
      topbar={
        <TopBar title="Hasil Analisis" right={
          <button onClick={() => navigate("/input")} className="text-xs text-primary font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-light transition-all">
            Analisis Lagi
          </button>
        } />
      }
    >

      <div className="px-4 py-4 flex flex-col gap-4">
        <AlertBanner hasWarning={hasEarlyWarning} earlyWarning={earlyWarning} status={status} />
        <ExecSummaryCard text={execSummary} />
        {actions.length > 0 && <ActionItems items={actions} />}
        <HealthSection score={score} status={status} metrics={metrics} health={health} />
        <AdvancedDetails
          anomalies={anomalies}
          scenario={scenario}
          forecast={forecast}
          agentLogs={agentLogs}
          detailedAdvice={detailedAdvice}
          uncertainty={uncertainty}
        />
        <ActionButtons navigate={navigate} />
      </div>
    </AppLayout>
  )
}

function AlertBanner({ hasWarning, earlyWarning, status }) {
  if (hasWarning) {
    return (
      <div className="bg-danger rounded-xl p-4 text-white animate-slide-up">
        <p className="font-poppins font-semibold text-sm">⚠️ {earlyWarning?.message || "Perhatian! Ada potensi masalah keuangan."}</p>
      </div>
    )
  }
  if (status === "SAFE") {
    return (
      <div className="bg-success-light border border-success/30 rounded-xl p-4 animate-slide-up">
        <p className="font-poppins font-semibold text-sm text-success">✅ Kondisi Keuangan Baik</p>
      </div>
    )
  }
  return null
}

function ExecSummaryCard({ text }) {
  if (!text) return null
  return (
    <Card className="p-4 border-l-4 border-l-primary animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm">🛡️</span>
        </div>
        <p className="text-sm text-text-primary leading-relaxed font-inter">{text}</p>
      </div>
    </Card>
  )
}

function HealthSection({ score, status, metrics, health }) {
  const runway = health.runway_expected || health.runway_days || metrics.runway_expected || 0
  const margin = health.gross_margin || metrics.gross_margin || 0
  const totalIncome = metrics.total_income || health.total_income || 0
  const totalExpense = metrics.total_expense || health.total_expense || 0
  const cashBalance = health.cash_balance || metrics.cash_balance || 0
  const netFlow = totalIncome - totalExpense

  // Build a context-aware runway explanation
  function getRunwayDisplay() {
    const runwayNum = Math.round(Number(runway) || 0)

    // Case 1: Runway absurdly high (>90 days from a daily snapshot) — likely misleading
    if (runwayNum > 90) {
      return {
        value: "Stabil",
        color: "text-success",
        explanation: `Pemasukan hari ini lebih besar dari pengeluaran (surplus ${formatRupiah(netFlow)}). Kondisi kas cukup sehat untuk saat ini.`
      }
    }

    // Case 2: Net positive but moderate runway
    if (netFlow > 0 && runwayNum > 30) {
      return {
        value: `${runwayNum} hari`,
        color: "text-success",
        explanation: `Berdasarkan rata-rata pengeluaran, saldo kas kamu diperkirakan bisa bertahan sekitar ${runwayNum} hari. Ini estimasi kasar — pantau terus ya!`
      }
    }

    // Case 3: Moderate runway (7-30 days)
    if (runwayNum >= 7) {
      return {
        value: `${runwayNum} hari`,
        color: "text-warning",
        explanation: `Jika pengeluaran harian rata-rata tetap seperti ini, saldo kas bisa bertahan sekitar ${runwayNum} hari. Pertimbangkan untuk mengurangi pengeluaran non-esensial.`
      }
    }

    // Case 4: Critical (<7 days)
    if (runwayNum > 0) {
      return {
        value: `${runwayNum} hari`,
        color: "text-danger",
        explanation: `⚠️ Perhatian! Dengan laju pengeluaran saat ini, saldo kas hanya cukup untuk sekitar ${runwayNum} hari. Segera evaluasi pengeluaran dan cari sumber pemasukan tambahan.`
      }
    }

    // Case 5: Zero or negative — no data or already deficit
    return {
      value: netFlow >= 0 ? "Stabil" : "Defisit",
      color: netFlow >= 0 ? "text-success" : "text-danger",
      explanation: netFlow >= 0
        ? "Data transaksi belum cukup untuk menghitung estimasi. Terus catat transaksi harian agar prediksi semakin akurat."
        : `Pengeluaran (${formatRupiah(totalExpense)}) lebih besar dari pemasukan (${formatRupiah(totalIncome)}). Segera cari cara menambah pemasukan atau kurangi pengeluaran.`
    }
  }

  const runwayInfo = getRunwayDisplay()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 justify-center">
        <HealthGauge score={score} status={status} size={120} />
        <div><Badge status={status} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard icon="💰" label="Pemasukan" value={metrics.total_income || health.total_income} compact />
        <MetricCard icon="📤" label="Pengeluaran" value={metrics.total_expense || health.total_expense} compact color="text-danger" />
        <MetricCard icon="⏰" label="Ketahanan Kas" value={runwayInfo.value} isRupiah={false} color={runwayInfo.color} />
        <MetricCard icon="📈" label="Efisiensi" value={`${Math.round(margin)}%`} isRupiah={false} color={margin >= 50 ? "text-success" : "text-warning"} />
      </div>
      {/* Contextual runway explanation */}
      <div className="bg-white border border-border rounded-xl p-3 flex items-start gap-2">
        <span className="text-sm mt-0.5 flex-shrink-0">💡</span>
        <p className="text-xs text-text-secondary leading-relaxed">
          {runwayInfo.explanation}
        </p>
      </div>
    </div>
  )
}

function ActionItems({ items }) {
  return (
    <div>
      <h3 className="font-poppins font-semibold text-base text-text-primary mb-2">Yang Perlu Kamu Lakukan:</h3>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const urg = getUrgencyConfig(item.urgency)
          return (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg font-bold text-primary mt-0.5">{item.priority || i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${urg.bg} ${urg.color}`}>{urg.label}</span>
                  </div>
                  <p className="font-poppins font-semibold text-sm text-text-primary">{item.title}</p>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">{item.description}</p>
                  {item.estimated_impact && (
                    <p className="text-xs text-success font-medium mt-1">💰 {item.estimated_impact}</p>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function AnomalySection({ items }) {
  return (
    <div>
      <h3 className="font-poppins font-semibold text-base text-text-primary mb-2">
        Pengeluaran Tidak Biasa ({items.length}):
      </h3>
      <div className="flex flex-col gap-2">
        {items.map((a, i) => {
          const sev = getSeverityConfig(a.severity)
          return (
            <Card key={i} className="p-3">
              <div className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${sev.dot}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${sev.color}`}>{sev.label}</span>
                    <span className="text-xs text-text-muted">• {a.category}</span>
                  </div>
                  <p className="text-sm text-text-primary mt-0.5">{a.description}</p>
                  {(a.deviation_pct || a.deviation_percentage) && (
                    <p className="text-xs text-warning mt-0.5">
                      {(a.deviation_pct || a.deviation_percentage) > 0 ? "+" : ""}
                      {Math.round(a.deviation_pct || a.deviation_percentage)}% dari biasanya
                    </p>
                  )}
                  {a.suggested_action && (
                    <p className="text-xs text-primary mt-1">💡 {a.suggested_action}</p>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function ScenarioSection({ scenario }) {
  const [open, setOpen] = useState(false)
  if (!scenario) return null

  // chain_of_consequences bisa string atau array — handle keduanya
  const consequences = Array.isArray(scenario.chain_of_consequences)
    ? scenario.chain_of_consequences
    : scenario.chain_of_consequences
      ? [scenario.chain_of_consequences]
      : []

  // mitigation_steps bisa string atau array — handle keduanya
  const mitigations = Array.isArray(scenario.mitigation_steps)
    ? scenario.mitigation_steps
    : scenario.mitigation_steps
      ? [scenario.mitigation_steps]
      : []

  return (
    <Card className="overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <div>
          <span className="font-poppins font-semibold text-sm text-text-primary">
            📊 Bagaimana jika penjualan turun 20%?
          </span>
          {scenario.new_runway_expected != null && (
            <p className="text-xs text-text-muted mt-0.5">
              Runway berubah jadi {scenario.new_runway_expected} hari
            </p>
          )}
        </div>
        {open
          ? <ChevronUp size={16} className="text-text-muted" />
          : <ChevronDown size={16} className="text-text-muted" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border pt-3 animate-fade-in flex flex-col gap-3">
          {consequences.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                Yang Akan Terjadi:
              </p>
              {consequences.map((c, i) => (
                <p key={i} className="text-xs text-text-secondary mb-1">• {c}</p>
              ))}
            </div>
          )}
          {mitigations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                Langkah Mitigasi:
              </p>
              {mitigations.map((m, i) => (
                <p key={i} className="text-xs text-success mb-1">✅ {m}</p>
              ))}
            </div>
          )}
          {scenario.total_cuttable_amount > 0 && (
            <div className="bg-success-light rounded-lg p-3">
              <p className="text-xs font-semibold text-success">
                💰 Total biaya yang bisa dipotong:{" "}
                {new Intl.NumberFormat("id-ID", {
                  style: "currency", currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(scenario.total_cuttable_amount)}
              </p>
            </div>
          )}
          {scenario.new_runway_expected != null && (
            <p className="text-sm font-semibold text-text-primary">
              Runway setelah mitigasi: {scenario.new_runway_expected} hari
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

function ForecastSection({ data }) {
  return (
    <div>
      <h3 className="font-poppins font-semibold text-base text-text-primary mb-1">Proyeksi Saldo 30 Hari</h3>
      <p className="text-xs text-text-muted mb-2">Perkiraan saldo kas berdasarkan pola transaksi saat ini</p>
      <Card className="p-3"><ForecastChart data={data} /></Card>
    </div>
  )
}

function AgentSection({ logs }) {
  const [open, setOpen] = useState(false)
  return (
    <Card className="overflow-hidden">
      <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setOpen(!open)}>
        <div>
          <span className="font-poppins font-semibold text-sm text-text-primary">Cara AI Berpikir 🤖</span>
          <p className="text-xs text-text-muted">Untuk yang ingin tahu prosesnya</p>
        </div>
        {open ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-border pt-3 animate-fade-in"><AgentLog logs={logs} /></div>}
    </Card>
  )
}

function DetailedAdviceSection({ text }) {
  const [open, setOpen] = useState(false)
  return (
    <Card className="overflow-hidden">
      <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setOpen(!open)}>
        <span className="font-poppins font-semibold text-sm text-text-primary">📋 Analisis Lengkap</span>
        {open ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border pt-3 animate-fade-in">
          <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">{text}</p>
        </div>
      )}
    </Card>
  )
}

function ActionButtons({ navigate }) {
  return (
    <div className="flex flex-col gap-2 pb-4">
      <Button onClick={() => navigate("/chat")}>
        <MessageCircle size={18} /> Tanya CFO tentang ini
      </Button>
      <Button variant="secondary" onClick={() => navigate("/input")}>
        <RefreshCw size={16} /> Analisis Lagi
      </Button>
    </div>
  )
}

function AdvancedDetails({ anomalies, scenario, forecast, agentLogs, detailedAdvice, uncertainty }) {
  const [open, setOpen] = useState(false)
  const hasContent = anomalies.length > 0 || scenario || forecast.length > 0 || agentLogs.length > 0 || detailedAdvice || uncertainty

  if (!hasContent) return null

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-2 py-3 border border-border rounded-xl text-sm font-semibold text-text-secondary active:bg-bgwarm transition-all"
      >
        {open ? "Tutup Detail Lanjutan" : "Lihat Rincian & Prediksi Lanjut"}
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="flex flex-col gap-4 mt-4 animate-fade-in">
          {anomalies.length > 0 && <AnomalySection items={anomalies} />}
          {scenario && <ScenarioSection scenario={scenario} />}
          {forecast.length > 0 && <ForecastSection data={forecast} />}
          {agentLogs.length > 0 && <AgentSection logs={agentLogs} />}
          {detailedAdvice && <DetailedAdviceSection text={detailedAdvice} />}
          {uncertainty && (
            <p className="text-xs text-text-muted italic px-1 text-center">ℹ️ {uncertainty}</p>
          )}
        </div>
      )}
    </div>
  )
}
