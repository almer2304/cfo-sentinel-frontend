import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function TopBar({ title, subtitle, showBack = true, right }) {
  const navigate = useNavigate()
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
      {showBack && (
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-bgwarm active:scale-95 transition-all">
          <ArrowLeft size={22} className="text-text-primary" />
        </button>
      )}
      <div className="flex-1">
        <h1 className="font-poppins font-semibold text-base text-text-primary leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}
