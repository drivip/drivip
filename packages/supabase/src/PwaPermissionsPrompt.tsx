import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthContext } from "./AuthProvider";
import { usePushNotifications, type PushPermission } from "./usePushNotifications";

type LocalPermission = "granted" | "denied" | "prompt" | "unsupported" | "unknown";

export interface PwaPermissionsPromptProps {
  appName?: string;
  tenantId?: string | null;
  includeCamera?: boolean;
  role?: "cliente" | "conductor";
}

const SNOOZE_KEY = "drivip:pwa-permissions-snoozed-at";
const SOUND_KEY = "drivip:pwa-sound-unlocked";
const SNOOZE_MS = 24 * 60 * 60 * 1000;

function readSnoozed(): boolean {
  try {
    const raw = window.localStorage.getItem(SNOOZE_KEY);
    const at = raw ? Number(raw) : 0;
    return Number.isFinite(at) && at > 0 && Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

function readSoundUnlocked(): boolean {
  try {
    return window.localStorage.getItem(SOUND_KEY) === "1";
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia?.("(display-mode: standalone)");
  if (media?.matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints ?? 0) > 1
  );
}

function readNotificationPermission(): PushPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as PushPermission;
}

async function queryPermission(name: "geolocation" | "camera"): Promise<LocalPermission> {
  try {
    if (!navigator.permissions?.query) return "unknown";
    const status = await navigator.permissions.query({ name: name as PermissionName });
    return status.state as LocalPermission;
  } catch {
    return "unknown";
  }
}

function audioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  return win.AudioContext ?? win.webkitAudioContext ?? null;
}

function playActivationSound(): boolean {
  const AudioCtor = audioContextCtor();
  if (!AudioCtor) return false;

  try {
    const ctx = new AudioCtor();
    void ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(660, now + 0.14);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
    osc.onended = () => {
      void ctx.close().catch(() => undefined);
    };
    return true;
  } catch {
    return false;
  }
}

