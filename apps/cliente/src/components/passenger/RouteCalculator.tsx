import { useMemo, useState, useEffect } from "react";
import type { TarifasTenant } from "@drivip/types";
import { validarCuponCodigo } from "@drivip/supabase";
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
  onOpenStopMap?: () => void;
  onRemoveStop?: (index: number) => void;
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
    precioBaseUsd?: number;
    metodoPago: "usd" | "bs" | "pmovil";
    programadaPara?: string;
    cuponCodigo?: string;
  }) => void;
  onToggleSchedule: (mode: "now" | "schedule") => void;
  initialTripMode?: "now" | "schedule";
  origin?: string;
  destination?: string;
  stops?: string[];
}

const BANCOS: Record<string, string> = {
  "0102": "Banco de Venezuela",
  "0104": "Venezolano de Crédito",
  "0105": "Mercantil",
  "0108": "BBVA Provincial",
  "0134": "Banesco",
  "0138": "Banco Plaza",
  "0146": "Bangente",
  "0151": "BFC Banco Fondo Común",
  "0163": "Banco del Tesoro",
  "0166": "Banco Agrícola de Venezuela",
  "0168": "Bancrecer",
  "0169": "Mi Banco",
  "0171": "Banco Activo",
  "0172": "Bancamiga",
  "0174": "Banplus",
  "0175": "Banco Bicentenario",
  "0177": "Banfanb",
  "0191": "Banco Nacional de Crédito",
};

function bancoLabel(codigo: string | null | undefined): string {
  if (!codigo) return "Sin banco";
  return `${codigo} · ${BANCOS[codigo] ?? "Banco"}`;
}

function localDateInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const ERRORES_CUPON: Record<string, string> = {
  codigo_vacio: "Escribe el código del cupón.",
  cupon_no_encontrado: "Ese código no existe para el conductor seleccionado.",
  cupon_inactivo: "El conductor desactivó este cupón.",
  cupon_vencido: "Este cupón venció.",
  cupon_ya_usado: "Ya usaste este cupón.",
  conductor_no_en_red: "Ese cupón pertenece a otro conductor.",
  no_autenticado: "Inicia sesión para usar cupones.",
};

function calcularDescuento(
  base: number,
  cupon: { tipo: "porcentaje" | "monto"; valor: number } | null
): number {
  if (!cupon) return 0;
  const valor = Math.max(0, Number(cupon.valor) || 0);
  const monto =
    cupon.tipo === "porcentaje" ? (base * Math.min(valor, 100)) / 100 : valor;
  return Math.round(Math.min(Math.max(monto, 0), base) * 100) / 100;
}

