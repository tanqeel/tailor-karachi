export default function PageSkeleton() {
  return (
    <div className="space-y-4 pb-4 animate-pulse">
      {/* Search bar skeleton */}
      <div className="h-12 bg-muted rounded-xl" />
      {/* Button skeleton */}
      <div className="h-12 bg-primary/20 rounded-xl" />
      {/* Card skeletons */}
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full w-full" />
        </div>
      ))}
    </div>
  );
}
