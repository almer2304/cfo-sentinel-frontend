import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { getAgentDisplayName } from "../../lib/utils"

export function AgentLog({ logs = [] }) {
  const [expanded, setExpanded] = useState(null)
  if (!logs.length) return null

  return (
    <div className="flex flex-col gap-2">
      {logs.map((log, i) => (
        <div key={i} className="card overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-3 text-left"
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${log.status === "success" ? "bg-success" : "bg-danger"}`} />
              <span className="font-poppins font-medium text-sm text-text-primary">
                {getAgentDisplayName(log.agent_name)}
              </span>
              <span className="text-xs text-text-muted">{log.duration_ms}ms</span>
            </div>
            {expanded === i ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
          </button>
          {expanded === i && (
            <div className="px-3 pb-3 border-t border-border flex flex-col gap-2 animate-fade-in">
              {log.input_summary && (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-0.5">Input</p>
                  <p className="text-xs text-text-secondary">{log.input_summary}</p>
                </div>
              )}
              {log.reasoning && (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-0.5">Reasoning</p>
                  <p className="text-xs text-text-secondary">{log.reasoning}</p>
                </div>
              )}
              {log.output_summary && (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-0.5">Output</p>
                  <p className="text-xs text-text-secondary">{log.output_summary}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