const STATUS_META: Record<LocalPermission, { label: string; className: string }> = {
  granted: {
    label: "Activo",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  denied: {
    label: "Bloqueado",
    className: "border-red-200 bg-red-50 text-red-600",
  },
  prompt: {
    label: "Pendiente",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  unknown: {
    label: "Pendiente",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  unsupported: {
    label: "No disponible",
    className: "border-slate-200 bg-slate-100 text-slate-500",
  },
};

function normalizeStatus(status: PushPermission | LocalPermission | "default"): LocalPermission {
  if (status === "default") return "prompt";
  return status;
}

function isReady(status: LocalPermission): boolean {
  return status === "granted" || status === "unsupported";
}

interface PermissionRowProps {
  icon: string;
  title: string;
  description: string;
  status: LocalPermission;
  actionLabel: string;
  busy: boolean;
  onAction: () => void;
}

function PermissionRow({
  icon,
  title,
  description,
  status,
  actionLabel,
  busy,
  onAction,
}: PermissionRowProps) {
  const meta = STATUS_META[status];
  const canRequest = status !== "granted" && status !== "unsupported";

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-purple-700 shadow-sm">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-black text-slate-900">{title}</p>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${meta.className}`}
          >
            {meta.label}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] font-medium leading-snug text-slate-500">{description}</p>
        {status === "denied" && (
          <p className="mt-1.5 text-[10px] font-semibold leading-snug text-amber-700">
            Está bloqueado. Actívalo manualmente desde los ajustes del navegador o del teléfono.
          </p>
        )}
        {canRequest && (
          <button
            type="button"
            onClick={onAction}
            disabled={busy}
            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-black text-purple-700 shadow-sm ring-1 ring-purple-100 transition active:scale-95 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[13px]">check_circle</span>
            {busy ? "Solicitando..." : actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Pide al usuario los permisos necesarios para que la PWA funcione:
 * notificaciones push, ubicación, cámara (si aplica) y reproducción de sonidos.
 * Solo aparece cuando la app está instalada (modo standalone).
 */
export function PwaPermissionsPrompt({
  appName = "Drivip",
  tenantId = null,
  includeCamera = false,
  role = "cliente",
}: PwaPermissionsPromptProps) {
  const { user } = useAuthContext();
  const {
    supported: pushSupported,
    subscribed: pushSubscribed,
    error: pushError,
    enable: enablePush,
  } = usePushNotifications({ tenantId });

  const [installed, setInstalled] = useState(isStandalone);
  const [checking, setChecking] = useState(true);
  const [notification, setNotification] = useState<LocalPermission>(() =>
    normalizeStatus(readNotificationPermission()),
  );
  const [location, setLocation] = useState<LocalPermission>("unknown");
  const [camera, setCamera] = useState<LocalPermission>("unknown");
  const [soundUnlocked, setSoundUnlocked] = useState(readSoundUnlocked);
  const [snoozed, setSnoozed] = useState(readSnoozed);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const autoSubscribeRef = useRef(false);

  const wantsCamera = includeCamera && (isMobileDevice() || camera === "granted");
  const soundSupported = Boolean(audioContextCtor());
  const soundStatus: LocalPermission = soundUnlocked
    ? "granted"
    : soundSupported
      ? "prompt"
      : "unsupported";

  const allReady =
    isReady(notification) &&
    isReady(location) &&
    (!wantsCamera || isReady(camera)) &&
    isReady(soundStatus);

  const refreshPermissions = useCallback(async () => {
    setNotification(normalizeStatus(readNotificationPermission()));
    const [geo, cam] = await Promise.all([
      queryPermission("geolocation"),
      includeCamera ? queryPermission("camera") : Promise.resolve<LocalPermission>("unknown"),
    ]);
    setLocation(geo);
    setCamera(cam);
    setChecking(false);
  }, [includeCamera]);

  useEffect(() => {
    const onInstalled = () => setInstalled(true);
    const media = window.matchMedia?.("(display-mode: standalone)");
    const onDisplayModeChange = () => setInstalled(isStandalone());
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refreshPermissions();
    };

    setInstalled(isStandalone());
    media?.addEventListener?.("change", onDisplayModeChange);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("focus", onVisibilityChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    void refreshPermissions();

    return () => {
      media?.removeEventListener?.("change", onDisplayModeChange);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("focus", onVisibilityChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshPermissions]);

  useEffect(() => {
    if (!installed || checking) return;
    setOpen(!allReady && !snoozed);
  }, [installed, checking, allReady, snoozed]);

  useEffect(() => {
    if (
      !installed ||
      !user ||
      autoSubscribeRef.current ||
      !pushSupported ||
      pushSubscribed ||
      notification !== "granted"
    ) {
      return;
    }
    autoSubscribeRef.current = true;
    void enablePush();
  }, [
    installed,
    user,
    pushSupported,
    pushSubscribed,
    notification,
    enablePush,
  ]);

  const requestNotifications = useCallback(async () => {
    setMessage(null);
    if (!pushSupported) {
      setNotification("unsupported");
      return;
    }

    const current = readNotificationPermission();
    if (current === "granted") {
      setNotification("granted");
      await enablePush();
      return;
    }

    let result: NotificationPermission = current === "denied" ? "denied" : "default";
    if (current !== "denied") {
      try {
        result = await Notification.requestPermission();
      } catch {
        result = "default";
      }
    }

    setNotification(normalizeStatus(result as PushPermission));
    if (result === "granted") {
      await enablePush();
      setNotification(normalizeStatus(readNotificationPermission()));
    }
  }, [enablePush, pushSupported]);

  const requestLocation = useCallback(async () => {
    setMessage(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation("unsupported");
      return;
    }

    const ok = await new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });

    const status = await queryPermission("geolocation");
    setLocation(status === "unknown" ? (ok ? "granted" : "denied") : status);
    if (!ok) {
      setMessage("No pudimos confirmar tu ubicación. Revisa el permiso de ubicación.");
    }
  }, []);

  const requestCamera = useCallback(async () => {
    setMessage(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera("unsupported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      stream.getTracks().forEach((track) => track.stop());
      setCamera("granted");
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setCamera("denied");
      } else if (name === "NotFoundError" || name === "NotSupportedError") {
        setCamera("unsupported");
      } else {
        setCamera("unknown");
      }
    }
  }, []);

  const requestSound = useCallback(() => {
    setMessage(null);
    const ok = playActivationSound();
    setSoundUnlocked(ok);
    if (!ok) {
      setMessage("Tu navegador no permite reproducir sonidos en este dispositivo.");
      return;
    }
    try {
      window.localStorage.setItem(SOUND_KEY, "1");
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  const activateAll = useCallback(() => {
    setBusy("all");
    setMessage(null);

    // Iniciamos todas las solicitudes dentro del mismo gesto del usuario para
    // que el navegador (especialmente en iOS) permita mostrar cada permiso.
    if (!soundUnlocked) requestSound();

    const tasks: Promise<void>[] = [];
    if (notification !== "granted") tasks.push(requestNotifications());
    if (location !== "granted") tasks.push(requestLocation());
    if (wantsCamera && camera !== "granted") tasks.push(requestCamera());

    void Promise.allSettled(tasks).finally(() => {
      setBusy(null);
      void refreshPermissions();
    });
  }, [
    soundUnlocked,
    requestSound,
    notification,
    location,
    camera,
    requestNotifications,
    requestLocation,
    requestCamera,
    wantsCamera,
    refreshPermissions,
  ]);

  const runSingle = useCallback((id: string, action: () => void | Promise<void>) => {
    setBusy(id);
    void Promise.resolve(action()).finally(() => setBusy(null));
  }, []);

  const snooze = useCallback(() => {
    setSnoozed(true);
    setOpen(false);
    try {
      window.localStorage.setItem(SNOOZE_KEY, String(Date.now()));
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  if (!open || typeof document === "undefined") return null;

  const notice = message ?? pushError;
  const locationDescription =
    role === "conductor"
      ? "Para que tus clientes vean tu ubicación y puedas recibir viajes cercanos."
      : "Para mostrarte los conductores cerca de ti y calcular tu ruta.";

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-permissions-title"
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25">
            <span className="material-symbols-outlined text-[26px]">verified_user</span>
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="pwa-permissions-title" className="text-lg font-black leading-tight text-slate-900">
              Activa los permisos de {appName}
            </h2>
            <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
              Solo toma unos segundos. Necesitamos estos accesos para que la app funcione al 100 % y
              no pierdas viajes, mensajes ni avisos.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          <PermissionRow
            icon="notifications_active"
            title="Notificaciones"
            description="Recibe avisos de viajes y mensajes aunque la app esté cerrada."
            status={notification}
            actionLabel="Activar"
            busy={busy === "notifications"}
            onAction={() => runSingle("notifications", requestNotifications)}
          />
          <PermissionRow
            icon="location_on"
            title="Ubicación"
            description={locationDescription}
            status={location}
            actionLabel="Activar"
            busy={busy === "location"}
            onAction={() => runSingle("location", requestLocation)}
          />
          {wantsCamera && (
            <PermissionRow
              icon="photo_camera"
              title="Cámara"
              description="Para escanear el QR de tus conductores y agregarlos a tu red."
              status={camera}
              actionLabel="Activar"
              busy={busy === "camera"}
              onAction={() => runSingle("camera", requestCamera)}
            />
          )}
          <PermissionRow
            icon="volume_up"
            title="Sonidos y vibración"
            description="Para que las alertas suenen y vibren al recibir un viaje o mensaje."
            status={soundStatus}
            actionLabel="Probar sonido"
            busy={busy === "sound"}
            onAction={() => runSingle("sound", requestSound)}
          />
        </div>

        {notice && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
            {notice}
          </p>
        )}

        <button
          type="button"
          onClick={() => void activateAll()}
          disabled={busy !== null || allReady}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-700 py-3 text-[13px] font-black text-white shadow-lg shadow-purple-700/25 transition active:scale-[0.98] disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[18px]">
            {allReady ? "task_alt" : "done_all"}
          </span>
          {busy === "all" ? "Activando..." : allReady ? "Permisos activados" : "Activar todos los permisos"}
        </button>

        <button
          type="button"
          onClick={snooze}
          className="mt-2 w-full rounded-2xl py-2.5 text-[11px] font-bold text-slate-500 transition hover:bg-slate-100"
        >
          Ahora no
        </button>

        <p className="mt-2 text-center text-[10px] font-medium leading-relaxed text-slate-400">
          Si un permiso aparece bloqueado, ábrelo en los ajustes del navegador o del teléfono y
          actívalo manualmente.
        </p>
      </div>
    </div>
  );
}
