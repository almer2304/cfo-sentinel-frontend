import { BottomNav } from "./BottomNav"

export function AppLayout({ children, hideNav = false }) {
  return (
    <div className="min-h-screen bg-bgwarm flex flex-col">
      <div className="flex-1 pb-24">{children}</div>
      {!hideNav && <BottomNav />}
    </div>
  )
}
