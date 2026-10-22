// Grid-based loading skeletons that mirror the real layouts of the orders,
// order-detail and checkout pages, so nothing jumps when the data arrives.
// Uses only Tailwind's built-in animate-pulse (globals.css already calms
// animations for people who prefer reduced motion).

function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-card bg-ink/10 ${className}`} />;
}

function Shell({ width, label, children }: { width: string; label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={`mx-auto px-4 py-8 ${width}`}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

const card = "grid gap-3 rounded-card border-2 border-ink/10 bg-white p-4";

/** /orders — "Your orders" list. */
export function OrdersListSkeleton() {
  return (
    <Shell width="max-w-3xl" label="Loading your orders…">
      <Skeleton className="mb-6 h-9 w-44" />
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={card}>
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-6 w-20 !rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-24" />
              <div className="flex gap-3">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

/** /orders/[id] — order tracking page. */
export function OrderDetailSkeleton() {
  return (
    <Shell width="max-w-2xl" label="Loading order…">
      <div className="mb-2 flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24 !rounded-full" />
      </div>
      <Skeleton className="mb-6 h-4 w-40" />

      {/* timeline */}
      <div className="mb-8 grid gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-3 flex-shrink-0 !rounded-full" />
            <Skeleton className="h-4" />
          </div>
        ))}
      </div>

      {/* order summary */}
      <div className={card}>
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] gap-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
        <div className="mt-1 grid gap-2 border-t border-ink/10 pt-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/** /checkout — address, phone, coupon and submit button. */
export function CheckoutSkeleton() {
  return (
    <Shell width="max-w-2xl" label="Loading checkout…">
      <Skeleton className="mb-6 h-9 w-40" />

      <div className="mb-6 grid gap-3">
        <Skeleton className="h-5 w-36" />
        <div className="grid gap-2 sm:grid-cols-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>

      {["w-44", "w-40", "w-28", "w-40"].map((w, i) => (
        <div key={i} className="mb-6 grid gap-2">
          <Skeleton className={`h-5 ${w}`} />
          <Skeleton className={i === 3 ? "h-20" : "h-12"} />
        </div>
      ))}

      <div className="mb-4 grid grid-cols-[1fr_auto] gap-4 border-t-2 border-ink/10 pt-4">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-14 w-full" />
    </Shell>
  );
}
