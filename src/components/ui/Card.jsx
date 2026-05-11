export function Card({ children, className = "", onClick, ...props }) {
  return (
    <div
      className={`card ${onClick ? "cursor-pointer active:scale-[0.99] transition-transform" : ""} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}
