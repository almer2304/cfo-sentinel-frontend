import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import useAuthStore from "../store/useAuthStore"

export default function SplashPage() {
  const navigate  = useNavigate()
  const isLogged  = useAuthStore((s) => s.isLogged)

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(isLogged ? "/home" : "/login", { replace: true })
    }, 2000)
    return () => clearTimeout(timer)
  }, [isLogged, navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(160deg, #C0392B 0%, #922B21 100%)" }}>
      
      {/* Logo */}
      <div className="flex flex-col items-center gap-4 animate-slide-up">
        <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
          <span className="text-5xl">🛡️</span>
        </div>
        <div className="text-center">
          <h1 className="font-poppins font-bold text-white text-4xl tracking-tight">
            CFO Sentinel
          </h1>
          <p className="text-white/75 text-base font-inter mt-1">
            Asisten Keuangan Bisnis Kamu
          </p>
        </div>
      </div>

      {/* Loading dots */}
      <div className="absolute bottom-16 flex gap-2">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 bg-white/60 rounded-full animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}
