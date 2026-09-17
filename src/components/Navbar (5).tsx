"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

  // Lock page scroll while the mobile menu overlay is open, so the page
  // behind it can't be scrolled at the same time.
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

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

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {/* Mobile menu — a full-screen overlay above the page (backdrop +
          slide-in panel), rather than an inline block that expands the
          header and gets shown alongside the page content underneath it. */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
            onClick={closeMenu}
            aria-label="Close menu"
          />

          <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-ink text-cream shadow-2xl flex flex-col">
            <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 flex-shrink-0">
              <span className="font-display text-lg font-bold text-marigold">Menu</span>
              <button className="p-2" onClick={closeMenu} aria-label="Close menu">
                <CloseIcon />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1 text-base font-medium">
              <Link href="/menu?todaysMenu=true" onClick={closeMenu} className="px-3 py-3 rounded-card hover:bg-white/10 transition-colors">
                Today&apos;s Menu
              </Link>
              <Link href="/menu" onClick={closeMenu} className="px-3 py-3 rounded-card hover:bg-white/10 transition-colors">
                Browse
              </Link>
              {(user?.role === "CUSTOMER" || !user) && (
                <Link href="/orders" onClick={closeMenu} className="px-3 py-3 rounded-card hover:bg-white/10 transition-colors">
                  Track Order
                </Link>
              )}
              {dashboardHref && (
                <Link href={dashboardHref} onClick={closeMenu} className="px-3 py-3 rounded-card hover:bg-white/10 transition-colors">
                  Dashboard
                </Link>
              )}
            </nav>

            <div className="p-4 border-t border-white/10 flex-shrink-0">
              {user ? (
                <button
                  className="w-full text-left px-3 py-3 rounded-card hover:bg-white/10 transition-colors font-medium"
                  onClick={async () => {
                    await logout();
                    closeMenu();
                    router.push("/");
                  }}
                >
                  Sign out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="block text-center bg-marigold text-ink font-semibold px-4 py-3 rounded-card hover:bg-marigoldDark transition-colors"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
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

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
