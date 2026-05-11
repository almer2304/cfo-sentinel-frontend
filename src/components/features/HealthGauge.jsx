import { getStatusConfig } from "../../lib/utils"

export function HealthGauge({ score, status, size = 140 }) {
  const { text: textColor } = getStatusConfig(status)
  const radius = (size - 20) / 2
  const circ   = 2 * Math.PI * radius
  const fill   = ((score || 0) / 100) * circ
  const strokeColor = { SAFE: "#27AE60", WARNING: "#E67E22", DANGER: "#E74C3C" }[status] || "#AEB6BF"

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#F0F0F0" strokeWidth={12} />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={strokeColor} strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          style={{ transition: "stroke-dasharray 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-mono-num font-bold leading-none ${textColor}`}
          style={{ fontSize: size * 0.25 }}>
          {Math.round(score || 0)}
        </span>
        <span className="text-text-muted text-xs font-inter mt-0.5">dari 100</span>
      </div>
    </div>
  )
}
