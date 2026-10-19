import { useCallback, useEffect, useState } from "react";
import { supabase, isConfigured } from "./client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (import.meta as any).env as Record<string, string> | undefined;
const VAPID_PUBLIC_KEY = env?.VITE_VAPID_PUBLIC_KEY;

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export interface UsePushNotificationsOptions {
  tenantId?: string | null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i += 1) output[i] = rawData.charCodeAt(i);
  return output;
}

export function usePushNotifications(options: UsePushNotificationsOptions = {}) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<PushPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      Boolean(VAPID_PUBLIC_KEY);

    setSupported(ok);
    if (!ok) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission as PushPermission);
    navigator.serviceWorker
      .getRegistration("/sw.js")
      .then(async (reg) => {
        const sub = await reg?.pushManager.getSubscription();
        setSubscribed(Boolean(sub));
      })
      .catch(() => undefined);
  }, []);

  const enable = useCallback(async () => {
    setError(null);
    if (!supported) {
      setError("Tu navegador no soporta notificaciones push");
      return false;
    }
    if (!isConfigured) {
      setError("Supabase no esta configurado");
      return false;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Inicia sesion para activar las notificaciones");
        return false;
      }

      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== "granted") {
        setError("Permiso de notificaciones denegado");
        return false;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY as string),
        }));

      const json = sub.toJSON();
      const tenantId =
        options.tenantId ??
        ((user.app_metadata?.tenant_id as string | undefined) ?? null);

      const { error: dbError } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          tenant_id: tenantId,
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
          user_agent: navigator.userAgent,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "user_id,endpoint" },
      );

      if (dbError) {
        setError(dbError.message);
        return false;
      }

      setSubscribed(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al activar notificaciones");
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported, options.tenantId]);

  const disable = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe().catch(() => undefined);
        await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
      }
      setSubscribed(false);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al desactivar notificaciones");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { supported, permission, subscribed, loading, error, enable, disable };
}
