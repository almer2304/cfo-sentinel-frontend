export function formatRupiah(amount, compact = false) {
  if (amount == null) return "Rp 0"
  const abs = Math.abs(amount)
  const sign = amount < 0 ? "-" : ""
  if (compact) {
    if (abs >= 1_000_000_000) return `${sign}Rp ${(abs/1e9).toFixed(1)} M`
    if (abs >= 1_000_000)     return `${sign}Rp ${(abs/1e6).toFixed(1)} jt`
    if (abs >= 1_000)         return `${sign}Rp ${(abs/1e3).toFixed(0)} rb`
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(str) {
  if (!str) return ""
  return new Date(str).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric"
  })
}

export function getStatusConfig(status) {
  return {
    SAFE:    { label: "Sehat ✅",   bg: "bg-success-light", text: "text-success",  border: "border-success",  pill: "bg-success text-white" },
    WARNING: { label: "Waspada ⚠️", bg: "bg-warning-light", text: "text-warning",  border: "border-warning",  pill: "bg-warning text-white" },
    DANGER:  { label: "Bahaya 🔴",  bg: "bg-danger-light",  text: "text-danger",   border: "border-danger",   pill: "bg-danger text-white"  },
  }[status] || { label: status, bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-300", pill: "bg-gray-500 text-white" }
}

export function getUrgencyConfig(urgency) {
  return {
    IMMEDIATE:  { label: "🔴 Segera",       color: "text-danger",  bg: "bg-danger-light" },
    THIS_WEEK:  { label: "🟡 Minggu Ini",   color: "text-warning", bg: "bg-warning-light" },
    THIS_MONTH: { label: "🟢 Bulan Ini",    color: "text-success", bg: "bg-success-light" },
  }[urgency] || { label: urgency, color: "text-gray-600", bg: "bg-gray-50" }
}

export function getSeverityConfig(severity) {
  return {
    HIGH:   { label: "Sangat Perlu Diperhatikan", color: "text-danger",  dot: "bg-danger" },
    MEDIUM: { label: "Perlu Diperhatikan",         color: "text-warning", dot: "bg-warning" },
    LOW:    { label: "Perlu Dicermati",             color: "text-success", dot: "bg-success" },
  }[severity] || { label: severity, color: "text-gray-600", dot: "bg-gray-400" }
}

export function getAgentDisplayName(name) {
  return {
    parser:      "🔍 Membaca Transaksi",
    categorizer: "🏷️ Mengkategorikan",
    analyst:     "📊 Menghitung Metrik",
    anomaly:     "⚠️ Cek Anomali",
    scenario:    "🎯 Simulasi Skenario",
    advisor:     "🧠 Menyiapkan Saran",
  }[name] || name
}
