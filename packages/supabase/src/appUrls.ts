// URLs públicas reales de cada app (Cloudflare Pages).
// Se pueden sobrescribir con variables VITE_* en el .env de cada app.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = ((import.meta as any).env ?? {}) as Record<string, string | undefined>;

export const APP_URLS = {
  home: env.VITE_HOME_URL ?? "https://drivip-home.pages.dev",
  conductor: env.VITE_CONDUCTOR_URL ?? "https://drivip-conductor.pages.dev",
  cliente: env.VITE_CLIENTE_URL ?? "https://drivip-cliente.pages.dev",
  superadmin: env.VITE_SUPERADMIN_URL ?? "https://drivip-superadmin.pages.dev",
  comercio: env.VITE_COMERCIO_URL ?? "https://drivip-comercio.pages.dev",
} as const;

/** Enlace que abre la app del cliente invitando a agregar a un conductor por slug. */
export function conductorInviteUrl(slug: string): string {
  return `${APP_URLS.cliente}/?add=${encodeURIComponent(slug)}`;
}
