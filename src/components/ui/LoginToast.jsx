"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const TOAST_KEY = "ecourp_login_toast";

export default function LoginToast() {
  const [visible, setVisible] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const shouldShow = window.sessionStorage.getItem(TOAST_KEY) === "1";
    if (!shouldShow) return;

    window.sessionStorage.removeItem(TOAST_KEY);
    setVisible(true);

    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, [pathname]);

  const hidden = useMemo(() => !hydrated || !visible, [hydrated, visible]);

  if (hidden) return null;

  return (
    <div className="fixed right-4 top-4 z-50 w-[min(92vw,360px)]">
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          ✓
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Iniciaste sesion</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Estas dentro de tu cuenta EcoURP.
          </p>
        </div>
        <button
          type="button"
          aria-label="Cerrar aviso"
          onClick={() => setVisible(false)}
          className="flex h-6 w-6 items-center justify-center rounded-full text-primary transition hover:bg-surface-raised"
        >
          ×
        </button>
      </div>
    </div>
  );
}
