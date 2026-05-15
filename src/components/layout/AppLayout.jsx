import { PageTransition } from "./PageTransition"

export function AppLayout({ children, topbar }) {
  return (
    <div className="min-h-screen bg-bgwarm flex flex-col relative">
      {topbar}
      <PageTransition className="flex-1 flex flex-col">
        <div className="flex-1 pb-24">{children}</div>
      </PageTransition>
    </div>
  )
}
