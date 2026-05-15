import { useState, useRef, useEffect } from "react"
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
  { emoji: "📦", text: "Tadi beli bahan baku " },
  { emoji: "💰", text: "Dapat bayaran dari pelanggan " },
  { emoji: "💡", text: "Bayar listrik/air " },
  { emoji: "👥", text: "Bayar gaji karyawan " },
  { emoji: "🏪", text: "Bayar sewa tempat " },
  { emoji: "🛵", text: "Bayar ongkos kirim " },
  { emoji: "📱", text: "Bayar tagihan HP/internet " },
  { emoji: "🍱", text: "Terjual produk hari ini " },
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
  const [bizType, setBizType] = useState(user?.business_type || "general")
  const [cashBal, setCashBal] = useState("")
  const [period, setPeriod] = useState("hari")
  const [configOpen, setConfigOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // Ref to hold recognition instance for continuous recording
  const recognitionRef = useRef(null)

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    }
  }, [])

  function appendTemplate(text) {
    setRawInput((prev) => (prev ? prev + "\n" + text : text))
  }

  function handleVoiceRecord() {
    // If already recording, stop it
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
      setIsRecording(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error("Maaf, browser kamu belum mendukung fitur rekam suara.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "id-ID"
    recognition.continuous = true          // Keep listening until stopped
    recognition.interimResults = true       // Show interim for better UX
    recognition.maxAlternatives = 3         // More alternatives = better proper noun matching

    const initialInput = rawInput.replace(/\n?🎤 .*$/, "").trim()
    let hasSpeech = false

    recognition.onstart = () => {
      setIsRecording(true)
      hasSpeech = false
      toast("🎙️ Mendengarkan... Tekan lagi untuk berhenti", { duration: 3000 })
    }

    recognition.onresult = (event) => {
      if (event.results.length > 0) hasSpeech = true
      let interim = ""
      let finalStr = ""
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          // Pick best transcript from alternatives
          let best = result[0].transcript
          // Check all alternatives for potentially better matches
          for (let j = 1; j < result.length; j++) {
            if (result[j].confidence > result[0].confidence) {
              best = result[j].transcript
            }
          }
          finalStr += best + " "
        } else {
          interim += result[0].transcript
        }
      }

      const combined = finalStr.trim()
      let display = combined
      if (interim) {
        display += display ? `\n🎤 ${interim}` : `🎤 ${interim}`
      }

      let newText = initialInput
      if (newText && display) {
        newText += "\n" + display
      } else if (display) {
        newText = display
      }

      setRawInput(newText)
    }

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        toast.error("Izin mikrofon ditolak browser.")
      } else if (event.error === "no-speech") {
        toast("Tidak terdengar suara. Coba bicara lebih dekat.", { icon: "🤫" })
      } else {
        toast.error("Gagal mendengar: " + event.error)
      }
      setIsRecording(false)
      recognitionRef.current = null
    }

    recognition.onend = () => {
      // Clean up interim markers from final text
      setRawInput((prev) => prev.replace(/\n?🎤 .*$/, "").trim())
      if (hasSpeech) {
        toast.success("Berhasil mencatat suara!")
      }
      setIsRecording(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
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
      const periodLabel = { hari: "hari ini", minggu: "minggu ini", bulan: "bulan ini" }[period]
      const inputWithPeriod = `[Periode: ${periodLabel}]\n${rawInput.trim()}`

      const res = await analysisApi.run(
        inputWithPeriod,
        bizType,
        cashBal ? Number(cashBal) : 0
      )
      setResult(res.data)
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
    <AppLayout topbar={<TopBar title="Catat Transaksi" subtitle="Ceritakan keuangan bisnismu" />}>
      <div className="px-4 py-4 flex flex-col gap-4">

        {/* Period selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary font-poppins">
            Transaksi ini untuk periode:
          </label>
          <div className="flex gap-2">
            {[
              { value: "hari",   label: "📅 Hari Ini" },
              { value: "minggu", label: "📆 Minggu Ini" },
              { value: "bulan",  label: "🗓️ Bulan Ini" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                  period === value
                    ? "bg-primary text-white"
                    : "bg-white border border-border text-text-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary font-poppins flex justify-between items-center">
            <span>Ceritakan transaksi kamu hari ini</span>
            <button 
              onClick={handleVoiceRecord}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                isRecording 
                  ? "bg-danger text-white animate-pulse" 
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              {isRecording ? "🔴 Berhenti" : "🎙️ Pakai Suara"}
            </button>
          </label>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={`Contoh:\nTadi pagi bayar listrik 200 ribu\nSiang beli bahan baku ke pasar 500 ribu\nSore dapat bayaran dari Bu Sari 1.5 juta`}
            className="w-full h-44 px-4 py-3 bg-white border border-border rounded-xl text-text-primary text-base
                       font-inter focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                       transition-all duration-150 placeholder:text-text-muted resize-none leading-relaxed"
          />
          <p className="text-xs text-text-muted text-right">{rawInput.length} karakter</p>
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

        {/* Info banner */}
        <div className="bg-gold-light border border-gold/30 rounded-xl p-3 flex items-start gap-2">
          <Info size={16} className="text-gold mt-0.5 flex-shrink-0" />
          <p className="text-xs text-text-secondary leading-relaxed">
            Tulis sebebas mungkin. AI akan memahami bahasa sehari-hari kamu.
          </p>
        </div>

        {/* Cash Balance & Business Type */}
        <div className="card overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 text-left"
            onClick={() => setConfigOpen(!configOpen)}
          >
            <span className="text-sm font-poppins font-medium text-text-primary">⚙️ Pengaturan Lanjutan (Saldo & Bisnis)</span>
            {configOpen ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
          </button>
          {configOpen && (
            <div className="px-4 pb-4 border-t border-border pt-3 flex flex-col gap-4 animate-fade-in">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">Koreksi Saldo Kas (Opsional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">Rp</span>
                  <input
                    type="number"
                    placeholder="Biarkan kosong jika tidak berubah"
                    value={cashBal}
                    onChange={(e) => setCashBal(e.target.value)}
                    className="input-field !pl-10"
                  />
                </div>
              </div>

              {/* Business type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">Jenis Bisnis</label>
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

        {/* Analyze button */}
        <Button onClick={handleAnalyze} loading={loading} disabled={!rawInput.trim() || loading}>
          <Rocket size={18} /> Simpan & Analisis
        </Button>
      </div>
    </AppLayout>
  )
}
