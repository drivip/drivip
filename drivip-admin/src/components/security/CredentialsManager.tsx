"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import Toast from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PanicButton from "./PanicButton";
import { cn } from "@/lib/utils";

export default function CredentialsManager() {
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    dispatch: true,
    referrals: true,
    delivery: false,
    analytics: true,
    billing: true,
  });

  const apiKey = "dvk_live_8f3a2b1c4d5e6f7890abcdef12345678";
  const vapidPublicKey = "BEl62iUYgUivxVkvSPK2SmRjEo_9EHtLk_0ZAwM7sL5O";

  return (
    <div className="px-4 py-4 space-y-4 pb-20 lg:pb-4">
      <Toast
        message={toastMsg}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
      <ConfirmDialog
        open={showResetConfirm}
        title="Resetear Todas las Credenciales"
        message="Esto invalidara todas las API keys activas y forzara un re-login en todos los choferes. Esta accion es irreversible."
        confirmLabel="Resetear Todo"
        variant="destructive"
        onConfirm={() => {
          setShowResetConfirm(false);
          setToastMsg("Credenciales maestras reseteadas exitosamente.");
          setToastVisible(true);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary tracking-widest uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Centro de Seguridad
        </span>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-[22px] text-on-surface font-semibold tracking-tight">
          Seguridad & Credenciales
        </h1>
        <p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant leading-relaxed">
          Gestion de contrasenas, claves API y configuracion de notificaciones Push (VAPID).
        </p>
      </div>

      {/* API Key Section */}
      <div className="bg-surface-container rounded-xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase text-on-surface-variant tracking-wider">
            Clave API Maestra
          </span>
          <span className="material-symbols-outlined text-primary text-[18px]">vpn_key</span>
        </div>
        <div className="bg-surface-container-low p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-on-surface truncate">
                {apiKeyVisible
                  ? apiKey
                  : apiKey.slice(0, 12) + "••••••••••••"}
              </span>
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant mt-0.5">
                Creada: 15 Enero 2025 &bull; Ultimo uso: Hoy
              </span>
            </div>
            <button
              onClick={() => setApiKeyVisible(!apiKeyVisible)}
              className="p-1.5 rounded bg-surface-variant hover:bg-surface-bright text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">
                {apiKeyVisible ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => {
              navigator.clipboard.writeText(apiKey);
              setToastMsg("API Key copiada al portapapeles");
              setToastVisible(true);
            }}
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            Copiar
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => {
              setToastMsg("API Key regenerada exitosamente");
              setToastVisible(true);
            }}
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Regenerar
          </Button>
        </div>
      </div>

      {/* VAPID Keys Section */}
      <div className="bg-surface-container rounded-xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase text-on-surface-variant tracking-wider">
            Claves VAPID (WebPush)
          </span>
          <span className="material-symbols-outlined text-secondary text-[18px]">notifications_active</span>
        </div>
        <div className="bg-surface-container-low p-3 rounded-lg">
          <div className="flex flex-col gap-1">
            <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">
              Public Key
            </span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface break-all">
              {vapidPublicKey}
            </span>
          </div>
        </div>
        <div className="bg-surface-container-low p-3 rounded-lg">
          <div className="flex flex-col gap-1">
            <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">
              Private Key
            </span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface">
              ••••••••••••••••••••••••••••••••••••••••
            </span>
          </div>
        </div>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            setToastMsg("Claves VAPID regeneradas. Actualizar en clientes Push.");
            setToastVisible(true);
          }}
        >
          <span className="material-symbols-outlined text-[16px]">key</span>
          Regenerar Par de Claves VAPID
        </Button>
      </div>

      {/* Permission Toggles */}
      <div className="bg-surface-container rounded-xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase text-on-surface-variant tracking-wider">
            Permisos por Modulo
          </span>
          <span className="material-symbols-outlined text-primary text-[18px]">admin_panel_settings</span>
        </div>
        <div className="space-y-2">
          {Object.entries(permissions).map(([key, enabled]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className={cn("material-symbols-outlined text-[18px]", enabled ? "text-primary" : "text-outline")}>
                  {key === "dispatch"
                    ? "alt_route"
                    : key === "referrals"
                      ? "share_location"
                      : key === "delivery"
                        ? "local_shipping"
                        : key === "analytics"
                          ? "analytics"
                          : "payment"}
                </span>
                <span className={cn("font-[family-name:var(--font-geist-sans)] text-[13px]", enabled ? "text-on-surface" : "text-on-surface-variant")}>
                  {key === "dispatch"
                    ? "Despacho Multi-Chofers"
                    : key === "referrals"
                      ? "Red de Referidos"
                        : key === "delivery"
                          ? "Módulo Delivery"
                        : key === "analytics"
                          ? "Analiticas Avanzadas"
                          : "Facturacion Automatica"}
                </span>
              </div>
              <ToggleSwitch
                checked={enabled}
                onChange={() =>
                  setPermissions((prev) => ({ ...prev, [key]: !prev[key] }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Global Reset Button */}
      <Button
        variant="destructive"
        className="w-full py-3"
        onClick={() => setShowResetConfirm(true)}
      >
        <span className="material-symbols-outlined text-[18px]">lock_reset</span>
        Resetear Todas las Credenciales Maestras
      </Button>

      {/* Panic Button */}
      <PanicButton />
    </div>
  );
}
