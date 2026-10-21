import { useMemo, useState } from "react";
import type { Driver } from "../../types/passenger";
import DriverRating from "./DriverRating";

interface VipDriversSectionProps {
  drivers: Driver[];
  selectedDriverId: string | null;
  onSelectDriver: (driver: Driver) => void;
  onRequest: (driver: Driver) => void;
  onMessage: (driver: Driver) => void;
  onShare: (driver: Driver) => void;
  onOpenAll: () => void;
}

type VipTab = "carro" | "moto";

const COLOR_SWATCHES: Record<string, string> = {
  blanco: "#f8fafc",
  negro: "#0f172a",
  gris: "#94a3b8",
  plata: "#cbd5e1",
  rojo: "#dc2626",
  azul: "#2563eb",
  verde: "#16a34a",
  amarillo: "#eab308",
  naranja: "#f97316",
  marron: "#92400e",
  café: "#92400e",
  beige: "#d6c7a1",
  vino: "#7f1d1d",
};

function swatchFor(color: string): string {
  const normalized = color.toLowerCase().trim();
  const match = Object.keys(COLOR_SWATCHES).find((name) => normalized.includes(name));
  return match ? COLOR_SWATCHES[match] : "#94a3b8";
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.463 3.488A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.423-8.413Z" />
    </svg>
  );
}

function statusStyle(status: Driver["status"]) {
  if (status === "available") {
    return {
      border: "border-emerald-300/80",
      shadow: "shadow-[0_18px_38px_-22px_rgba(16,185,129,0.55)]",
      dot: "bg-emerald-500",
      text: "text-emerald-700",
      label: "Disponible",
    };
  }
  if (status === "busy") {
    return {
      border: "border-amber-300/80",
      shadow: "shadow-[0_18px_38px_-22px_rgba(245,158,11,0.5)]",
      dot: "bg-amber-500",
      text: "text-amber-700",
      label: "Ocupado",
    };
  }
  return {
    border: "border-slate-200",
    shadow: "shadow-[0_14px_30px_-24px_rgba(15,23,42,0.4)]",
    dot: "bg-slate-400",
    text: "text-slate-500",
    label: "No disponible",
  };
}