export default function RouteCalculator({
  onOpenMap,
  onOpenOriginMap,
  onOpenStopMap,
  onRemoveStop,
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
  const [copiado, setCopiado] = useState<string | null>(null);
  const [zonaId, setZonaId] = useState<string>("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("08:30");
  const [formError, setFormError] = useState("");
  const [cuponCodigo, setCuponCodigo] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState<{
    codigo: string;
    tipo: "porcentaje" | "monto";
    valor: number;
  } | null>(null);
  const [cuponError, setCuponError] = useState("");
  const [validandoCupon, setValidandoCupon] = useState(false);

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

  useEffect(() => {
    setCuponAplicado(null);
    setCuponCodigo("");
    setCuponError("");
  }, [selectedDriverId]);

  useEffect(() => {
    if (tripMode === "schedule") {
      setCuponAplicado(null);
      setCuponError("");
    }
  }, [tripMode]);

  const zonaSeleccionada = tarifas?.zonas.find((z) => z.id === zonaId) ?? tarifas?.zonas[0];
  const hasDestination = Boolean(destination.trim()) && canRequest;
  const selectedDriver = drivers.find((driver) => driver.id === selectedDriverId) ?? null;
  const hasDriver = Boolean(selectedDriver);
  const pagoMovil = selectedDriver?.paymentData?.pagoMovil ?? null;
  const pagoMovilCompleto = Boolean(
    pagoMovil?.activo && pagoMovil.banco && pagoMovil.cedula && pagoMovil.telefono
  );

  const precioBaseUsd = tarifas
    ? tarifas.modo === "zona"
      ? Number(zonaSeleccionada?.precio ?? 0)
      : calcularTarifaKm(tarifas.base, tarifas.por_km, distanceKm)
    : calcularTarifaKm(DEFAULT_TARIFA_BASE, DEFAULT_TARIFA_POR_KM, distanceKm);

  const descuentoUsd = calcularDescuento(precioBaseUsd, cuponAplicado);
  const precioUsd = Math.round(Math.max(precioBaseUsd - descuentoUsd, 0) * 100) / 100;

  const hasFare =
    hasDestination &&
    (tarifas?.modo === "zona" ? Boolean(zonaSeleccionada) : distanceKm > 0);

  const fareUsd = hasFare ? formatearUsd(precioUsd) : "—";
  const fareBs = hasFare ? formatearBs(precioUsd, tasa ?? undefined) : "—";

  const paymentLabel =
    paymentMethod === "usd" ? "Efectivo USD" : paymentMethod === "bs" ? "Efectivo Bs" : "Pago Móvil";

  const whatsappHref = useMemo(() => {
    const digits = (driverWhatsapp ?? selectedDriver?.whatsapp ?? "").replace(/\D/g, "");
    if (digits.length < 7) return null;
    const text = encodeURIComponent(
      "Hola, acabo de solicitar un viaje en Drivip. Te envío el capture del pago."
    );
    return `https://wa.me/${digits}?text=${text}`;
  }, [driverWhatsapp, selectedDriver?.whatsapp]);

  const copiar = async (texto: string | null | undefined, key: string) => {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const input = document.createElement("textarea");
      input.value = texto;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopiado(key);
    window.setTimeout(() => {
      setCopiado((actual) => (actual === key ? null : actual));
    }, 1800);
  };

  const copiarPagoMovil = () => {
    if (!pagoMovil) return;
    void copiar(
      [
        `Banco: ${bancoLabel(pagoMovil.banco)}`,
        `Cédula: ${pagoMovil.cedula ?? ""}`,
        `Teléfono: ${pagoMovil.telefono ?? ""}`,
        `Monto: ${formatearBs(precioUsd, tasa ?? undefined)}`,
      ].join("\n"),
      "todo"
    );
  };

  const handleToggle = (mode: "now" | "schedule") => {
    setTripMode(mode);
    setFormError("");
    onToggleSchedule(mode);
  };

  const handlePayment = (method: "usd" | "bs" | "pmovil") => {
    setPaymentMethod(method);
  };

  const aplicarCupon = async () => {
    setCuponError("");
    const codigo = cuponCodigo.trim().toUpperCase();

    if (!codigo) {
      setCuponError("Escribe el código del cupón.");
      return;
    }

    if (!selectedDriver) {
      setCuponError("Elige un conductor para aplicar el cupón.");
      return;
    }

    setValidandoCupon(true);
    try {
      const resultado = await validarCuponCodigo(codigo, selectedDriver.id);
      if (!resultado.ok) {
        setCuponAplicado(null);
        setCuponError(
          ERRORES_CUPON[resultado.error ?? ""] ??
            resultado.error ??
            "No pudimos validar el cupón."
        );
        return;
      }

      setCuponAplicado({
        codigo: resultado.codigo ?? codigo,
        tipo: resultado.tipo ?? "monto",
        valor: Number(resultado.valor ?? 0),
      });
      setCuponCodigo(resultado.codigo ?? codigo);
    } catch {
      setCuponAplicado(null);
      setCuponError("No pudimos validar el cupón. Revisa tu conexión.");
    } finally {
      setValidandoCupon(false);
    }
  };

  const quitarCupon = () => {
    setCuponAplicado(null);
    setCuponCodigo("");
    setCuponError("");
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

    onRequestRide({
      precioUsd,
      precioBaseUsd,
      metodoPago: paymentMethod,
      programadaPara,
      cuponCodigo: programadaPara ? undefined : cuponAplicado?.codigo,
    });
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
            <div key={`${stop}-${index}`} className="relative z-10 flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 lg:h-10 lg:w-10">
                <span className="text-xs font-black lg:text-sm">{index + 1}</span>
              </div>
              <div className="min-w-0 flex-1 rounded-xl border border-slate-200/70 bg-slate-50/90 px-3 py-2 text-xs font-bold text-slate-800 lg:text-sm">
                <span className="line-clamp-2 break-words">{stop || "Escala intermedia"}</span>
              </div>
              {onRemoveStop && (
                <button
                  type="button"
                  onClick={() => onRemoveStop(index)}
                  aria-label={`Eliminar escala ${index + 1}`}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm transition hover:text-red-500 active:scale-90"
                >
                  <span className="material-symbols-outlined text-[17px]">close</span>
                </button>
              )}
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
            onClick={onOpenStopMap ?? onOpenMap}
          >
            + Agregar otra
          </button>
        </div>
      )}

      {stops.length === 0 && (
        <button
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-purple-300 bg-purple-50 py-2.5 text-[11px] font-bold text-purple-700 transition hover:bg-purple-100 active:scale-[0.98] lg:text-xs"
          onClick={onOpenStopMap ?? onOpenMap}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Añadir escala a la ruta
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
          <div className="grid gap-2 sm:grid-cols-2">
            {drivers.map((driver) => {
              const isSelected = driver.id === selectedDriver?.id;
              return (
                <button
                  key={driver.id}
                  type="button"
                  onClick={() => onSelectDriver?.(driver)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
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
                        className="h-12 w-12 rounded-2xl object-cover"
                      />
                    ) : (
                      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black ${driver.color}`}>
                        {driver.initials}
                      </span>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                        driver.status === "available" ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-black leading-snug text-slate-900 break-words sm:text-sm">
                      {driver.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-slate-500 break-words sm:text-xs">
                      {driver.vehicle}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                      <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-amber-700">
                        ★ {driver.rating}
                      </span>
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-slate-600">
                        Placa {driver.plate}
                      </span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 ${
                          driver.status === "available"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {driver.status === "available" ? "Disponible" : driver.availability}
                      </span>
                    </span>
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      isSelected ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-300"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      {isSelected ? "check" : "radio_button_unchecked"}
                    </span>
                  </span>
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
          <div className="mt-0.5 flex items-baseline gap-1.5">
            {descuentoUsd > 0 && (
              <span className="text-xs font-bold text-slate-400 line-through lg:text-sm">
                {formatearUsd(precioBaseUsd)}
              </span>
            )}
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
          {descuentoUsd > 0 && cuponAplicado && (
            <span className="mt-0.5 block text-[10px] font-bold text-emerald-400 lg:text-[11px]">
              Cupón {cuponAplicado.codigo} · -{formatearUsd(descuentoUsd)}
            </span>
          )}
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

      {tripMode === "now" && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs lg:text-sm">
            <span className="font-bold text-slate-700">Código de cupón</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 lg:text-[11px]">
              Opcional
            </span>
          </div>

          {cuponAplicado ? (
            <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <span className="material-symbols-outlined text-[19px]">confirmation_number</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[12px] font-black tracking-wider text-emerald-900">
                  {cuponAplicado.codigo}
                </p>
                <p className="text-[10px] font-semibold leading-snug text-emerald-700">
                  {cuponAplicado.tipo === "porcentaje"
                    ? `${cuponAplicado.valor}% de descuento`
                    : `${formatearUsd(cuponAplicado.valor)} de descuento`}
                  {descuentoUsd > 0 ? ` · Ahorras ${formatearUsd(descuentoUsd)}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={quitarCupon}
                aria-label="Quitar cupón"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm transition active:scale-90"
              >
                <span className="material-symbols-outlined text-[17px]">close</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                aria-label="Código de cupón"
                value={cuponCodigo}
                onChange={(event) => {
                  setCuponCodigo(event.target.value.toUpperCase());
                  setCuponError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void aplicarCupon();
                  }
                }}
                placeholder="Ej. DRIVIP10"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-slate-900 placeholder:font-sans placeholder:font-medium placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
              <button
                type="button"
                onClick={() => void aplicarCupon()}
                disabled={validandoCupon || !cuponCodigo.trim()}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {validandoCupon && (
                  <span className="material-symbols-outlined animate-spin text-[15px]">sync</span>
                )}
                {validandoCupon ? "Validando" : "Aplicar"}
              </button>
            </div>
          )}

          {cuponError ? (
            <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-600">
              {cuponError}
            </p>
          ) : (
            !cuponAplicado && (
              <p className="px-1 text-[10px] font-medium text-slate-400">
                Ingresa el código que te compartió tu conductor. El descuento se
                aplica al pedir el viaje.
              </p>
            )
          )}
        </div>
      )}

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

        {paymentMethod === "pmovil" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 lg:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="material-symbols-outlined text-[19px] text-emerald-700">
                  contactless
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-emerald-950">Datos Pago Móvil</p>
                  <p className="truncate text-[11px] font-semibold text-emerald-700">
                    {selectedDriver ? selectedDriver.name : "Elige un conductor"}
                  </p>
                </div>
              </div>
              {pagoMovilCompleto && (
                <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                  Listo
                </span>
              )}
            </div>

            {pagoMovilCompleto && pagoMovil ? (
              <>
                <div className="mt-2.5 rounded-xl bg-emerald-600 px-3 py-2 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                    Monto a pagar
                  </p>
                  <p className="text-lg font-black leading-tight">
                    {formatearBs(precioUsd, tasa ?? undefined)}
                  </p>
                </div>

                <div className="mt-2 space-y-1.5">
                  {[
                    { key: "banco", label: "Banco", value: bancoLabel(pagoMovil.banco) },
                    { key: "cedula", label: "Cédula", value: pagoMovil.cedula ?? "" },
                    { key: "telefono", label: "Teléfono", value: pagoMovil.telefono ?? "" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          {item.label}
                        </p>
                        <p className="break-words text-[13px] font-black text-slate-900">
                          {item.value}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void copiar(item.value, item.key)}
                        aria-label={`Copiar ${item.label}`}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition active:scale-90 ${
                          copiado === item.key
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          {copiado === item.key ? "check" : "content_copy"}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={copiarPagoMovil}
                  className={`mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black transition active:scale-[0.98] ${
                    copiado === "todo"
                      ? "bg-emerald-700 text-white"
                      : "bg-white text-emerald-700 shadow-sm"
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {copiado === "todo" ? "check" : "content_copy"}
                  </span>
                  {copiado === "todo" ? "Datos copiados" : "Copiar todos los datos"}
                </button>
              </>
            ) : (
              <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm">
                <span className="material-symbols-outlined text-[17px] text-amber-600">
                  info
                </span>
                <p className="text-[11px] font-semibold leading-relaxed text-amber-800">
                  {selectedDriver
                    ? "Este conductor aún no cargó sus datos de Pago Móvil. Solicítalos por WhatsApp."
                    : "Selecciona un conductor para ver sus datos de Pago Móvil."}
                </p>
              </div>
            )}

            {whatsappHref && (
              <a
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white shadow active:scale-[0.98]"
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
              >
                <span className="material-symbols-outlined text-[17px]">chat</span>
                Coordinar por WhatsApp
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
