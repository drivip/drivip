"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function PanicButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [executing, setExecuting] = useState(false);

  const handlePanic = () => {
    setExecuting(true);
    setShowConfirm(false);
    setToastMsg("Ejecutando protocolo de emergencia... Cerrando todas las sesiones activas...");
    setToastVisible(true);
    setTimeout(() => {
      setToastMsg("328 sesiones activas cerradas remotamente. Todos los choferes fueron desconectados.");
      setToastVisible(true);
      setExecuting(false);
    }, 2000);
  };

  return (
    <>
      <Toast message={toastMsg} visible={toastVisible} onDismiss={() => setToastVisible(false)} />
      <ConfirmDialog
        open={showConfirm}
        title="Botón de Pánico — Cerrar Todas las Sesiones"
        message="Esto cerrará TODAS las sesiones activas de choferes y líneas de taxi de forma remota. Los usuarios deberán volver a iniciar sesión. ¿Continuar?"
        confirmLabel="Ejecutar Protocolo"
        variant="destructive"
        onConfirm={handlePanic}
        onCancel={() => setShowConfirm(false)}
      />

      <div className="bg-surface-container rounded-xl p-4 shadow-md border-2 border-error/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[20px]">panic</span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase text-on-surface-variant tracking-wider">
              Botón de Pánico
            </span>
          </div>
          <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-error bg-error-container/20 px-2 py-0.5 rounded-full font-semibold">
            EMERGENCIA
          </span>
        </div>

        <p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant leading-relaxed">
          Cierra remotamente todas las sesiones activas de choferes y líneas. Use en caso de brecha de seguridad o acceso no autorizado.
        </p>

        <Button
          variant="destructive"
          className="w-full py-3"
          disabled={executing}
          onClick={() => setShowConfirm(true)}
        >
          <span className="material-symbols-outlined text-[18px]">panic</span>
          {executing ? "Ejecutando..." : "Activar Botón de Pánico"}
        </Button>
      </div>
    </>
  );
}
