"use client";

import { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import UserMenu from "@/components/navigation/UserMenu";

const HOME_SCROLL_TOP_THRESHOLD = 56;
const HOME_SCROLL_DELTA = 10;
/** Tras saltar a una sección (#reciclaje, #separacion) el scroll animado disparaba deltas raros y el espaciador 0↔alto movía el layout: suprimimos auto-ocultar un instante. */
const ANCHOR_SCROLL_SUPPRESS_MS = 900;

function linkClassName(active) {
  return active
    ? "rounded-full bg-eco-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm lg:px-4"
    : "rounded-full px-3.5 py-2 text-sm font-medium text-eco-emerald-800 transition hover:bg-eco-emerald-100 lg:px-4";
}

export default function HomeHeader() {
  const pathname = usePathname() || "";
  const isHome = pathname === "/";
  const navLinks = useMemo(() => {
    return [
      { href: isHome ? "#reciclaje" : "/#reciclaje", label: "Reciclaje", isAnchor: true },
      { href: isHome ? "#separacion" : "/#separacion", label: "Separación", isAnchor: true },
      { href: "/game", label: "Jugar", isAnchor: false },
      { href: "/ranking", label: "Ranking", isAnchor: false },
      { href: "/perfil", label: "Perfil", isAnchor: false },
    ];
  }, [isHome]);
  const { session, loading, isConfigured } = useAuth();
  const { theme, toggle } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [homeHeaderHidden, setHomeHeaderHidden] = useState(false);
  const [homeSpacerPx, setHomeSpacerPx] = useState(64);
  const menuRef = useRef(null);
  const lastScrollY = useRef(0);
  const suppressAutoHideUntil = useRef(0);

  const beginAnchorNavigation = useCallback(() => {
    if (!isHome) return;
    suppressAutoHideUntil.current = Date.now() + ANCHOR_SCROLL_SUPPRESS_MS;
    setHomeHeaderHidden(false);
    if (typeof window !== "undefined") {
      lastScrollY.current = window.scrollY;
    }
  }, [isHome]);

  useLayoutEffect(() => {
    if (!isHome) return;
    const el = menuRef.current;
    if (!el) return;
    const update = () => setHomeSpacerPx(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isHome, mobileMenuOpen]);

  useEffect(() => {
    if (!isHome) {
      setHomeHeaderHidden(false);
      return;
    }
    lastScrollY.current = typeof window !== "undefined" ? window.scrollY : 0;

    function onScroll() {
      if (mobileMenuOpen) return;
      const y = window.scrollY;
      const now = Date.now();
      if (now < suppressAutoHideUntil.current) {
        lastScrollY.current = y;
        return;
      }
      const delta = y - lastScrollY.current;
      lastScrollY.current = y;

      if (y < HOME_SCROLL_TOP_THRESHOLD) {
        setHomeHeaderHidden(false);
        return;
      }
      if (delta > HOME_SCROLL_DELTA) setHomeHeaderHidden(true);
      else if (delta < -HOME_SCROLL_DELTA) setHomeHeaderHidden(false);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome, mobileMenuOpen]);

  useEffect(() => {
    if (!isHome) return;
    function onHashChange() {
      beginAnchorNavigation();
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [isHome, beginAnchorNavigation]);

  useEffect(() => {
    if (mobileMenuOpen) setHomeHeaderHidden(false);
  }, [mobileMenuOpen]);

  // Close menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileMenuOpen]);

  // Close menu on escape
  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleKey(event) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileMenuOpen]);

  // Close menu on resize to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const homeHidden = isHome && homeHeaderHidden && !mobileMenuOpen;
  const positionClasses = isHome
    ? "fixed top-0 left-0 right-0"
    : "sticky top-0";
  const translateClasses = homeHidden ? "-translate-y-full" : "translate-y-0";

  return (
    <>
      {isHome ? (
        <div
          aria-hidden
          className="shrink-0"
          style={{ height: homeSpacerPx }}
        />
      ) : null}
      <header
        ref={menuRef}
        className={`${positionClasses} z-40 border-b border-eco-emerald-200/80 bg-eco-emerald-50/95 backdrop-blur-md transition-transform duration-300 ease-out ${translateClasses}`}
      >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 rounded-xl px-1 py-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-eco-emerald-600 text-base font-bold text-white shadow-sm sm:h-10 sm:w-10 sm:text-lg">
            E
          </span>
          <span className="text-lg font-bold tracking-tight text-eco-emerald-900 sm:text-xl">
            EcoURP
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex lg:gap-2">
          {navLinks.map((link) => {
            const active = !link.isAnchor && pathname === link.href;
            return link.isAnchor ? (
              <a
                key={link.label}
                href={link.href}
                className={linkClassName(false)}
                onClick={isHome ? beginAnchorNavigation : undefined}
              >
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className={linkClassName(active)} aria-current={active ? "page" : undefined}>
                {link.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={toggle}
            className="ml-1 inline-flex items-center gap-2 rounded-full border border-eco-emerald-200 bg-white px-3.5 py-2 text-sm font-semibold text-eco-emerald-800 shadow-sm transition hover:bg-eco-emerald-50"
            aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414m0-11.314L7.05 7.05m10.9 10.9 1.414 1.414" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
            <span className="hidden lg:inline">{theme === "dark" ? "Claro" : "Oscuro"}</span>
          </button>

          {!loading && isConfigured && session ? (
            <UserMenu />
          ) : (
            <Link
              href="/login"
              className="ml-1 rounded-full bg-eco-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-eco-emerald-700"
            >
              Iniciar sesión
            </Link>
          )}
        </nav>

        {/* Mobile hamburger button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-eco-emerald-200 bg-white text-eco-emerald-800 shadow-sm transition hover:bg-eco-emerald-50 md:hidden"
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="border-t border-eco-emerald-200/60 bg-eco-emerald-50/95 px-4 pb-5 pt-3 backdrop-blur-md md:hidden">
          <nav className="flex flex-col items-end gap-1">
            {navLinks.map((link) => {
              const active = !link.isAnchor && pathname === link.href;
              return link.isAnchor ? (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => {
                    if (isHome) beginAnchorNavigation();
                    setMobileMenuOpen(false);
                  }}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-eco-emerald-800 transition hover:bg-eco-emerald-100"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active ? "bg-eco-emerald-600 text-white" : "text-eco-emerald-800 hover:bg-eco-emerald-100"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-3 flex flex-col gap-2 border-t border-eco-emerald-200/60 pt-3">
            <button
              type="button"
              onClick={() => {
                toggle();
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-eco-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-eco-emerald-800 shadow-sm transition hover:bg-eco-emerald-50"
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414m0-11.314L7.05 7.05m10.9 10.9 1.414 1.414" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
              {theme === "dark" ? "Modo claro" : "Modo oscuro"}
            </button>

            <div className="flex items-center justify-end">
            {!loading && isConfigured && session ? (
              <UserMenu />
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-xl bg-eco-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-eco-emerald-700"
              >
                Iniciar sesión
              </Link>
            )}
            </div>
          </div>
        </div>
      )}
    </header>
    </>
  );
}
