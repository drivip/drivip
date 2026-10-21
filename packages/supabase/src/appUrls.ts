// URLs públicas reales de cada app (Cloudflare Pages).
// Se pueden sobrescribir con variables VITE_* en el .env de cada app.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = ((import.meta as any).env ?? {}) as Record<string, string | undefined>;
const isDev = (env as Record<string, unknown>).DEV === true;
const LOCAL_PATTERN = /localhost|127\.0\.0\.1/;

function resolveAppUrl(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  if (!isDev && LOCAL_PATTERN.test(value)) return fallback;
  return value.replace(/\/+$/, "");
}

export const APP_URLS = {
  home: resolveAppUrl(env.VITE_HOME_URL, "https://drivip-home.pages.dev"),
  conductor: resolveAppUrl(env.VITE_CONDUCTOR_URL, "https://drivip-conductor.pages.dev"),
  cliente: resolveAppUrl(env.VITE_CLIENTE_URL, "https://drivip-cliente.pages.dev"),
  superadmin: resolveAppUrl(env.VITE_SUPERADMIN_URL, "https://drivip-superadmin.pages.dev"),
} as const;

/** Enlace que abre la app del cliente invitando a agregar a un conductor por slug. */
export function conductorInviteUrl(slug: string): string {
  return `${APP_URLS.cliente}/?add=${encodeURIComponent(slug)}`;
}
