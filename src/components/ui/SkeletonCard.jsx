export function SkeletonCard({ className = "" }) {
  return (
    <div className={`card p-4 ${className}`}>
      <div className="shimmer-bg h-4 w-2/3 rounded mb-3" />
      <div className="shimmer-bg h-8 w-1/2 rounded mb-2" />
      <div className="shimmer-bg h-3 w-full rounded" />
    </div>
  )
}
