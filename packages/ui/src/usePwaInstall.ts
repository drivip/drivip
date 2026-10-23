import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "drivip:pwa-install-dismissed-at";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia?.("(display-mode: standalone)");
  if (media?.matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export interface PwaInstallState {
  installed: boolean;
  isIos: boolean;
  canPrompt: boolean;
  dismissed: boolean;
  show: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  dismiss: () => void;
}

export function usePwaInstall(): PwaInstallState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [isIos, setIsIos] = useState(isIosDevice);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setIsIos(isIosDevice());
    setInstalled(isStandalone());

    const media = window.matchMedia?.("(display-mode: standalone)");
    const onDisplayModeChange = () => setInstalled(isStandalone());
    media?.addEventListener?.("change", onDisplayModeChange);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    try {
      const raw = window.localStorage.getItem(DISMISS_KEY);
      const at = raw ? Number(raw) : 0;
      setDismissed(Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_MS);
    } catch {
      setDismissed(false);
    }

    return () => {
      media?.removeEventListener?.("change", onDisplayModeChange);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (installed) return "accepted" as const;
    if (!deferred) return "unavailable" as const;

    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);

      if (choice.outcome === "accepted") {
        setInstalled(true);
        return "accepted" as const;
      }
      return "dismissed" as const;
    } catch {
      setDeferred(null);
      return "unavailable" as const;
    }
  }, [deferred, installed]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  return {
    installed,
    isIos,
    canPrompt: Boolean(deferred),
    dismissed,
    show: !installed && !dismissed,
    promptInstall,
    dismiss,
  };
}
