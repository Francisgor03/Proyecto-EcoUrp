"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext({
  session: null,
  user: null,
  loading: true,
  isConfigured: Boolean(supabase),
  connectionChecked: false,
  connectionError: null,
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionChecked, setConnectionChecked] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return;
        setSession(data.session ?? null);
        setLoading(false);
        setConnectionChecked(true);
        setConnectionError(null);
      })
      .catch((error) => {
        if (!isMounted) return;
        setSession(null);
        setLoading(false);
        setConnectionChecked(true);
        setConnectionError(error ?? new Error("No se pudo verificar Supabase"));
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession ?? null);
    });

    return () => {
      isMounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isConfigured: Boolean(supabase),
      connectionChecked,
      connectionError,
      signOut: async () => {
        if (!supabase) return { error: new Error("Supabase no configurado") };
        return supabase.auth.signOut();
      },
    }),
    [session, loading, connectionChecked, connectionError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
