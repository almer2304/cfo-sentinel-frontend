import { formatRupiah } from "../../lib/utils"

export function MetricCard({ icon, label, value, isRupiah = true, color = "text-text-primary", compact = false }) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-base">{icon}</span>
        <span className="text-xs text-text-muted font-inter leading-tight">{label}</span>
      </div>
      <span className={`font-mono-num font-bold text-lg leading-tight ${color}`}>
        {isRupiah ? formatRupiah(value, compact) : value}
      </span>
    </div>
  )
}
