import { BottomNav } from "./BottomNav"
import { PageTransition } from "./PageTransition"

export function AppLayout({ children, hideNav = false }) {
  return (
    <PageTransition>
      <div className="min-h-screen bg-bgwarm flex flex-col">
        <div className="flex-1 pb-24">{children}</div>
        {!hideNav && <BottomNav />}
      </div>
    </PageTransition>
  )
}
