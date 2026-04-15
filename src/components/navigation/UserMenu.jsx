"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";

function getInitials(label) {
  if (!label) return "E";
  const parts = label.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function UserMenu() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!user || !supabase) return;

    let isMounted = true;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!isMounted) return;
        setDisplayName(data?.display_name?.trim() || "");
        setProfileLoaded(true);
      })
      .catch(() => {
        if (!isMounted) return;
        setDisplayName("");
        setProfileLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    function handleClick(event) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target)) return;
      setOpen(false);
    }

    if (open) {
      document.addEventListener("mousedown", handleClick);
    }

    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const label = useMemo(() => {
    if (displayName) return displayName;
    if (!profileLoaded) return "Cargando";
    if (user?.email) return user.email.split("@")[0];
    return "Tu cuenta";
  }, [displayName, profileLoaded, user]);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-full border border-eco-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-eco-emerald-800 shadow-sm transition hover:bg-eco-emerald-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-eco-emerald-600 text-xs font-bold text-white">
          {profileLoaded ? getInitials(label) : "…"}
        </span>
        <span className="max-w-[140px] truncate">{label}</span>
        <span aria-hidden className="text-eco-emerald-500">▾</span>
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-eco-emerald-100 bg-white shadow-lg">
          <div className="border-b border-eco-emerald-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-400">
              Sesion activa
            </p>
            <p className="mt-1 text-sm font-semibold text-eco-emerald-900">
              {label}
            </p>
          </div>
          <div className="flex flex-col">
            <Link
              href="/perfil"
              className="px-4 py-2 text-sm text-eco-emerald-700 transition hover:bg-eco-emerald-50"
              onClick={() => setOpen(false)}
            >
              Ver perfil
            </Link>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                setOpen(false);
                router.replace("/login");
              }}
              className="px-4 py-2 text-left text-sm font-semibold text-eco-emerald-900 transition hover:bg-eco-emerald-50"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
