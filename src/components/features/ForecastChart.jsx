import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts"
import { formatRupiah } from "../../lib/utils"

export function ForecastChart({ data = [] }) {
  if (!data.length) return null
  const chartData = data.filter((_, i) => i % 3 === 0)

  return (
    <div className="w-full h-44">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#27AE60" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#27AE60" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#AEB6BF" }}
            tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
          <YAxis hide />
          <Tooltip
            formatter={(v) => [formatRupiah(v, true), "Saldo"]}
            labelFormatter={(l) => `Tanggal: ${l}`}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E8E8E8" }}
          />
          <ReferenceLine y={0} stroke="#E74C3C" strokeDasharray="4 2" strokeWidth={1.5} />
          <Area type="monotone" dataKey="predicted_balance"
            stroke="#27AE60" strokeWidth={2.5} fill="url(#balGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
