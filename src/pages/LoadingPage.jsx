import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import useAnalysisStore from "../store/useAnalysisStore"

const STEPS = [
  { label: "Membaca transaksi kamu...",         delay: 0 },
  { label: "Mengkategorikan pengeluaran...",    delay: 3000 },
  { label: "Menghitung kesehatan keuangan...",  delay: 8000 },
  { label: "Mencari pengeluaran tidak biasa...",delay: 13000 },
  { label: "Menyiapkan rekomendasi...",         delay: 18000 },
]

export default function LoadingPage() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => {
      const { result, error } = useAnalysisStore.getState()
      if (result) { clearInterval(iv); navigate("/result", { replace: true }) }
      if (error)  { clearInterval(iv); navigate("/input", { replace: true }) }
    }, 500)
    return () => clearInterval(iv)
  }, [navigate])

  useEffect(() => {
    const timers = STEPS.map((s, i) => setTimeout(() => setActiveStep(i), s.delay))
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => setRotation(r => r + 2), 50)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="min-h-screen bg-bgwarm flex flex-col items-center justify-center px-6">
      <div className="mb-8">
        <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center"
          style={{ transform: `rotate(${rotation}deg)` }}>
          <span className="text-4xl">🛡️</span>
        </div>
      </div>
      <h2 className="font-poppins font-bold text-lg text-text-primary text-center mb-1">
        CFO Sentinel sedang menganalisis...
      </h2>
      <p className="text-sm text-text-muted text-center mb-8">Biasanya selesai dalam 20-30 detik</p>
      <div className="w-full max-w-sm flex flex-col gap-3">
        {STEPS.map((step, i) => {
          const isDone = i < activeStep, isActive = i === activeStep, isPending = i > activeStep
          return (
            <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${isPending ? "opacity-30" : "opacity-100"}`}>
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                {isDone ? <span className="text-lg">✅</span> :
                 isActive ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> :
                 <div className="w-4 h-4 rounded-full border-2 border-border" />}
              </div>
              <span className={`text-sm font-inter ${isDone ? "text-success font-medium" : isActive ? "text-text-primary font-medium" : "text-text-muted"}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="w-full max-w-sm mt-8">
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${((activeStep + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>
    </div>
  )
}
