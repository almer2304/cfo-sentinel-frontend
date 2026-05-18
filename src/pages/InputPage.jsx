import { useState, useRef, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { TrendingUp, TrendingDown, Check, Plus, ChevronRight, Mic, MicOff, Edit3 } from "lucide-react"
import toast from "react-hot-toast"
import { txApi } from "../lib/api"
import { AppLayout } from "../components/layout/AppLayout"
import { TopBar } from "../components/layout/TopBar"
import { formatRupiah } from "../lib/utils"

// Kategori cepat per tipe transaksi
const CATEGORIES = {
  expense: [
    { emoji: "📦", label: "Bahan Baku" },
    { emoji: "💡", label: "Listrik/Air" },
    { emoji: "👥", label: "Gaji" },
    { emoji: "🏪", label: "Sewa" },
    { emoji: "🛵", label: "Ongkir" },
    { emoji: "📱", label: "Pulsa/Internet" },
    { emoji: "🍽️", label: "Makan Operasional" },
    { emoji: "🔧", label: "Peralatan" },
    { emoji: "📢", label: "Promosi" },
    { emoji: "📋", label: "Lain-lain" },
  ],
  income: [
    { emoji: "🛒", label: "Penjualan Langsung" },
    { emoji: "📦", label: "Penjualan Online" },
    { emoji: "🤝", label: "Jasa/Servis" },
    { emoji: "💳", label: "Pembayaran Piutang" },
    { emoji: "🎁", label: "Bonus/Hadiah" },
    { emoji: "📋", label: "Lain-lain" },
  ],
}

// Format angka rupiah saat mengetik
function formatAmount(raw) {
  if (!raw) return ""
  const num = raw.replace(/\D/g, "")
  return num ? Number(num).toLocaleString("id-ID") : ""
}

function parseAmount(formatted) {
  return Number(formatted.replace(/\D/g, "")) || 0
}

export default function InputPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editCode = searchParams.get("edit")   // ?edit=TRX-xxx
  const isEditMode = !!editCode

  // Form state
  const [type, setType]               = useState("expense")
  const [amountDisplay, setAmountDisplay] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory]       = useState("")
  const [notes, setNotes]             = useState("")
  const [loading, setLoading]         = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // Recent saved transactions (session only)
  const [recent, setRecent] = useState([])

  const recognitionRef = useRef(null)
  const descRef = useRef(null)

  // Load transaksi untuk diedit
  useEffect(() => {
    if (isEditMode && editCode) {
      loadTxForEdit(editCode)
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    }
  }, [editCode])

  async function loadTxForEdit(code) {
    setLoadingEdit(true)
    try {
      const res = await txApi.get(code)
      const tx  = res.data?.data || res.data
      if (tx) {
        setType(tx.type || "expense")
        setAmountDisplay(tx.amount ? Number(tx.amount).toLocaleString("id-ID") : "")
        setDescription(tx.description || "")
        setCategory(tx.category || "")
        setNotes(tx.notes || "")
      } else {
        toast.error("Transaksi tidak ditemukan")
        navigate("/history")
      }
    } catch {
      toast.error("Gagal memuat transaksi")
      navigate("/history")
    } finally {
      setLoadingEdit(false)
    }
  }

  // Reset kategori jika tipe berubah
  function handleTypeChange(t) {
    setType(t)
    setCategory("")
  }

  function handleAmountChange(e) {
    const raw = e.target.value.replace(/\D/g, "")
    setAmountDisplay(raw ? Number(raw).toLocaleString("id-ID") : "")
  }

  function handleCategorySelect(label) {
    setCategory(prev => prev === label ? "" : label)
  }

  // ── Voice Recognition ──────────────────────────────────────────
  function handleVoice() {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
      setIsRecording(false)
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      toast.error("Browser kamu tidak mendukung fitur suara.")
      return
    }

    const rec = new SR()
    rec.lang = "id-ID"
    rec.continuous = false
    rec.interimResults = false

    rec.onstart = () => {
      setIsRecording(true)
      toast("🎙️ Bicara sekarang...", { duration: 3000 })
    }

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript
      setDescription(prev => prev ? prev + " " + text : text)
      descRef.current?.focus()
    }

    rec.onerror = (e) => {
      if (e.error !== "no-speech") toast.error("Gagal rekam: " + e.error)
      setIsRecording(false)
      recognitionRef.current = null
    }

    rec.onend = () => {
      setIsRecording(false)
      recognitionRef.current = null
    }

    recognitionRef.current = rec
    rec.start()
  }

  // ── Submit ─────────────────────────────────────────────────────
  async function handleSave() {
    const amount = parseAmount(amountDisplay)

    if (!amount || amount <= 0) {
      toast.error("Masukkan jumlah yang valid!")
      return
    }
    if (!description.trim()) {
      toast.error("Tulis keterangan transaksi ya!")
      return
    }

    setLoading(true)
    try {
      if (isEditMode) {
        // ── EDIT MODE: PATCH existing transaction ──
        await txApi.update(editCode, {
          amount,
          description: description.trim(),
          category:    category || "Lain-lain",
          notes:       notes.trim(),
        })
        toast.success(`✅ Transaksi ${editCode} diperbarui! AI sedang re-analisis...`)
        navigate("/history")
      } else {
        // ── CREATE MODE: POST new transaction ──
        const res = await txApi.create({
          type,
          amount,
          description: description.trim(),
          category:    category || "Lain-lain",
          notes:       notes.trim(),
        })

        const saved = res.data?.data
        toast.success(
          `✅ ${type === "income" ? "Pemasukan" : "Pengeluaran"} ${formatRupiah(amount, true)} tersimpan!`
        )

        // Simpan ke recent list
        setRecent(prev => [{ ...saved, type, amount, description, category }, ...prev].slice(0, 5))

        // Reset form
        setAmountDisplay("")
        setDescription("")
        setNotes("")
        setCategory("")
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Gagal menyimpan. Coba lagi."
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const amount    = parseAmount(amountDisplay)
  const isExpense = type === "expense"

  if (loadingEdit) {
    return (
      <AppLayout topbar={<TopBar title="Edit Transaksi" showBack />}>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted">Memuat data transaksi...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout topbar={<TopBar
      title={isEditMode ? `Edit ${editCode}` : "Catat Transaksi"}
      subtitle={isEditMode ? "Perbarui transaksi" : "Kasir Digital"}
      showBack={isEditMode}
    />}>
      <div className="px-4 py-4 flex flex-col gap-4 pb-24">

        {/* ── Edit Mode Banner ── */}
        {isEditMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
            <Edit3 size={15} className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-800">Mode Edit</p>
              <p className="text-xs text-amber-700">Mengedit <span className="font-mono">{editCode}</span></p>
            </div>
          </div>
        )}

        {/* ── Tipe Transaksi ────────────────────────────────── */}
        <div className="flex gap-2">
          <button
            onClick={() => handleTypeChange("expense")}
            className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-all active:scale-[0.97] ${
              isExpense
                ? "bg-danger text-white shadow-lg shadow-danger/30"
                : "bg-white border border-border text-text-secondary"
            }`}
          >
            <TrendingDown size={18} />
            Pengeluaran
          </button>
          <button
            onClick={() => handleTypeChange("income")}
            className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-all active:scale-[0.97] ${
              !isExpense
                ? "bg-success text-white shadow-lg shadow-success/30"
                : "bg-white border border-border text-text-secondary"
            }`}
          >
            <TrendingUp size={18} />
            Pemasukan
          </button>
        </div>

        {/* ── Jumlah ───────────────────────────────────────── */}
        <div className={`rounded-2xl border-2 p-5 transition-all ${
          isExpense ? "border-danger/30 bg-red-50/50" : "border-success/30 bg-green-50/50"
        }`}>
          <label className="text-xs font-semibold text-text-muted tracking-wider uppercase mb-2 block">
            Jumlah (Rupiah)
          </label>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${isExpense ? "text-danger" : "text-success"}`}>
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amountDisplay}
              onChange={handleAmountChange}
              className={`flex-1 text-3xl font-bold bg-transparent border-none outline-none placeholder:text-text-muted/40 ${
                isExpense ? "text-danger" : "text-success"
              }`}
            />
          </div>

          {/* Quick amount buttons */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {[10000, 25000, 50000, 100000, 200000, 500000].map(v => (
              <button
                key={v}
                onClick={() => setAmountDisplay(v.toLocaleString("id-ID"))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
                  parseAmount(amountDisplay) === v
                    ? isExpense ? "bg-danger text-white" : "bg-success text-white"
                    : "bg-white border border-border text-text-secondary"
                }`}
              >
                {v >= 1000000 ? `${v/1000000}jt` : `${v/1000}rb`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Keterangan ───────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-primary">Keterangan</label>
            <button
              onClick={handleVoice}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                isRecording
                  ? "bg-danger text-white animate-pulse"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              {isRecording ? <MicOff size={12} /> : <Mic size={12} />}
              {isRecording ? "Berhenti" : "Pakai Suara"}
            </button>
          </div>
          <input
            ref={descRef}
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isExpense ? "Contoh: Beli tepung terigu di pasar" : "Contoh: Penjualan kue 20 pcs"}
            className="input-field"
            onKeyDown={(e) => e.key === "Enter" && !loading && handleSave()}
          />
        </div>

        {/* ── Kategori ─────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-primary">
            Kategori {category && <span className="text-primary font-semibold">· {category}</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES[type].map(({ emoji, label }) => (
              <button
                key={label}
                onClick={() => handleCategorySelect(label)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                  category === label
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white border border-border text-text-secondary hover:border-primary"
                }`}
              >
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Catatan Opsional ─────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">
            Catatan <span className="font-normal text-text-muted">(opsional)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nama supplier, nota, dll."
            className="input-field text-sm"
          />
        </div>

        {/* ── Tombol Simpan ────────────────────────────────── */}
        <button
          onClick={handleSave}
          disabled={loading || !amount || !description.trim()}
          className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-poppins font-semibold text-base
            transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed
            ${isExpense
              ? "bg-danger text-white shadow-lg shadow-danger/30"
              : "bg-success text-white shadow-lg shadow-success/30"
            }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Menyimpan...
            </span>
          ) : (
            <>
              <Check size={20} />
              Simpan {amount > 0 ? formatRupiah(amount, true) : ""}
            </>
          )}
        </button>

        {/* ── Info pipeline ─────────────────────────────────── */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-2">
          <span className="text-primary text-base mt-0.5">🤖</span>
          <p className="text-xs text-text-secondary leading-relaxed">
            AI akan menganalisis transaksimu secara otomatis di background.
            Dashboard akan diperbarui dalam beberapa detik.
          </p>
        </div>

        {/* ── Transaksi Terakhir (session) ─────────────────── */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-poppins font-semibold text-text-primary">
                Baru Dicatat
              </h2>
              <button
                onClick={() => navigate("/history")}
                className="text-xs text-primary font-semibold flex items-center gap-0.5"
              >
                Lihat semua <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {recent.map((tx, i) => (
                <div
                  key={i}
                  className="card px-4 py-3 flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                    tx.type === "income" ? "bg-success/10" : "bg-danger/10"
                  }`}>
                    {tx.type === "income" ? "💰" : "💸"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{tx.description}</p>
                    <p className="text-xs text-text-muted">{tx.category || "Lain-lain"}</p>
                  </div>
                  <div className={`text-sm font-bold flex-shrink-0 ${
                    tx.type === "income" ? "text-success" : "text-danger"
                  }`}>
                    {tx.type === "income" ? "+" : "-"}{formatRupiah(tx.amount, true)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tambah lebih banyak ───────────────────────────── */}
        {recent.length > 0 && (
          <button
            onClick={() => {
              setAmountDisplay("")
              setDescription("")
              setNotes("")
              setCategory("")
              window.scrollTo({ top: 0, behavior: "smooth" })
            }}
            className="w-full h-12 border-2 border-dashed border-primary/30 rounded-2xl
              flex items-center justify-center gap-2 text-primary font-semibold text-sm
              hover:border-primary transition-all active:scale-[0.97]"
          >
            <Plus size={18} /> Tambah Transaksi Lagi
          </button>
        )}

      </div>
    </AppLayout>
  )
}
