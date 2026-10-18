"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { tarifasData, recargosData, zonasData } from "@/mockData/preciosData";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import Toast from "@/components/ui/Toast";

export default function MisPrecios() {
  const [currency, setCurrency] = useState<"Bs" | "$">("Bs");
  const [tarifas, setTarifas] = useState(
    tarifasData.map((t) => ({ ...t }))
  );
  const [recargos, setRecargos] = useState(
    recargosData.map((r) => ({ ...r }))
  );
  const [zonas, setZonas] = useState(
    zonasData.map((z) => ({ ...z }))
  );
  const [tipEnabled, setTipEnabled] = useState(false);
  const [tipPercent, setTipPercent] = useState(10);
  const [rounding, setRounding] = useState<"up" | "exact">("up");
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const tipOptions = [5, 10, 15];

  function showToast(msg: string) {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }

  const handleToggleTarifa = (index: number) => {
    setTarifas((prev) =>
      prev.map((t, i) => (i === index ? { ...t, active: !t.active } : t))
    );
  };

  const handleUpdateTarifa = (index: number, field: string, value: number) => {
    setTarifas((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const handleToggleRecargo = (index: number) => {
    setRecargos((prev) =>
      prev.map((r, i) => (i === index ? { ...r, active: !r.active } : r))
    );
  };

  const handleToggleZona = (index: number) => {
    setZonas((prev) =>
      prev.map((z, i) => (i === index ? { ...z, active: !z.active } : z))
    );
  };

  const handleUpdateZona = (index: number, value: number) => {
    setZonas((prev) =>
      prev.map((z, i) => (i === index ? { ...z, fixedFare: value } : z))
    );
  };

  const handleSave = () => {
    showToast("Precios actualizados");
  };

  return (
    <div className="bg-surface min-h-screen p-4 pb-24">
      {toastVisible && (
        <div className="fixed top-4 left-4 right-4 z-[2000] rounded-xl bg-secondary px-4 py-3 text-center font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-black shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-[22px] font-bold text-white">
            Mis Precios
          </h1>
          <p className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-wide text-neutral-400">
            Configura tus tarifas por servicio
          </p>
        </div>
        <button
          onClick={handleSave}
          className="rounded-xl bg-primary px-4 py-2 font-[family-name:var(--font-space-grotesk)] text-[12px] font-bold text-white transition-all active:scale-95"
        >
          Guardar
        </button>
      </div>

      {/* Currency selector */}
      <div className="mb-5 flex items-center gap-1 bg-surface-container rounded-xl p-1 w-fit">
        <button
          onClick={() => setCurrency("Bs")}
          className={cn(
            "px-5 py-2 rounded-lg text-[13px] font-bold font-[family-name:var(--font-geist-mono)] transition-all",
            currency === "Bs"
              ? "bg-primary text-white"
              : "text-neutral-500"
          )}
        >
          Bs
        </button>
        <button
          onClick={() => setCurrency("$")}
          className={cn(
            "px-5 py-2 rounded-lg text-[13px] font-bold font-[family-name:var(--font-geist-mono)] transition-all",
            currency === "$"
              ? "bg-primary text-white"
              : "text-neutral-500"
          )}
        >
          $
        </button>
      </div>

      {/* Tarifas por servicio — EDITABLE */}
      <div className="mb-6">
        <h2 className="mb-3 font-[family-name:var(--font-space-grotesk)] text-[15px] font-bold text-white">
          Tarifas por Servicio
        </h2>
        <div className="space-y-3">
          {tarifas.map((tarifa, index) => (
            <div
              key={tarifa.id}
              className="rounded-xl bg-surface-container p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      tarifa.active ? "bg-primary/20" : "bg-neutral-800"
                    )}
                  >
                    <span
                      className={cn(
                        "material-symbols-outlined text-[18px]",
                        tarifa.active ? "text-primary" : "text-neutral-600"
                      )}
                    >
                      {tarifa.icon}
                    </span>
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-white">
                      {tarifa.name}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={tarifa.active}
                  onChange={() => handleToggleTarifa(index)}
                />
              </div>

              {/* Editable price fields */}
              {tarifa.active && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-surface p-2">
                    <p className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-wide text-neutral-500 mb-1">
                      Base ({currency})
                    </p>
                    <input
                      type="number"
                      value={tarifa.baseFare}
                      onChange={(e) => handleUpdateTarifa(index, "baseFare", Number(e.target.value))}
                      className="w-full bg-transparent font-[family-name:var(--font-space-grotesk)] text-[14px] font-bold text-white outline-none"
                    />
                  </div>
                  <div className="rounded-lg bg-surface p-2">
                    <p className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-wide text-neutral-500 mb-1">
                      Por km ({currency})
                    </p>
                    <input
                      type="number"
                      value={tarifa.perKm}
                      onChange={(e) => handleUpdateTarifa(index, "perKm", Number(e.target.value))}
                      className="w-full bg-transparent font-[family-name:var(--font-space-grotesk)] text-[14px] font-bold text-secondary outline-none"
                    />
                  </div>
                  <div className="rounded-lg bg-surface p-2">
                    <p className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-wide text-neutral-500 mb-1">
                      Mínimo ({currency})
                    </p>
                    <input
                      type="number"
                      value={tarifa.minimum}
                      onChange={(e) => handleUpdateTarifa(index, "minimum", Number(e.target.value))}
                      className="w-full bg-transparent font-[family-name:var(--font-space-grotesk)] text-[14px] font-bold text-white outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recargos */}
      <div className="mb-6">
        <h2 className="mb-3 font-[family-name:var(--font-space-grotesk)] text-[15px] font-bold text-white">
          Recargos
        </h2>
        <div className="space-y-2">
          {recargos.map((recargo, index) => (
            <div
              key={recargo.id}
              className="rounded-xl bg-surface-container p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    recargo.active ? "bg-primary/20" : "bg-neutral-800"
                  )}
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-[18px]",
                      recargo.active ? "text-primary" : "text-neutral-600"
                    )}
                  >
                    {recargo.percentage >= 0 ? "add" : "remove"}
                  </span>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-white">
                    {recargo.name}
                  </p>
                  <p className="font-[family-name:var(--font-geist-mono)] text-[10px] text-neutral-500">
                    {recargo.condition}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "font-[family-name:var(--font-geist-mono)] text-[13px] font-bold",
                    recargo.percentage >= 0 ? "text-tertiary" : "text-secondary"
                  )}
                >
                  {recargo.percentage > 0 ? "+" : ""}
                  {recargo.percentage}%
                </span>
                <ToggleSwitch
                  checked={recargo.active}
                  onChange={() => handleToggleRecargo(index)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zonas — fare editable */}
      <div className="mb-6">
        <h2 className="mb-3 font-[family-name:var(--font-space-grotesk)] text-[15px] font-bold text-white">
          Zonas Especiales
        </h2>
        <div className="space-y-2">
          {zonas.map((zona, index) => (
            <div
              key={zona.id}
              className="rounded-xl bg-surface-container p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      zona.active ? "bg-secondary/20" : "bg-neutral-800"
                    )}
                  >
                    <span
                      className={cn(
                        "material-symbols-outlined text-[18px]",
                        zona.active ? "text-secondary" : "text-neutral-600"
                      )}
                    >
                      location_on
                    </span>
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-white">
                      {zona.name}
                    </p>
                    <p className="font-[family-name:var(--font-geist-mono)] text-[10px] text-neutral-500">
                      {zona.description}
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={zona.active}
                  onChange={() => handleToggleZona(index)}
                />
              </div>

              {zona.active && (
                <div className="ml-13 rounded-lg bg-surface p-2">
                  <p className="font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-wide text-neutral-500 mb-1">
                    Tarifa fija ({currency})
                  </p>
                  <input
                    type="number"
                    value={zona.fixedFare}
                    onChange={(e) => handleUpdateZona(index, Number(e.target.value))}
                    className="w-full bg-transparent font-[family-name:var(--font-space-grotesk)] text-[14px] font-bold text-secondary outline-none"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Configuración */}
      <div className="mb-6">
        <h2 className="mb-3 font-[family-name:var(--font-space-grotesk)] text-[15px] font-bold text-white">
          Configuración
        </h2>
        <div className="rounded-xl bg-surface-container p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-white">
                Propina Sugerida
              </p>
              <p className="font-[family-name:var(--font-geist-mono)] text-[10px] text-neutral-500">
                Sugerir propina al cliente
              </p>
            </div>
            <ToggleSwitch
              checked={tipEnabled}
              onChange={() => setTipEnabled(!tipEnabled)}
            />
          </div>

          {tipEnabled && (
            <div className="flex items-center gap-2 pl-4 border-l-2 border-primary/30">
              {tipOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setTipPercent(opt)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[13px] font-bold font-[family-name:var(--font-geist-mono)] transition-all",
                    tipPercent === opt
                      ? "bg-primary text-white"
                      : "bg-surface text-neutral-500"
                  )}
                >
                  {opt}%
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-white/5 pt-4">
            <p className="font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-white mb-2">
              Redondeo
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setRounding("up")}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-[12px] font-bold font-[family-name:var(--font-geist-mono)] transition-all",
                  rounding === "up"
                    ? "bg-primary text-white"
                    : "bg-surface text-neutral-500"
                )}
              >
                Hacia arriba
              </button>
              <button
                onClick={() => setRounding("exact")}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-[12px] font-bold font-[family-name:var(--font-geist-mono)] transition-all",
                  rounding === "exact"
                    ? "bg-primary text-white"
                    : "bg-surface text-neutral-500"
                )}
              >
                Exacto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
