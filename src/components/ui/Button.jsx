export function Button({ children, variant = "primary", className = "", loading = false, ...props }) {
  const base = "flex items-center justify-center gap-2 font-poppins font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
  const variants = {
    primary:   "w-full h-14 bg-primary hover:bg-primary-dark text-white rounded-xl text-base",
    secondary: "w-full h-12 bg-white border-2 border-primary text-primary rounded-xl text-sm",
    ghost:     "h-10 px-4 text-text-secondary hover:text-primary rounded-lg text-sm",
    danger:    "w-full h-12 bg-danger text-white rounded-xl text-sm",
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading} {...props}>
      {loading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  )
}