export default function VipDriversSection({
  drivers,
  selectedDriverId,
  onSelectDriver,
  onRequest,
  onMessage,
  onShare,
  onOpenAll,
}: VipDriversSectionProps) {
  const [tab, setTab] = useState<VipTab>("carro");

  const counts = useMemo(
    () => ({
      carro: drivers.filter((driver) => driver.vehicleType !== "moto").length,
      moto: drivers.filter((driver) => driver.vehicleType === "moto").length,
    }),
    [drivers]
  );

  const visibleDrivers = useMemo(() => {
    const sameType = drivers.filter((driver) =>
      tab === "moto" ? driver.vehicleType === "moto" : driver.vehicleType !== "moto"
    );
    const vip = sameType.filter((driver) => driver.isVip);
    return (vip.length > 0 ? vip : sameType).slice(0, 4);
  }, [drivers, tab]);

  return (
    <section data-purpose="vip-drivers-section">
      <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-purple-600">
            Tu círculo de confianza
          </p>
          <h2 className="mt-0.5 text-lg font-black tracking-tight text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>
            Mi conductor VIP
          </h2>
        </div>
        <button
          type="button"
          onClick={onOpenAll}
          className="flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-600 shadow-sm active:scale-95"
        >
          Ver todos
          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
        </button>
      </div>

      <div className="mb-3 inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setTab("carro")}
          className={`flex min-h-9 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition ${
            tab === "carro" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">directions_car</span>
          Carro
          <span className={`rounded-full px-1.5 text-[10px] ${tab === "carro" ? "bg-white/20" : "bg-slate-100"}`}>
            {counts.carro}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab("moto")}
          className={`flex min-h-9 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition ${
            tab === "moto" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">two_wheeler</span>
          Moto
          <span className={`rounded-full px-1.5 text-[10px] ${tab === "moto" ? "bg-white/20" : "bg-slate-100"}`}>
            {counts.moto}
          </span>
        </button>
      </div>

      {visibleDrivers.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-5 py-7 text-center">
          <span className="material-symbols-outlined text-[30px] text-slate-300">
            {tab === "moto" ? "two_wheeler" : "directions_car"}
          </span>
          <p className="mt-2 text-xs font-bold text-slate-600">
            No hay conductores en {tab === "moto" ? "moto" : "carro"}
          </p>
          <button
            type="button"
            onClick={onOpenAll}
            className="mt-3 rounded-xl bg-slate-900 px-4 py-2.5 text-[11px] font-black text-white active:scale-95"
          >
            Buscar o agregar conductor
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleDrivers.map((driver) => {
            const status = statusStyle(driver.status);
            const selected = selectedDriverId === driver.id;
            const whatsappDigits = driver.whatsapp.replace(/\D/g, "");
            return (
              <article
                key={`vip-${driver.id}`}
                className={`relative overflow-hidden rounded-[26px] border-2 bg-white p-4 transition duration-200 hover:-translate-y-0.5 ${status.border} ${status.shadow} ${
                  selected ? "ring-2 ring-purple-500/25" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    {driver.image ? (
                      <img
                        alt={driver.name}
                        src={driver.image}
                        className="h-14 w-14 rounded-2xl border-2 border-white object-cover shadow-md"
                      />
                    ) : (
                      <span className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-black text-white shadow-md ${driver.color}`}>
                        {driver.initials}
                      </span>
                    )}
                    <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${status.dot}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-sm font-black text-slate-900">{driver.name}</h3>
                      {driver.isVip && (
                        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">
                          <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            workspace_premium
                          </span>
                          VIP
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                      {driver.vehicle}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold text-slate-500">
                      <DriverRating rating={driver.rating} reviews={driver.reviews} showLabel />
                      <span className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-full border border-slate-200" style={{ backgroundColor: swatchFor(driver.vehicleColor) }} />
                        {driver.vehicleColor}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                        {driver.plate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`mt-3 flex items-center gap-1.5 text-[11px] font-black ${status.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot} ${driver.status === "available" ? "animate-pulse" : ""}`} />
                  {status.label}
                  <span className="font-semibold text-slate-400">· {driver.availability}</span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  <a
                    href={whatsappDigits.length >= 7 ? `https://wa.me/${whatsappDigits}` : undefined}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => {
                      if (whatsappDigits.length < 7) event.preventDefault();
                    }}
                    className={`flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl border border-emerald-100 bg-emerald-50 px-1 text-[10px] font-black text-emerald-700 active:scale-95 ${
                      whatsappDigits.length >= 7 ? "" : "pointer-events-none opacity-40"
                    }`}
                  >
                    <WhatsAppIcon className="h-4 w-4 shrink-0" />
                    <span>WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => onMessage(driver)}
                    className="flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl border border-blue-100 bg-blue-50 px-1 text-[10px] font-black text-blue-700 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">sms</span>
                    <span>Mensaje</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onShare(driver)}
                    className="flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl border border-purple-100 bg-purple-50 px-1 text-[10px] font-black text-purple-700 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">share</span>
                    <span>Compartir</span>
                  </button>
                </div>

                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectDriver(driver)}
                    className={`flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-black transition active:scale-[0.98] ${
                      selected
                        ? "border border-purple-200 bg-purple-50 text-purple-700"
                        : "border border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {selected ? "check_circle" : "person_check"}
                    </span>
                    {selected ? "Seleccionado" : "Elegir"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequest(driver)}
                    className="flex h-11 flex-[1.35] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 text-xs font-black text-white shadow-md shadow-purple-700/20 active:scale-[0.98]"
                  >
                    Pedir servicio
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onOpenAll}
        className="mt-3 flex w-full items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-white p-3 text-left shadow-sm active:scale-[0.99]"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex -space-x-2">
            {drivers.slice(0, 3).map((driver) => (
              <span
                key={`stack-${driver.id}`}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-black text-white shadow-sm ${driver.color}`}
              >
                {driver.initials}
              </span>
            ))}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-slate-800">Ver otros conductores</p>
            <p className="truncate text-[10px] font-semibold text-slate-400">
              Tu lista completa, con búsqueda y QR
            </p>
          </div>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
          <span className="material-symbols-outlined text-[16px]">group_add</span>
        </span>
      </button>
    </section>
  );
}
