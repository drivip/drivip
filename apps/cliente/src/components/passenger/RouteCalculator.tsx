import { useMemo, useState, useEffect } from "react";
import type { TarifasTenant } from "@drivip/types";
import type { Driver } from "../../types/passenger";
import {
  calcularTarifaKm,
  formatearUsd,
  formatearBs,
  TASA_BCV_REFERENCIA,
  DEFAULT_TARIFA_BASE,
  DEFAULT_TARIFA_POR_KM,
} from "@drivip/types";

interface RouteCalculatorProps {
  onOpenMap: () => void;
  onOpenOriginMap?: () => void;
  onUseCurrentLocation?: () => void;
  originIsCurrent?: boolean;
  distanceKm: number;
  distance: string;
  tarifas?: TarifasTenant | null;
  tasa?: number | null;
  canRequest?: boolean;
  driverWhatsapp?: string | null;
  drivers?: Driver[];
  selectedDriverId?: string | null;
  onSelectDriver?: (driver: Driver) => void;
  onAddDriver?: () => void;
  onRequestRide: (detalle: {
    precioUsd: number;
    metodoPago: "usd" | "bs" | "pmovil";
    programadaPara?: string;
  }) => void;
  onToggleSchedule: (mode: "now" | "schedule") => void;
  initialTripMode?: "now" | "schedule";
  origin?: string;
  destination?: string;
  stops?: string[];
}

function localDateInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function RouteCalculator({
  onOpenMap,
  onOpenOriginMap,
  onUseCurrentLocation,
  originIsCurrent = false,
  distanceKm,
  distance,
  tarifas,
  tasa,
  canRequest = false,
  driverWhatsapp,
  drivers = [],
  selectedDriverId,
  onSelectDriver,
  onAddDriver,
  onRequestRide,
  onToggleSchedule,
  initialTripMode = "now",
  origin: originProp,
  destination: destinationProp,
  stops: stopsProp,
}: RouteCalculatorProps) {
  const [tripMode, setTripMode] = useState<"now" | "schedule">(initialTripMode);
  const [origin, setOrigin] = useState(originProp ?? "Mi ubicación actual");
  const [destination, setDestination] = useState(destinationProp ?? "");
  const [stops, setStops] = useState<string[]>(stopsProp ?? []);
  const [paymentMethod, setPaymentMethod] = useState<"usd" | "bs" | "pmovil">("usd");
  const [showPagoMovil, setShowPagoMovil] = useState(false);
  const [zonaId, setZonaId] = useState<string>("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("08:30");
  const [formError, setFormError] = useState("");

  const minDate = useMemo(() => localDateInput(new Date()), []);

  useEffect(() => {
    const zonas = tarifas?.zonas ?? [];
    if (zonas.length === 0) {
      setZonaId("");
      return;
    }
    setZonaId((prev) => (zonas.some((z) => z.id === prev) ? prev : zonas[0].id));
  }, [tarifas]);

  useEffect(() => {
    if (originProp !== undefined) setOrigin(originProp);
  }, [originProp]);

  useEffect(() => {
    if (destinationProp !== undefined) {
      setDestination(destinationProp);
      if (destinationProp.trim()) setFormError("");
    }
  }, [destinationProp]);

  useEffect(() => {
    if (stopsProp !== undefined) setStops(stopsProp);
  }, [stopsProp]);

  useEffect(() => {
    setTripMode(initialTripMode);
    setFormError("");
  }, [initialTripMode]);

  const zonaSeleccionada = tarifas?.zonas.find((z) => z.id === zonaId) ?? tarifas?.zonas[0];
  const hasDestination = Boolean(destination.trim()) && canRequest;
  const selectedDriver = drivers.find((driver) => driver.id === selectedDriverId) ?? null;
  const hasDriver = Boolean(selectedDriver);

  const precioUsd = tarifas
    ? tarifas.modo === "zona"
      ? Number(zonaSeleccionada?.precio ?? 0)
      : calcularTarifaKm(tarifas.base, tarifas.por_km, distanceKm)
    : calcularTarifaKm(DEFAULT_TARIFA_BASE, DEFAULT_TARIFA_POR_KM, distanceKm);

  const hasFare =
    hasDestination &&
    (tarifas?.modo === "zona" ? Boolean(zonaSeleccionada) : distanceKm > 0);

  const fareUsd = hasFare ? formatearUsd(precioUsd) : "—";
  const fareBs = hasFare ? formatearBs(precioUsd, tasa ?? undefined) : "—";

  const paymentLabel =
    paymentMethod === "usd" ? "Efectivo USD" : paymentMethod === "bs" ? "Efectivo Bs" : "Pago Móvil";

  const whatsappHref = useMemo(() => {
    const digits = (driverWhatsapp ?? "").replace(/\D/g, "");
    if (digits.length < 7) return null;
    const text = encodeURIComponent("Hola, acabo de solicitar un viaje en Drivip. Te envío el capture del pago.");
    return `https://wa.me/${digits}?text=${text}`;
  }, [driverWhatsapp]);

  const handleToggle = (mode: "now" | "schedule") => {
    setTripMode(mode);
    setFormError("");
    onToggleSchedule(mode);
  };

  const handlePayment = (method: "usd" | "bs" | "pmovil") => {
    setPaymentMethod(method);
    setShowPagoMovil(method === "pmovil");
  };

  const handleSubmit = () => {
    setFormError("");

    if (!hasDestination) {
      setFormError("Elige tu destino en el mapa para continuar.");
      onOpenMap();
      return;
    }

    if (!hasDriver) {
      setFormError("Agrega o elige un conductor de tu círculo para continuar.");
      onAddDriver?.();
      return;
    }

    if (!hasFare) {
      setFormError("El conductor aún no tiene una tarifa disponible.");
      return;
    }

    let programadaPara: string | undefined;

    if (tripMode === "schedule") {
      if (!scheduleDate) {
        setFormError("Elige la fecha de tu reserva.");
        return;
      }
      const when = new Date(`${scheduleDate}T${scheduleTime || "08:00"}:00`);
      if (Number.isNaN(when.getTime())) {
        setFormError("La fecha u hora de la reserva no es válida.");
        return;
      }
      if (when.getTime() <= Date.now()) {
        setFormError("La reserva debe ser para una fecha y hora futura.");
        return;
      }
      programadaPara = when.toISOString();
    }

    onRequestRide({ precioUsd, metodoPago: paymentMethod, programadaPara });
  };

  return (
    <section
      className="space-y-4"
      data-purpose="route-calculator"
    >
      <div className="grid grid-cols-2 rounded-2xl border border-slate-200/60 bg-slate-100/90 p-1" role="tablist">
        <button
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all lg:py-3 lg:text-sm ${
            tripMode === "now" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
          role="tab"
          aria-selected={tripMode === "now"}
          onClick={() => handleToggle("now")}
        >
          <svg className="h-4 w-4 fill-amber-500 text-amber-500" viewBox="0 0 20 20">
            <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
          </svg>
          Pedir ahora
        </button>
        <button
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all lg:py-3 lg:text-sm ${
            tripMode === "schedule" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
          role="tab"
          aria-selected={tripMode === "schedule"}
          onClick={() => handleToggle("schedule")}
        >
          <svg className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          Programar
        </button>
      </div>

      {tripMode === "schedule" && (
        <div className="space-y-2 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs lg:p-4">
          <div className="flex items-center justify-between font-semibold text-indigo-950">
            <span>Fecha y hora de recogida</span>
            <span className="rounded-full bg-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
              Reserva
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              aria-label="Fecha de la reserva"
              className="w-full rounded-xl border border-indigo-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500"
              type="date"
              min={minDate}
              value={scheduleDate}
              onChange={(event) => setScheduleDate(event.target.value)}
            />
            <input
              aria-label="Hora de la reserva"
              className="w-full rounded-xl border border-indigo-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500"
              type="time"
              value={scheduleTime}
              onChange={(event) => setScheduleTime(event.target.value)}
            />
          </div>
        </div>
      )}

      <div className="relative">
        {stops.length > 0 && (
          <div className="absolute bottom-10 left-[29px] top-10 w-0.5 bg-slate-200 lg:left-[37px]" />
        )}

        <div className="space-y-0">
          <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/90 p-3 lg:p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 lg:h-10 lg:w-10">
              <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" strokeWidth="3" />
                <path d="M12 2v3m0 14v3m10-10h-3M5 12H2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Punto de origen
                </span>
                {originIsCurrent && (
                  <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-purple-700">
                    Predeterminada
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onOpenOriginMap ?? onOpenMap}
                className="w-full truncate text-left text-xs font-bold text-slate-800 lg:text-sm"
              >
                {origin || "Mi ubicación actual"}
              </button>
            </div>
            {onUseCurrentLocation && (
              <button
                type="button"
                title="Usar mi ubicación actual"
                aria-label="Usar mi ubicación actual"
                onClick={onUseCurrentLocation}
                className={`flex flex-shrink-0 items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold shadow-sm transition active:scale-95 lg:text-xs ${
                  originIsCurrent
                    ? "border-purple-300 bg-purple-100 text-purple-700"
                    : "border-emerald-200 bg-white text-emerald-700"
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" strokeWidth="2" />
                  <path d="M12 2v3m0 14v3m10-10h-3M5 12H2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span className="hidden lg:inline">Actual</span>
              </button>
            )}
            <button
              type="button"
              className="flex flex-shrink-0 items-center gap-1 rounded-xl border border-emerald-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 shadow-sm transition active:scale-95 lg:text-xs"
              onClick={onOpenOriginMap ?? onOpenMap}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              Mapa
            </button>
          </div>

          {stops.map((stop, index) => (
            <div key={`${stop}-${index}`} className="relative z-10 flex items-center gap-3 px-3 py-2 lg:px-4 lg:py-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 lg:h-10 lg:w-10">
                <span className="text-xs font-black lg:text-sm">{index + 1}</span>
              </div>
              <div className="min-w-0 flex-1 truncate rounded-xl border border-slate-200/70 bg-slate-50/90 px-3 py-2 text-xs font-bold text-slate-800 lg:text-sm">
                {stop || "Escala intermedia"}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={onOpenMap}
            className="relative z-10 flex w-full items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/90 p-3 text-left lg:p-4"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 lg:h-10 lg:w-10">
              <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <circle cx="12" cy="11" r="2" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Destino del viaje
              </span>
              <span className={`block truncate text-xs font-bold lg:text-sm ${destination ? "text-slate-800" : "text-slate-400"}`}>
                {destination || "Toca para elegir tu destino"}
              </span>
            </div>
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {stops.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-medium text-slate-500 lg:text-xs">
            {stops.length} escala{stops.length > 1 ? "s" : ""} agregada{stops.length > 1 ? "s" : ""}
          </span>
          <button
            className="text-[11px] font-bold text-purple-600 transition active:scale-95 lg:text-xs"
            onClick={onOpenMap}
          >
            + Agregar otra
          </button>
        </div>
      )}

      {stops.length === 0 && (
        <button
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-purple-300 bg-purple-50 py-2.5 text-[11px] font-bold text-purple-700 transition hover:bg-purple-100 active:scale-[0.98] lg:text-xs"
          onClick={onOpenMap}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Añadir escala desde el mapa
        </button>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-700 lg:text-sm">Tu conductor</p>
            <p className="text-[10px] font-medium text-slate-400">
              Elige a quién le enviarás la solicitud
            </p>
          </div>
          <button
            type="button"
            onClick={onAddDriver}
            className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[10px] font-black text-purple-700 active:scale-95"
          >
            + Agregar
          </button>
        </div>

        {drivers.length === 0 ? (
          <button
            type="button"
            onClick={onAddDriver}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-purple-300 bg-purple-50/70 p-3 text-left active:scale-[0.99]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <span className="material-symbols-outlined text-[21px]">person_add</span>
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-black text-purple-950">Agrega tu primer conductor</span>
              <span className="block text-[10px] font-medium text-purple-700">
                Busca su nombre o escanea su QR
              </span>
            </span>
          </button>
        ) : (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
            {drivers.map((driver) => {
              const isSelected = driver.id === selectedDriver?.id;
              return (
                <button
                  key={driver.id}
                  type="button"
                  onClick={() => onSelectDriver?.(driver)}
                  className={`flex w-[164px] shrink-0 items-center gap-2.5 rounded-2xl border p-2.5 text-left transition active:scale-[0.98] ${
                    isSelected
                      ? "border-purple-500 bg-purple-50 shadow-md shadow-purple-600/10"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="relative shrink-0">
                    {driver.image ? (
                      <img
                        src={driver.image}
                        alt={driver.name}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                    ) : (
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black ${driver.color}`}>
                        {driver.initials}
                      </span>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                        driver.status === "available" ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-black text-slate-900">
                        {driver.name}
                      </span>
                      <span className="block truncate text-[11px] font-semibold text-slate-500">
                        {driver.vehicle}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-amber-600">
                      ★ {driver.rating}
                      <span className="font-medium text-slate-400">· {driver.plate}</span>
                    </span>
                  </span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[17px] text-purple-600">
                      check_circle
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {tarifas?.modo === "zona" && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs lg:text-sm">
            <span className="font-bold text-slate-700">Zona del viaje</span>
            <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600 lg:text-[11px]">
              Precio fijo
            </span>
          </div>
          {tarifas.zonas.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {tarifas.zonas.map((zona) => (
                <button
                  key={zona.id}
                  onClick={() => setZonaId(zona.id)}
                  className={`flex items-center justify-between rounded-2xl p-3 text-left shadow-sm transition ${
                    zonaId === zona.id
                      ? "border-2 border-purple-600 bg-purple-50/60 text-purple-900"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span className="truncate text-xs font-bold lg:text-sm">{zona.nombre}</span>
                  <span className="ml-2 flex-shrink-0 text-xs font-black lg:text-sm">
                    {formatearUsd(Number(zona.precio))}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 lg:text-xs">
              El conductor aún no ha configurado sus zonas ni precios.
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-3.5 text-white shadow-lg lg:p-5">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 lg:text-xs">
            <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span>{hasDestination ? distance : "Selecciona tu destino"}</span>
            {tarifas?.nombre && <span className="text-slate-400">• {tarifas.nombre}</span>}
          </div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-2xl font-black text-white lg:text-3xl">{fareUsd}</span>
            <span className="text-xs font-bold text-slate-300 lg:text-sm">USD</span>
          </div>
          <span className="text-[10px] text-slate-400 lg:text-[11px]">
            {!hasFare
              ? "La tarifa aparece al elegir el destino"
              : tarifas?.modo === "zona"
                ? `Tarifa fija${zonaSeleccionada ? ` • ${zonaSeleccionada.nombre}` : ""}`
                : "Base + $/km"}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 lg:text-[11px]">
            Tasa BCV
          </span>
          <span className="text-sm font-extrabold text-amber-400 lg:text-base">{fareBs}</span>
          <span className="block text-[10px] text-slate-400 lg:text-[11px]">
            {`${(tasa ?? TASA_BCV_REFERENCIA).toFixed(2)} Bs/USD`}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs lg:text-sm">
          <span className="font-bold text-slate-700">Método de pago directo</span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 lg:text-[11px]">
            Sin comisiones
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "usd" as const, label: "Efectivo $", sub: "Dólares" },
            { id: "bs" as const, label: "Efectivo Bs", sub: "Bolívares" },
            { id: "pmovil" as const, label: "Pago Móvil", sub: "Al chofer" },
          ].map((opt) => (
            <button
              key={opt.id}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-2.5 text-center shadow-sm transition lg:p-3.5 ${
                paymentMethod === opt.id
                  ? "border-2 border-purple-600 bg-purple-50/60 text-purple-900"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
              onClick={() => handlePayment(opt.id)}
            >
              <span className="text-xs font-black lg:text-sm">{opt.label}</span>
              <span className="text-[10px] font-medium text-slate-500 lg:text-[11px]">{opt.sub}</span>
            </button>
          ))}
        </div>

        {showPagoMovil && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 lg:p-4">
            <div className="text-[11px] leading-tight text-amber-900 lg:text-xs">
              <strong className="block font-bold">Pago directo al chofer</strong>
              {whatsappHref
                ? "Transfiere y envía el capture por WhatsApp."
                : "El chofer te compartirá sus datos al confirmar el viaje."}
            </div>
            {whatsappHref && (
              <a
                className="flex flex-shrink-0 items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow active:scale-95"
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            )}
          </div>
        )}
      </div>

      {formError && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          {formError}
        </p>
      )}

      <div className="sticky bottom-0 z-10 -mx-3 border-t border-slate-200/70 bg-white/95 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 px-5 py-4 text-sm font-black tracking-wide text-white shadow-lg shadow-purple-600/30 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 lg:py-5 lg:text-base"
          onClick={handleSubmit}
          disabled={!hasDestination || !hasDriver}
        >
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span>{tripMode === "schedule" ? "Programar este viaje" : "Pedir servicio ahora"}</span>
          </div>
          <span className="rounded-xl bg-white/20 px-2.5 py-1 text-xs font-bold backdrop-blur-sm lg:text-sm">
            {paymentLabel}
          </span>
        </button>
      </div>
    </section>
  );
}
