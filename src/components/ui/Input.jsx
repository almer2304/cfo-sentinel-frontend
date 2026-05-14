import { forwardRef } from "react"
export const Input = forwardRef(({ label, icon: Icon, error, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-medium text-text-primary font-poppins">{label}</label>}
    <div className="relative">
      {Icon && <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />}
      <input
        ref={ref}
        className={`input-field ${Icon ? "!pl-11" : "!pl-4"} ${error ? "border-danger focus:border-danger focus:ring-danger/20" : ""}`}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
))
