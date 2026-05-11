import { useLocation, useNavigate } from "react-router-dom"
import { Home, PenLine, BarChart3, MessageCircle, Settings } from "lucide-react"

const NAV = [
  { path: "/home",     icon: Home,          label: "Beranda"  },
  { path: "/input",    icon: PenLine,       label: "Catat"    },
  { path: "/history",  icon: BarChart3,     label: "Riwayat"  },
  { path: "/chat",     icon: MessageCircle, label: "Tanya AI" },
  { path: "/settings", icon: Settings,      label: "Setelan"  },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-20 bg-white border-t border-border safe-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-90"
            >
              <Icon size={22} className={active ? "text-primary" : "text-text-muted"} />
              <span className={`text-[10px] font-medium ${active ? "text-primary font-poppins font-semibold" : "text-text-muted"}`}>
                {label}
              </span>
              {active && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
