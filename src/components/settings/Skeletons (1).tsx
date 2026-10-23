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

// ---------------------------------------------------------------------------
// Added: skeletons for cart, food detail, menu, auth forms and the
// vendor / rider / admin dashboard tabs.
// ---------------------------------------------------------------------------

/** For skeletons that sit inside an already-rendered page or tab (no outer padding). */
function Inline({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** /cart — item rows, subtotal and checkout button. */
export function CartSkeleton() {
  return (
    <Shell width="max-w-3xl" label="Loading your cart…">
      <Skeleton className="mb-6 h-9 w-36" />
      <Skeleton className="mb-4 h-4 w-40" />
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[4rem_1fr] gap-4 rounded-card border-2 border-ink/10 bg-white p-4">
            <Skeleton className="h-16 w-16" />
            <div className="grid content-start gap-2">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
              <div className="mt-1 flex items-center justify-between gap-3">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-[1fr_auto] gap-4 border-t-2 border-ink/10 pt-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-28" />
      </div>
      <Skeleton className="mt-6 h-12 w-full" />
    </Shell>
  );
}

/** /food/[id] — image, title, options, quantity + add-to-cart row. */
export function FoodDetailSkeleton() {
  return (
    <Shell width="max-w-3xl" label="Loading dish…">
      <Skeleton className="mb-6 aspect-[16/9] w-full" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-9 w-2/3" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-4/5" />
      <Skeleton className="mt-4 h-6 w-28" />

      <div className="mt-6 grid gap-2">
        <Skeleton className="h-5 w-28" />
        <div className="flex flex-wrap gap-2">
          {["w-24", "w-28", "w-20", "w-32"].map((w, i) => (
            <Skeleton key={i} className={`h-10 ${w} !rounded-full`} />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-20 w-full" />
      </div>

      <div className="mt-6 grid grid-cols-[auto_1fr] gap-4">
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-12 w-full" />
      </div>
    </Shell>
  );
}

/**
 * /menu — a grid of dish cards (matches the page's grid-cols-2 md:grid-cols-4).
 * `vendor` mimics a single kitchen's page: heading + category sections.
 * `withSearch` adds the search bar placeholder (used for the Suspense fallback).
 */
export function MenuSkeleton({ vendor = false, withSearch = false }: { vendor?: boolean; withSearch?: boolean }) {
  const cards = (n: number) => (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="grid gap-2 rounded-card border-2 border-ink/10 bg-white p-2">
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
  return (
    <Inline label="Loading menu…">
      {withSearch && <Skeleton className="mb-6 h-12 w-full" />}
      {vendor ? (
        <div className="grid gap-8">
          <div className="grid gap-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          {[0, 1].map((s) => (
            <div key={s} className="grid gap-3">
              <Skeleton className="h-6 w-40" />
              {cards(4)}
            </div>
          ))}
        </div>
      ) : (
        cards(8)
      )}
    </Inline>
  );
}

/** Suspense fallback for the login / reset-password forms. */
export function AuthFormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <Shell width="max-w-sm" label="Loading…">
      <Skeleton className="mb-6 h-9 w-48" />
      <div className="grid gap-4">
        {Array.from({ length: fields }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
        <Skeleton className="h-12 w-full" />
      </div>
    </Shell>
  );
}

/** Stat tiles (earnings tabs). */
export function StatCardsSkeleton({ count = 2, cols = "grid-cols-2" }: { count?: number; cols?: string }) {
  return (
    <Inline label="Loading…">
      <div className={`grid gap-3 ${cols}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="grid justify-items-center gap-2 rounded-card border-2 border-ink/10 bg-white p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>
    </Inline>
  );
}

/** Admin overview — stat tiles plus the "orders by status" panel. */
export function DashboardStatsSkeleton() {
  return (
    <Inline label="Loading dashboard…">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="grid gap-2 rounded-card border-2 border-ink/10 bg-white p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
      <div className={card}>
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-4 py-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-6" />
            </div>
          ))}
        </div>
      </div>
    </Inline>
  );
}

/** Generic stacked cards for dashboard lists (orders, vendors, riders, deliveries, menu). */
export function CardListSkeleton({ count = 3, rows = 2 }: { count?: number; rows?: number }) {
  const widths = ["w-3/4", "w-1/2", "w-2/3"];
  return (
    <Inline label="Loading…">
      <div className="grid gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={card}>
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-6 w-20 !rounded-full" />
            </div>
            {Array.from({ length: rows }).map((_, r) => (
              <Skeleton key={r} className={`h-4 ${widths[r % widths.length]}`} />
            ))}
            <Skeleton className="h-9 w-32" />
          </div>
        ))}
      </div>
    </Inline>
  );
}

/** A card of labelled inputs (admin settings, vendor profile). */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <Inline label="Loading…">
      <div className="grid max-w-sm gap-3 rounded-card border-2 border-ink/10 bg-white p-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="grid gap-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-32" />
      </div>
    </Inline>
  );
}

// ---------------------------------------------------------------------------
// Added: settings page, saved addresses, and the generic <Protected> fallback.
// ---------------------------------------------------------------------------

/** One settings-style card: title, description, labelled inputs, button. */
function SettingsCardSkeleton({ fields, danger = false }: { fields: number; danger?: boolean }) {
  return (
    <div className={`grid gap-4 rounded-card border bg-white p-5 sm:p-6 ${danger ? "border-red-200" : "border-black/10"}`}>
      <div className="grid gap-2">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-full max-w-prose" />
      </div>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="grid gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-36" />
    </div>
  );
}

/** /settings — mirrors Profile, Email, Password, Addresses and Danger-zone cards. */
export function SettingsPageSkeleton() {
  return (
    <Shell width="max-w-2xl" label="Loading your account settings…">
      <div className="mb-6 grid gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-6">
        <SettingsCardSkeleton fields={2} />
        <SettingsCardSkeleton fields={2} />
        <SettingsCardSkeleton fields={3} />
        <SettingsCardSkeleton fields={0} />
        <SettingsCardSkeleton fields={0} danger />
      </div>
    </Shell>
  );
}

/** The saved-addresses list inside its card. */
export function AddressListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <Inline label="Loading your saved addresses…">
      <div className="grid gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] gap-3 rounded-card border border-black/10 p-3 sm:p-4">
            <div className="grid content-start gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex items-start gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    </Inline>
  );
}

/** Default fallback for <Protected> while the sign-in check resolves (dashboards etc.). */
export function PageSkeleton() {
  return (
    <Shell width="max-w-3xl" label="Loading…">
      <Skeleton className="mb-6 h-9 w-56" />
      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 !rounded-full" />
        ))}
      </div>
      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={card}>
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-6 w-20 !rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </Shell>
  );
}
