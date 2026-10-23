/**
 * Registra el service worker de la PWA. Es necesario para que el
 * navegador permita instalar la app y para recibir notificaciones push.
 * No bloquea el arranque de la aplicación si falla.
 */
export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const register = () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* La app sigue funcionando sin service worker. */
    });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}
