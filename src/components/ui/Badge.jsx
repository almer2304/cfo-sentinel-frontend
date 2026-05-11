export function Badge({ status }) {
  const config = {
    SAFE:    { text: "Sehat ✅",   cls: "bg-success text-white" },
    WARNING: { text: "Waspada ⚠️", cls: "bg-warning text-white" },
    DANGER:  { text: "Bahaya 🔴",  cls: "bg-danger text-white"  },
  }[status] || { text: status, cls: "bg-gray-500 text-white" }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-poppins font-semibold ${config.cls}`}>
      {config.text}
    </span>
  )
}
