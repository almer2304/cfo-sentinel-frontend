import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, Store, Eye, EyeOff } from "lucide-react"
import toast from "react-hot-toast"
import { authApi } from "../lib/api"
import useAuthStore from "../store/useAuthStore"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { PageTransition } from "../components/layout/PageTransition"

const BUSINESS_TYPES = [
  { value: "kuliner",  label: "🍜 Kuliner" },
  { value: "fashion",  label: "👗 Fashion" },
  { value: "jasa",     label: "🔧 Jasa" },
  { value: "retail",   label: "🏪 Retail" },
  { value: "general",  label: "📦 Umum" },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore((s) => s.setAuth)

  const [tab, setTab]     = useState("login") // "login" | "register"
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const [showPw2, setShowPw2] = useState(false)

  // Form state
  const [email, setEmail]         = useState("")
  const [password, setPassword]   = useState("")
  const [password2, setPassword2] = useState("")
  const [bizName, setBizName]     = useState("")
  const [bizType, setBizType]     = useState("kuliner")

  // Errors
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!email.includes("@")) e.email = "Email tidak valid"
    if (password.length < 6) e.password = "Minimal 6 karakter"
    if (tab === "register") {
      if (!bizName.trim()) e.bizName = "Nama bisnis wajib diisi"
      if (password !== password2) e.password2 = "Password tidak cocok"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      let res
      if (tab === "login") {
        res = await authApi.login(email, password)
      } else {
        res = await authApi.register(bizName, email, password, bizType)
      }
      const { token, user } = res.data
      setAuth(user, token)
      toast.success(tab === "login" ? "Selamat datang kembali! 👋" : "Akun berhasil dibuat! 🎉")
      navigate("/home", { replace: true })
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || "Terjadi kesalahan. Coba lagi."
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-bgwarm flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-6 px-6 text-center"
        style={{ background: "linear-gradient(160deg, #C0392B 0%, #922B21 100%)" }}>
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mx-auto mb-3">
          <span className="text-3xl">🛡️</span>
        </div>
        <h1 className="font-poppins font-bold text-white text-2xl">CFO Sentinel</h1>
        <p className="text-white/70 text-sm mt-1">Asisten Keuangan Bisnis Kamu</p>
      </div>

      {/* Tab switcher */}
      <div className="px-6 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-border p-1 flex">
          <button
            className={`flex-1 py-3 rounded-xl text-sm font-poppins font-semibold transition-all ${
              tab === "login" ? "bg-primary text-white shadow-sm" : "text-text-secondary"
            }`}
            onClick={() => { setTab("login"); setErrors({}) }}
          >
            Masuk
          </button>
          <button
            className={`flex-1 py-3 rounded-xl text-sm font-poppins font-semibold transition-all ${
              tab === "register" ? "bg-primary text-white shadow-sm" : "text-text-secondary"
            }`}
            onClick={() => { setTab("register"); setErrors({}) }}
          >
            Daftar
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 px-6 py-6 flex flex-col gap-4">
        {tab === "register" && (
          <>
            <Input
              label="Nama Bisnis"
              icon={Store}
              placeholder="Contoh: Warung Bu Ani"
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
              error={errors.bizName}
            />

            {/* Business type pills */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary font-poppins">Jenis Bisnis</label>
              <div className="flex flex-wrap gap-2">
                {BUSINESS_TYPES.map(({ value, label }) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setBizType(value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
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
          </>
        )}

        <Input
          label="Email"
          icon={Mail}
          type="email"
          placeholder="email@contoh.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary font-poppins">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type={showPw ? "text" : "password"}
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`input-field !pl-11 !pr-12 ${errors.password ? "border-danger focus:border-danger focus:ring-danger/20" : ""}`}
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted p-1">
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
        </div>

        {tab === "register" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary font-poppins">Konfirmasi Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type={showPw2 ? "text" : "password"}
                placeholder="Ulangi password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className={`input-field !pl-11 !pr-12 ${errors.password2 ? "border-danger focus:border-danger focus:ring-danger/20" : ""}`}
              />
              <button type="button" onClick={() => setShowPw2(!showPw2)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted p-1">
                {showPw2 ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password2 && <p className="text-xs text-danger">{errors.password2}</p>}
          </div>
        )}

        <div className="mt-2">
          <Button type="submit" loading={loading}>
            {tab === "login" ? "Masuk" : "Daftar Sekarang"}
          </Button>
        </div>

        {/* Demo hint */}
        {tab === "login" && (
          <div className="mt-2 bg-gold-light border border-gold/30 rounded-xl p-3 text-center">
            <p className="text-xs text-text-secondary">
              💡 <span className="font-semibold">Demo:</span> demo@cfosentinel.id / demo1234
            </p>
          </div>
        )}
      </form>

      {/* Footer */}
      <div className="px-6 pb-6 text-center">
        <p className="text-xs text-text-muted">
          🔒 Data kamu aman dan terenkripsi
        </p>
      </div>
    </div>
    </PageTransition>
  )
}
