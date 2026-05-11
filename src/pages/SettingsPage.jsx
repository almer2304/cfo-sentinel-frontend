import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, Mail, Tag, Shield, FileText, Lock, LogOut, ChevronRight } from "lucide-react"
import toast from "react-hot-toast"
import useAuthStore from "../store/useAuthStore"
import { authApi, historyApi } from "../lib/api"
import { AppLayout } from "../components/layout/AppLayout"
import { TopBar } from "../components/layout/TopBar"
import { Card } from "../components/ui/Card"
import { Button } from "../components/ui/Button"

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [totalAnalyses, setTotalAnalyses] = useState(0)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  const initials = (user?.business_name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
  const bizTypeLabel = {
    kuliner: "🍜 Kuliner", fashion: "👗 Fashion", jasa: "🔧 Jasa",
    retail: "🏪 Retail", general: "📦 Umum"
  }[user?.business_type] || user?.business_type || "-"

  useEffect(() => {
    historyApi.stats().then(res => {
      setTotalAnalyses(res.data?.total_sessions || res.data?.total || 0)
    }).catch(() => {})
  }, [])

  function handleLogout() {
    if (!window.confirm("Yakin ingin keluar dari akun?")) return
    authApi.logout().catch(() => {})
    logout()
    toast.success("Berhasil keluar")
    navigate("/login", { replace: true })
  }

  return (
    <AppLayout>
      <TopBar title="⚙️ Setelan" showBack={false} />
      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Profile card */}
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-3">
            <span className="text-white font-poppins font-bold text-2xl">{initials}</span>
          </div>
          <h2 className="font-poppins font-bold text-lg text-text-primary">{user?.business_name || "Bisnis Saya"}</h2>
          <p className="text-sm text-text-muted">{user?.email || "-"}</p>
          <span className="mt-2 inline-flex items-center px-3 py-1 bg-primary-light text-primary rounded-full text-xs font-semibold">
            {bizTypeLabel}
          </span>
          <p className="text-xs text-text-muted mt-2">{totalAnalyses} analisis dilakukan</p>
        </Card>

        {/* Account section */}
        <div>
          <h3 className="font-poppins font-semibold text-sm text-text-muted uppercase tracking-wide mb-2 px-1">Akun</h3>
          <Card className="overflow-hidden divide-y divide-border">
            <SettingRow icon={<Building2 size={18} />} label="Nama Bisnis" value={user?.business_name || "-"} />
            <SettingRow icon={<Mail size={18} />} label="Email" value={user?.email || "-"} />
            <SettingRow icon={<Tag size={18} />} label="Jenis Bisnis" value={bizTypeLabel} />
          </Card>
        </div>

        {/* About section */}
        <div>
          <h3 className="font-poppins font-semibold text-sm text-text-muted uppercase tracking-wide mb-2 px-1">Tentang Aplikasi</h3>
          <Card className="overflow-hidden divide-y divide-border">
            <SettingRow icon={<Shield size={18} />} label="CFO Sentinel" value="v1.0.0" />
            <button className="w-full" onClick={() => setAboutOpen(!aboutOpen)}>
              <SettingRow icon={<FileText size={18} />} label="Tentang CFO Sentinel" chevron />
            </button>
            {aboutOpen && (
              <div className="px-4 py-3 bg-bgwarm animate-fade-in">
                <p className="text-xs text-text-secondary leading-relaxed">
                  CFO Sentinel adalah asisten keuangan AI untuk UMKM Indonesia.
                  Dibuat untuk membantu usaha kecil memantau kondisi keuangan
                  dan membuat keputusan yang lebih baik.
                </p>
              </div>
            )}
            <button className="w-full" onClick={() => setPrivacyOpen(!privacyOpen)}>
              <SettingRow icon={<Lock size={18} />} label="Privasi Data" chevron />
            </button>
            {privacyOpen && (
              <div className="px-4 py-3 bg-bgwarm animate-fade-in">
                <p className="text-xs text-text-secondary leading-relaxed">
                  Data kamu disimpan aman di server dan tidak dibagikan ke pihak ketiga.
                  Semua komunikasi dienkripsi untuk menjaga kerahasiaan informasi bisnismu.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Logout */}
        <div className="pt-2">
          <Button variant="secondary" onClick={handleLogout} className="border-danger text-danger hover:bg-danger-light">
            <LogOut size={16} /> Keluar dari Akun
          </Button>
        </div>

        <p className="text-center text-xs text-text-muted pb-4">
          Dibuat dengan ❤️ untuk UMKM Indonesia
        </p>
      </div>
    </AppLayout>
  )
}

function SettingRow({ icon, label, value, chevron }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-text-muted">{icon}</span>
      <span className="text-sm text-text-primary font-medium flex-1">{label}</span>
      {value && <span className="text-sm text-text-muted">{value}</span>}
      {chevron && <ChevronRight size={16} className="text-text-muted" />}
    </div>
  )
}
