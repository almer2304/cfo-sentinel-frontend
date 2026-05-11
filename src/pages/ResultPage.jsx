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
  const health   = data.health_metrics || data.health || {}
  const status   = health.health_status || health.status || data.health_status || "SAFE"
  const score    = health.health_score || health.score || data.health_score || 0
  const metrics  = data.financial_metrics || data.metrics || {}
  const actions  = data.action_items || []
  const anomalies = data.anomalies || []
  const scenario = data.scenarios?.[0] || data.scenario || null
  const forecast = data.forecast?.daily_forecast || data.forecast || []
  const agentLogs = data.agent_logs || data.pipeline_log || []
  const execSummary = data.executive_summary || ""
  const detailedAdvice = data.detailed_advice || ""
  const uncertainty = data.uncertainty_statement || ""
  const earlyWarning = data.early_warning || null
  const hasEarlyWarning = earlyWarning?.has_warning || data.has_early_warning || false

  return (
    <AppLayout>
      <TopBar title="Hasil Analisis" right={
        <button onClick={() => navigate("/input")} className="text-xs text-primary font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-light transition-all">
          Analisis Lagi
        </button>
      } />

      <div className="px-4 py-4 flex flex-col gap-4">
        <AlertBanner hasWarning={hasEarlyWarning} earlyWarning={earlyWarning} status={status} />
        <ExecSummaryCard text={execSummary} />
        <HealthSection score={score} status={status} metrics={metrics} health={health} />
        {actions.length > 0 && <ActionItems items={actions} />}
        {anomalies.length > 0 && <AnomalySection items={anomalies} />}
        {scenario && <ScenarioSection scenario={scenario} />}
        {forecast.length > 0 && <ForecastSection data={forecast} />}
        {agentLogs.length > 0 && <AgentSection logs={agentLogs} />}
        {detailedAdvice && <DetailedAdviceSection text={detailedAdvice} />}
        {uncertainty && (
          <p className="text-xs text-text-muted italic px-1">ℹ️ {uncertainty}</p>
        )}
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
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 justify-center">
        <HealthGauge score={score} status={status} size={120} />
        <div><Badge status={status} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard icon="💰" label="Pemasukan" value={metrics.total_income || health.total_income} compact />
        <MetricCard icon="📤" label="Pengeluaran" value={metrics.total_expense || health.total_expense} compact color="text-danger" />
        <MetricCard icon="⏰" label="Uang Bertahan" value={`${runway} hari`} isRupiah={false} />
        <MetricCard icon="📈" label="Efisiensi" value={`${Math.round(margin)}%`} isRupiah={false} color={margin >= 50 ? "text-success" : "text-warning"} />
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
                  {a.deviation_percentage && (
                    <p className="text-xs text-warning mt-0.5">+{Math.round(a.deviation_percentage)}% dari biasanya</p>
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
  return (
    <Card className="overflow-hidden">
      <button className="w-full flex items-center justify-between p-4 text-left" onClick={() => setOpen(!open)}>
        <span className="font-poppins font-semibold text-sm text-text-primary">📊 {scenario.title || "Bagaimana jika penjualan turun 20%?"}</span>
        {open ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border pt-3 animate-fade-in flex flex-col gap-2">
          {scenario.chain_of_consequences?.map((c, i) => (
            <p key={i} className="text-xs text-text-secondary">• {c}</p>
          ))}
          {scenario.mitigation_steps?.map((m, i) => (
            <p key={i} className="text-xs text-success">✅ {m}</p>
          ))}
          {scenario.new_runway_expected && (
            <p className="text-sm font-semibold text-text-primary mt-1">Runway baru: {scenario.new_runway_expected} hari</p>
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
