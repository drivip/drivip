import { useState, useEffect, useCallback } from "react";
import { supabase, isConfigured } from "./client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  configured: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    configured: isConfigured,
  });

  useEffect(() => {
    if (!isConfigured) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    let active = true;
    let authEventReceived = false;

    const applySession = (session: Session | null) => {
      if (!active) return;
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
        configured: true,
      });
    };

    // onAuthStateChange emite INITIAL_SESSION al suscribirse y luego
    // SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT, etc. Mantener la sesion
    // sincronizada evita que el usuario vuelva al login al recargar.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        authEventReceived = true;
        applySession(session);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (authEventReceived) return;
      applySession(session);
    }).catch(() => {
      if (!active || authEventReceived) return;
      setState((s) => ({ ...s, loading: false, error: "Error al conectar con Supabase" }));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, error: null }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState((s) => ({ ...s, error: error.message }));
      return false;
    }
    return true;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, error: null }));
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setState((s) => ({ ...s, error: error.message }));
      return false;
    }
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { ...state, signIn, signUp, signOut };
}
