// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = ((import.meta as any).env ?? {}) as Record<string, string | undefined>;
const isDev = (env as Record<string, unknown>).DEV === true;

const LOCAL_PATTERN = /localhost|127\.0\.0\.1/;

function resolveUrl(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  if (!isDev && LOCAL_PATTERN.test(value)) return fallback;
  return value.replace(/\/+$/, "");
}

/** URLs de producción de cada app. Se pueden sobrescribir con VITE_* en desarrollo. */
export const APP_URLS = {
  conductor: resolveUrl(env.VITE_CONDUCTOR_URL, "https://drivip-conductor.pages.dev"),
  cliente: resolveUrl(env.VITE_CLIENTE_URL, "https://drivip-cliente.pages.dev"),
} as const;
