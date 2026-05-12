import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronDown, ChevronUp, Rocket, Info } from "lucide-react"
import toast from "react-hot-toast"
import useAuthStore from "../store/useAuthStore"
import useAnalysisStore from "../store/useAnalysisStore"
import { analysisApi } from "../lib/api"
import { AppLayout } from "../components/layout/AppLayout"
import { TopBar } from "../components/layout/TopBar"
import { Button } from "../components/ui/Button"

const TEMPLATES = [
  { emoji: "📦", text: "Beli bahan baku Rp " },
  { emoji: "💰", text: "Terima bayaran Rp " },
  { emoji: "💳", text: "Bayar tagihan Rp " },
  { emoji: "👥", text: "Bayar gaji karyawan Rp " },
  { emoji: "🏪", text: "Bayar sewa tempat Rp " },
  { emoji: "🚗", text: "Bayar transport Rp " },
]

const BIZ_TYPES = [
  { value: "kuliner",  label: "🍜 Kuliner" },
  { value: "fashion",  label: "👗 Fashion" },
  { value: "jasa",     label: "🔧 Jasa" },
  { value: "retail",   label: "🏪 Retail" },
  { value: "general",  label: "📦 Umum" },
]

export default function InputPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { setResult, setLoading: setStoreLoading, setError } = useAnalysisStore()

  const [rawInput, setRawInput] = useState("")
  const [bizType, setBizType]   = useState(user?.business_type || "general")
  const [cashBal, setCashBal]   = useState("")
  const [configOpen, setConfigOpen] = useState(false)
  const [loading, setLoading]   = useState(false)

  function appendTemplate(text) {
    setRawInput((prev) => (prev ? prev + "\n" + text : text))
  }

  async function handleAnalyze() {
    if (!rawInput.trim()) {
      toast.error("Tulis transaksi dulu ya!")
      return
    }

    setLoading(true)
    setStoreLoading(true)
    navigate("/loading")

    try {
      const res = await analysisApi.run(
        rawInput.trim(),
        bizType,
        cashBal ? Number(cashBal) : 0
      )
      setResult(res.data)
      // LoadingPage will detect result and navigate to /result
    } catch (err) {
      const msg = err.response?.data?.detail || "Analisis gagal. Coba lagi nanti."
      setError(msg)
      toast.error(msg)
      navigate("/input")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <TopBar title="Catat Transaksi" subtitle="Ceritakan keuangan bisnismu" />

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Textarea */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary font-poppins">
            Ceritakan transaksi bisnis kamu hari ini
          </label>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={"Contoh:\nBeli bahan baku 500rb\nBayar listrik 200rb\nTerima bayaran dari pelanggan 1.5jt\nGaji karyawan 1jt"}
            className="w-full h-44 px-4 py-3 bg-white border border-border rounded-xl text-text-primary text-base
                       font-inter focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                       transition-all duration-150 placeholder:text-text-muted resize-none leading-relaxed"
          />
          <p className="text-xs text-text-muted text-right">{rawInput.length} karakter</p>
        </div>

        {/* Cash Balance */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary font-poppins">
            Saldo kas kamu sekarang <span className="text-text-muted font-normal">(penting untuk akurasi)</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">Rp</span>
            <input
              type="number"
              placeholder="Contoh: 5000000"
              value={cashBal}
              onChange={(e) => setCashBal(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <p className="text-xs text-text-muted">
            💡 Isi jumlah uang yang kamu punya sekarang (di dompet + rekening)
          </p>
        </div>

        {/* Quick templates */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted font-medium">Atau gunakan template:</label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TEMPLATES.map(({ emoji, text }) => (
              <button
                key={text}
                onClick={() => appendTemplate(text)}
                className="flex-shrink-0 px-3 py-2 bg-white border border-border rounded-xl text-sm
                           text-text-secondary hover:border-primary hover:text-primary
                           transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>{emoji}</span>
                <span className="text-xs">{text.replace(" Rp ", "")}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Config section (collapsible) */}
        <div className="card overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 text-left"
            onClick={() => setConfigOpen(!configOpen)}
          >
            <span className="text-sm font-poppins font-medium text-text-primary">🏪 Ganti jenis bisnis (opsional)</span>
            {configOpen ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
          </button>
          {configOpen && (
            <div className="px-4 pb-4 border-t border-border pt-3 flex flex-col gap-4 animate-fade-in">
              {/* Business type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary font-poppins">Jenis Bisnis</label>
                <div className="flex flex-wrap gap-2">
                  {BIZ_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBizType(value)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                        bizType === value
                          ? "bg-primary text-white shadow-sm"
                          : "bg-white border border-border text-text-secondary hover:border-primary"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info banner */}
        <div className="bg-gold-light border border-gold/30 rounded-xl p-3 flex items-start gap-2">
          <Info size={16} className="text-gold mt-0.5 flex-shrink-0" />
          <p className="text-xs text-text-secondary leading-relaxed">
            Tulis sebebas mungkin. AI akan memahami bahasa sehari-hari kamu.
          </p>
        </div>

        {/* Analyze button */}
        <Button onClick={handleAnalyze} loading={loading} disabled={!rawInput.trim() || loading}>
          <Rocket size={18} /> Analisis Sekarang
        </Button>
      </div>
    </AppLayout>
  )
}
