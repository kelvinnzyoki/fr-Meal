"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

export function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const dashboardHref =
    user?.role === "VENDOR" ? "/vendor/dashboard" : user?.role === "RIDER" ? "/rider/dashboard" : user?.role === "ADMIN" ? "/admin/dashboard" : null;

  const isAppShell = pathname?.startsWith("/vendor") || pathname?.startsWith("/rider") || pathname?.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 bg-ink text-cream">
      <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl font-extrabold tracking-tight text-marigold">
          Mpishi254
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/menu?todaysMenu=true" className="hover:text-marigold transition-colors">Today&apos;s Menu</Link>
          <Link href="/menu" className="hover:text-marigold transition-colors">Browse</Link>
          {user?.role === "CUSTOMER" || !user ? (
            <Link href="/orders" className="hover:text-marigold transition-colors">Track Order</Link>
          ) : null}
          {dashboardHref && (
            <Link href={dashboardHref} className="hover:text-marigold transition-colors">Dashboard</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {(!user || user.role === "CUSTOMER") && !isAppShell && (
            <Link href="/cart" className="relative px-2 py-1.5 rounded-card hover:bg-white/10 transition-colors" aria-label="Cart">
              <CartIcon />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-marigold text-ink text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <button
              onClick={async () => {
                await logout();
                router.push("/");
              }}
              className="hidden sm:inline text-sm font-medium hover:text-marigold transition-colors"
            >
              Sign out
            </button>
          ) : (
            <Link href="/login" className="hidden sm:inline text-sm font-semibold bg-marigold text-ink px-4 py-2 rounded-card hover:bg-marigoldDark transition-colors">
              Sign in
            </Link>
          )}

          <button className="md:hidden p-2" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            <MenuIcon />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-3 text-sm font-medium">
          <Link href="/menu?todaysMenu=true" onClick={() => setMenuOpen(false)}>Today&apos;s Menu</Link>
          <Link href="/menu" onClick={() => setMenuOpen(false)}>Browse</Link>
          <Link href="/orders" onClick={() => setMenuOpen(false)}>Track Order</Link>
          {dashboardHref && <Link href={dashboardHref} onClick={() => setMenuOpen(false)}>Dashboard</Link>}
          {user ? (
            <button
              className="text-left"
              onClick={async () => {
                await logout();
                setMenuOpen(false);
                router.push("/");
              }}
            >
              Sign out
            </button>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
          )}
        </div>
      )}
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
