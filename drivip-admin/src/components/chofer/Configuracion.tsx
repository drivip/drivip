"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import Toast from "@/components/ui/Toast";

interface ToggleState {
  [key: string]: boolean;
}

export default function Configuracion() {
  const [toasts, setToasts] = useState<{ id: number; message: string; variant?: "success" | "error" | "info" }[]>([]);

  const showToast = (message: string, variant?: "success" | "error" | "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const [notifications, setNotifications] = useState<ToggleState>({
    nueva_carrera: true,
    pago_recibido: true,
    aliado_acepto: true,
    recordatorio_pago: true,
    promociones: false,
    actualizaciones: true,
  });

  const [privacy, setPrivacy] = useState<ToggleState>({
    mostrar_mapa: true,
    mostrar_telefono: false,
    mostrar_calificacion: true,
    compartir_ubicacion: true,
  });

  const [mapSettings, setMapSettings] = useState<ToggleState>({
    auto_centrear: true,
    mostrar_trafico: false,
  });

  const [coverageRadius, setCoverageRadius] = useState(5);

  const handleNotificationChange = (key: string, checked: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: checked }));
    showToast("Configuracion actualizada", "success");
  };

  const handlePrivacyChange = (key: string, checked: boolean) => {
    setPrivacy((prev) => ({ ...prev, [key]: checked }));
    showToast("Configuracion actualizada", "success");
  };

  const handleMapChange = (key: string, checked: boolean) => {
    setMapSettings((prev) => ({ ...prev, [key]: checked }));
    showToast("Configuracion actualizada", "success");
  };

  const handleRadiusChange = (value: number) => {
    setCoverageRadius(value);
  };

  const handleRadiusCommit = () => {
    showToast(`Radio de cobertura actualizado a ${coverageRadius} km`, "success");
  };

  const notificationItems = [
    { key: "nueva_carrera", label: "Nueva carrera" },
    { key: "pago_recibido", label: "Pago recibido" },
    { key: "aliado_acepto", label: "Aliado acepto pasaje" },
    { key: "recordatorio_pago", label: "Recordatorio pago" },
    { key: "promociones", label: "Promociones" },
    { key: "actualizaciones", label: "Actualizaciones sistema" },
  ];

  const privacyItems = [
    { key: "mostrar_mapa", label: "Mostrar en mapa" },
    { key: "mostrar_telefono", label: "Mostrar telefono" },
    { key: "mostrar_calificacion", label: "Mostrar calificacion" },
    { key: "compartir_ubicacion", label: "Compartir ubicacion aliados" },
  ];

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-white">
          Configuracion
        </h1>

        <div className="bg-surface-container rounded-xl p-6">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-white mb-4">
            Notificaciones
          </h2>
          <div className="space-y-4">
            {notificationItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between py-2"
              >
                <span className="font-[family-name:var(--font-geist-sans)] text-white">
                  {item.label}
                </span>
                <ToggleSwitch
                  checked={notifications[item.key]}
                  onChange={(checked) => handleNotificationChange(item.key, checked)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container rounded-xl p-6">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-white mb-4">
            Privacidad
          </h2>
          <div className="space-y-4">
            {privacyItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between py-2"
              >
                <span className="font-[family-name:var(--font-geist-sans)] text-white">
                  {item.label}
                </span>
                <ToggleSwitch
                  checked={privacy[item.key]}
                  onChange={(checked) => handlePrivacyChange(item.key, checked)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container rounded-xl p-6">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-white mb-4">
            Mapa
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="font-[family-name:var(--font-geist-sans)] text-white">
                Auto-centrar
              </span>
              <ToggleSwitch
                checked={mapSettings.auto_centrear}
                onChange={(checked) => handleMapChange("auto_centrear", checked)}
              />
            </div>

            <div className="py-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-[family-name:var(--font-geist-sans)] text-white">
                  Radio de cobertura
                </span>
                <span className="font-[family-name:var(--font-geist-mono)] text-primary">
                  {coverageRadius} km
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={coverageRadius}
                onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                onMouseUp={handleRadiusCommit}
                onTouchEnd={handleRadiusCommit}
                className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-1">
                <span className="font-[family-name:var(--font-geist-mono)] text-xs text-neutral-500">
                  1 km
                </span>
                <span className="font-[family-name:var(--font-geist-mono)] text-xs text-neutral-500">
                  10 km
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="font-[family-name:var(--font-geist-sans)] text-white">
                Mostrar trafico
              </span>
              <ToggleSwitch
                checked={mapSettings.mostrar_trafico}
                onChange={(checked) => handleMapChange("mostrar_trafico", checked)}
              />
            </div>
          </div>
        </div>

        <div className="bg-surface-container rounded-xl p-6">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-white mb-4">
            Seguridad
          </h2>
          <div className="space-y-3">
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => showToast("Funcionalidad de cambio de contrasena en desarrollo", "info")}
            >
              <span className="material-symbols-outlined mr-2">lock</span>
              Cambiar contrasena
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => showToast("Funcionalidad de configurar PIN en desarrollo", "info")}
            >
              <span className="material-symbols-outlined mr-2">pin</span>
              Configurar PIN
            </Button>
          </div>
        </div>

        <Button
          variant="destructive"
          className="w-full"
          onClick={() => showToast("Sesion cerrada correctamente", "success")}
        >
          Cerrar Sesion
        </Button>

        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            visible={true}
            variant={toast.variant}
            onDismiss={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          />
        ))}
      </div>
    </div>
  );
}
