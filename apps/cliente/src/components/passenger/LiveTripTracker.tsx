import { useEffect, useMemo, useRef, useState } from "react";
import type { Carrera } from "@drivip/types";
import { formatearUsd, formatearBs } from "@drivip/types";
import { CarreraChat } from "@drivip/supabase";
import {
  MapLibreView,
  fetchDrivingRoute,
  haversineKm,
  VENEZUELA_MAP_BOUNDS,
} from "@drivip/maps";
import type { Driver } from "../../types/passenger";

interface LiveTripTrackerProps {
  carrera: Carrera;
  driver: Driver;
  tasa?: number | null;
  conductorLocation?: { lat: number; lng: number; bearing: number } | null;
  conductorUpdatedAt?: Date | null;
  onCallDriver: () => void;
  onRateTrip: () => void;
  onCancelTrip: () => void;
  onDismiss: () => void;
}

const LIGHT_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
const ROUTE_MIN_MOVE_KM = 0.12;
const ROUTE_MIN_INTERVAL_MS = 25000;

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

function minutos(value: number | null): string {
  if (value === null) return "-";
  return Math.max(1, Math.round(value)) + " min";
}

function bancoLabel(codigo: string | null | undefined): string {
  if (!codigo) return "Sin banco";
  return `${codigo} · ${BANCOS[codigo] ?? "Banco"}`;
}

export default function LiveTripTracker({
  carrera,
  driver,
  tasa,
  conductorLocation,
  conductorUpdatedAt,
  onCallDriver,
  onRateTrip,
  onCancelTrip,
  onDismiss,
}: LiveTripTrackerProps) {
  const [pickupRoute, setPickupRoute] = useState<[number, number][] | null>(null);
  const [tripRoute, setTripRoute] = useState<[number, number][] | null>(null);
  const [traveledRoute, setTraveledRoute] = useState<[number, number][]>([]);
  const [pickupKm, setPickupKm] = useState<number | null>(null);
  const [pickupMin, setPickupMin] = useState<number | null>(null);
  const [tripKm, setTripKm] = useState<number | null>(null);
  const [tripMin, setTripMin] = useState<number | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const autoExpandRef = useRef(0);
  const estadoAnteriorRef = useRef(carrera.estado);
  const lastPickupRouteRef = useRef<{ lat: number; lng: number; at: number } | null>(null);
  const lastTripRouteRef = useRef<{ lat: number; lng: number; at: number } | null>(null);

  const waiting = carrera.estado === "pendiente";
  const accepted = carrera.estado === "aceptada";
  const inTrip = carrera.estado === "en_curso";
  const completed = carrera.estado === "completada";
  const cancelled = carrera.estado === "cancelada";
  const active = waiting || accepted || inTrip;

  const origin: [number, number] = [carrera.origen_lat, carrera.origen_lng];
  const locationFresh =
    Boolean(conductorUpdatedAt) && Date.now() - conductorUpdatedAt!.getTime() < 120000;
  const nearbyPickup =
    accepted &&
    locationFresh &&
    Boolean(conductorLocation) &&
    haversineKm(origin, [conductorLocation!.lat, conductorLocation!.lng]) < 0.06;
  const arrived = accepted && (Boolean(carrera.llego_at) || nearbyPickup);
  const destination: [number, number] | null =
    typeof carrera.destino_lat === "number" && typeof carrera.destino_lng === "number"
      ? [carrera.destino_lat, carrera.destino_lng]
      : null;

  const priceUsd = carrera.precio ?? 0;
  const pendingQuote = carrera.tipo_servicio === "compra" && priceUsd <= 0;
  const serviceLabel =
    carrera.tipo_servicio === "delivery"
      ? "Delivery"
      : carrera.tipo_servicio === "compra"
        ? "Compra"
        : null;
  const metodoPago =
    carrera.metodo_pago === "pago_movil"
      ? "Pago Móvil"
      : carrera.metodo_pago === "transferencia"
        ? "Transferencia"
        : "Efectivo";

  const pagoMovil = driver.paymentData?.pagoMovil;
  const pagoMovilCompleto = Boolean(
    pagoMovil?.activo &&
      pagoMovil.banco &&
      pagoMovil.cedula &&
      pagoMovil.telefono
  );
  const montoBs = formatearBs(priceUsd, tasa ?? undefined);

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

  const minimizar = () => {
    autoExpandRef.current = Date.now();
    setMinimized(true);
  };

  const copiarPagoMovil = () => {
    if (!pagoMovil) return;
    void copiar(
      [
        `Banco: ${bancoLabel(pagoMovil.banco)}`,
        `Cédula: ${pagoMovil.cedula ?? ""}`,
        `Teléfono: ${pagoMovil.telefono ?? ""}`,
        priceUsd > 0 ? `Monto: ${montoBs}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      "todo"
    );
  };

  const whatsappHref = useMemo(() => {
    const digits = (driver.whatsapp || "").replace(/\D/g, "");
    if (digits.length < 7) return null;
    const text = encodeURIComponent(
      `Hola ${driver.name}, estoy en el seguimiento del viaje Drivip.`
    );
    return `https://wa.me/${digits}?text=${text}`;
  }, [driver.name, driver.whatsapp]);

  useEffect(() => {
    setPickupRoute(null);
    setTripRoute(null);
    setTraveledRoute([]);
    setPickupKm(null);
    setPickupMin(null);
    setTripKm(null);
    setTripMin(null);
    setChatOpen(false);
    setPaymentOpen(false);
    setMinimized(false);
    setHidden(false);
    setCopiado(null);
    lastPickupRouteRef.current = null;
    lastTripRouteRef.current = null;
  }, [carrera.id]);

  useEffect(() => {
    if (estadoAnteriorRef.current === carrera.estado) return;
    estadoAnteriorRef.current = carrera.estado;
    setMinimized(false);
    setHidden(false);
  }, [carrera.estado]);

  useEffect(() => {
    if (!minimized || !conductorUpdatedAt) return;
    const ahora = Date.now();
    if (ahora - autoExpandRef.current < 25000) return;
    autoExpandRef.current = ahora;
    setMinimized(false);
  }, [conductorUpdatedAt, minimized]);

  useEffect(() => {
    if (!accepted || !conductorLocation) return;

    const now = Date.now();
    const last = lastPickupRouteRef.current;
    const movedKm = last
      ? haversineKm([last.lat, last.lng], [conductorLocation.lat, conductorLocation.lng])
      : Infinity;
    if (last && movedKm < ROUTE_MIN_MOVE_KM && now - last.at < ROUTE_MIN_INTERVAL_MS) {
      return;
    }
    lastPickupRouteRef.current = {
      lat: conductorLocation.lat,
      lng: conductorLocation.lng,
      at: now,
    };

    let cancelledRequest = false;
    const timer = setTimeout(() => {
      void fetchDrivingRoute([
        { lat: conductorLocation.lat, lng: conductorLocation.lng },
        { lat: origin[0], lng: origin[1] },
      ]).then((route) => {
        if (cancelledRequest || !route) return;
        setPickupRoute(route.geometry);
        setPickupKm(route.distanceKm);
        setPickupMin(route.durationMin);
      });
    }, 500);

    return () => {
      cancelledRequest = true;
      clearTimeout(timer);
    };
  }, [accepted, conductorLocation?.lat, conductorLocation?.lng, origin[0], origin[1]]);

  useEffect(() => {
    if (!inTrip || !destination) {
      if (!completed) {
        setTripKm(null);
        setTripMin(null);
      }
      return;
    }

    const from = conductorLocation
      ? { lat: conductorLocation.lat, lng: conductorLocation.lng }
      : { lat: origin[0], lng: origin[1] };

    const now = Date.now();
    const last = lastTripRouteRef.current;
    const movedKm = last
      ? haversineKm([last.lat, last.lng], [from.lat, from.lng])
      : Infinity;
    if (last && movedKm < ROUTE_MIN_MOVE_KM && now - last.at < ROUTE_MIN_INTERVAL_MS) {
      return;
    }
    lastTripRouteRef.current = { lat: from.lat, lng: from.lng, at: now };

    let cancelledRequest = false;
    const timer = setTimeout(() => {
      void fetchDrivingRoute([from, { lat: destination[0], lng: destination[1] }]).then((route) => {
        if (cancelledRequest || !route) return;
        setTripRoute(route.geometry);
        setTripKm(route.distanceKm);
        setTripMin(route.durationMin);
      });
    }, 700);

    return () => {
      cancelledRequest = true;
      clearTimeout(timer);
    };
  }, [
    inTrip,
    completed,
    destination?.[0],
    destination?.[1],
    conductorLocation?.lat,
    conductorLocation?.lng,
    origin[0],
    origin[1],
  ]);

  useEffect(() => {
    if (!inTrip || !conductorLocation) return;
    setTraveledRoute((prev) => {
      const last = prev[prev.length - 1];
      if (
        last &&
        haversineKm(last, [conductorLocation.lat, conductorLocation.lng]) < 0.012
      ) {
        return prev;
      }
      const point: [number, number] = [conductorLocation.lat, conductorLocation.lng];
      return [...prev, point].slice(-900);
    });
  }, [inTrip, conductorLocation?.lat, conductorLocation?.lng]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (conductorLocation && (accepted || inTrip)) {
      return [conductorLocation.lat, conductorLocation.lng];
    }
    if (completed && destination) return destination;
    return origin;
  }, [
    accepted,
    completed,
    inTrip,
    destination?.[0],
    destination?.[1],
    conductorLocation?.lat,
    conductorLocation?.lng,
    origin[0],
    origin[1],
  ]);

  const carPosition = useMemo(
    () =>
      conductorLocation && !cancelled
        ? {
            lat: conductorLocation.lat,
            lng: conductorLocation.lng,
            bearing: conductorLocation.bearing,
          }
        : null,
    [cancelled, conductorLocation?.lat, conductorLocation?.lng, conductorLocation?.bearing]
  );

  const etaText = waiting
    ? "Solicitud enviada"
    : accepted
      ? arrived
        ? "Ya está aquí"
        : pickupMin !== null
          ? `Llega en ~${minutos(pickupMin)}`
          : "Conectando GPS"
      : inTrip
        ? tripMin !== null
          ? `~${minutos(tripMin)} al destino`
          : "Rumbo al destino"
        : completed
          ? "Viaje completado"
          : "Viaje cancelado";

  const statusTitle = waiting
    ? "Buscando a tu conductor"
    : accepted
      ? arrived
        ? "Tu conductor ya llegó"
        : "Tu conductor va en camino"
      : inTrip
        ? "Estás en camino"
        : completed
          ? "¡Gracias por viajar con Drivip!"
          : "Viaje cancelado";

  const statusDetail = waiting
    ? `Esperando que ${driver.name} acepte la solicitud.`
    : accepted
      ? arrived
        ? "El conductor está en el punto de recogida. Súbete para iniciar el viaje."
        : pickupKm !== null
          ? `A ${pickupKm.toFixed(1)} km de tu ubicación, en tiempo real.`
          : "Esperando la ubicación GPS del conductor."
      : inTrip
        ? `Rumbo a ${carrera.destino_direccion || "tu destino"}.`
        : completed
          ? "Llegaste a tu destino. Tu calificación ayuda a mantener la red de confianza."
          : "El viaje fue cancelado.";

  return (
    <section
      className="fixed inset-0 z-[90] overflow-hidden bg-slate-950"
      data-purpose="live-trip-tracker"
    >
      <MapLibreView
        center={mapCenter}
        zoom={16}
        mapStyle={LIGHT_STYLE}
        className="absolute inset-0"
        maxBounds={VENEZUELA_MAP_BOUNDS}
        origin={{ lat: origin[0], lng: origin[1], label: "Recogida" }}
        destination={
          destination ? { lat: destination[0], lng: destination[1], label: "Destino" } : null
        }
        route={completed || inTrip ? tripRoute ?? undefined : undefined}
        routeSecondary={accepted ? pickupRoute ?? undefined : undefined}
        traveledRoute={traveledRoute.length > 1 ? traveledRoute : undefined}
        carPosition={carPosition}
        showPulse={!carPosition}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/35 via-transparent to-slate-950/35" />

      <div className="absolute inset-x-0 top-0 z-20 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/95 px-3.5 py-2.5 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-700 to-indigo-700 text-white shadow-lg shadow-purple-700/25">
              <span className="material-symbols-outlined text-[19px]">local_taxi</span>
              {active && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-purple-600">
                Drivip en vivo
              </p>
              <p className="truncate text-sm font-medium text-slate-900">{etaText}</p>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
              completed
                ? "bg-emerald-100 text-emerald-700"
                : cancelled
                  ? "bg-red-100 text-red-600"
                  : "bg-purple-100 text-purple-700"
            }`}
          >
            {completed ? "Finalizado" : cancelled ? "Cancelado" : "En seguimiento"}
          </span>
        </div>

        {arrived && (
          <div className="mx-auto mt-2 flex max-w-lg items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/95 p-3 shadow-xl backdrop-blur-xl">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white">
              <span className="material-symbols-outlined text-[22px]">where_to_vote</span>
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-black text-amber-950">Tu conductor ya llegó</p>
              <p className="truncate text-xs font-medium text-amber-800">
                {driver.vehicle} · placa {driver.plate}
              </p>
            </div>
          </div>
        )}
      </div>

      {hidden && (
        <button
          type="button"
          onClick={() => setHidden(false)}
          aria-label="Mostrar seguimiento del viaje"
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-2 rounded-full border border-white/80 bg-white/95 py-2 pl-2 pr-3 shadow-[0_12px_40px_rgba(15,23,42,0.35)] backdrop-blur-xl active:scale-95"
        >
          <span className="relative shrink-0">
            {driver.image ? (
              <img
                alt={`Conductor ${driver.name}`}
                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-md"
                src={driver.image}
              />
            ) : (
              <span className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-black shadow-md ${driver.color}`}>
                {driver.initials}
              </span>
            )}
            {active && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-white bg-emerald-500" />
            )}
          </span>
          <span className="text-left">
            <span className="block text-[9px] font-black uppercase tracking-wider text-purple-600">
              Drivip en vivo
            </span>
            <span className="block max-w-[130px] truncate text-xs font-medium text-slate-900">
              {etaText}
            </span>
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700">
            <span className="material-symbols-outlined text-[19px]">keyboard_arrow_up</span>
          </span>
        </button>
      )}

      {!hidden && (
      <div className="absolute inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {minimized ? (
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="mx-auto flex w-full max-w-lg items-center gap-3 rounded-2xl border border-white/80 bg-white/[0.97] p-3 text-left shadow-[0_-12px_40px_rgba(15,23,42,0.25)] backdrop-blur-2xl active:scale-[0.99]"
          >
            <span className="relative shrink-0">
              {driver.image ? (
                <img
                  alt={`Conductor ${driver.name}`}
                  className="h-11 w-11 rounded-2xl border-2 border-white object-cover shadow-md"
                  src={driver.image}
                />
              ) : (
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black shadow-md ${driver.color}`}>
                  {driver.initials}
                </span>
              )}
              {active && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-white bg-emerald-500" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black text-slate-900">
                {driver.name} · {etaText}
              </span>
              <span className="block truncate text-xs font-semibold text-slate-500">
                {statusTitle} · toca para ver el mapa
              </span>
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <span className="material-symbols-outlined text-[20px]">keyboard_arrow_up</span>
            </span>
          </button>
        ) : (
        <div className="mx-auto max-h-[60dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[28px] border border-white/80 bg-white/[0.97] shadow-[0_-20px_60px_rgba(15,23,42,0.28)] backdrop-blur-2xl">
          <div className="flex items-center justify-between px-4 pt-2.5">
            <span className="h-1.5 w-10 rounded-full bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={minimizar}
                aria-label="Minimizar seguimiento del viaje"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
              </button>
              <button
                type="button"
                onClick={() => setHidden(true)}
                aria-label="Cerrar seguimiento del viaje"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                {driver.image ? (
                  <img
                    alt={`Conductor ${driver.name}`}
                    className="h-[52px] w-[52px] rounded-2xl border-2 border-white object-cover shadow-md"
                    src={driver.image}
                  />
                ) : (
                  <div
                    className={`flex h-[52px] w-[52px] items-center justify-center rounded-2xl text-lg font-black shadow-md ${driver.color}`}
                  >
                    {driver.initials}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 rounded-md bg-amber-500 px-1.5 text-[10px] font-extrabold text-white shadow-sm">
                  ★ {driver.rating}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-black text-slate-900">{driver.name}</h3>
                  {arrived && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700">
                      Llegó
                    </span>
                  )}
                </div>
                <p className="truncate text-[13px] font-semibold text-slate-500">
                  {driver.vehicle} · {driver.plate}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[13px] font-bold text-purple-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-600" />
                  <span className="truncate">{statusDetail}</span>
                </div>
              </div>

              <a
                href={driver.phone ? `tel:${driver.phone}` : undefined}
                onClick={(event) => {
                  if (!driver.phone) {
                    event.preventDefault();
                    onCallDriver();
                  }
                }}
                aria-label={`Llamar a ${driver.name}`}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-emerald-600 shadow-sm active:scale-95 ${
                  driver.phone ? "" : "opacity-40"
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">call</span>
              </a>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-3.5 text-white shadow-lg shadow-slate-900/20">
              <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-purple-500/25 blur-2xl" />
              <div className="relative flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {waiting ? "Buscando conductor" : accepted ? "Llegada estimada" : inTrip ? "Tiempo al destino" : "Estado"}
                  </div>
                  <p
                    className={`mt-1 leading-none ${
                      waiting ? "text-lg font-medium" : "text-[26px] font-black"
                    }`}
                  >
                    {etaText}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-slate-300">
                    {waiting ? (
                      <span className="inline-flex items-center gap-1.5">
                        Esperando confirmación
                        <span className="inline-flex gap-0.5">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-300"
                              style={{ animationDelay: `${i * 120}ms` }}
                            />
                          ))}
                        </span>
                      </span>
                    ) : (
                      <>
                        {carrera.origen_direccion || "Origen"} → {carrera.destino_direccion || "Destino"}
                      </>
                    )}
                  </p>
                  {serviceLabel && (
                    <p className="mt-1 line-clamp-1 text-[11px] font-bold text-purple-300">
                      {serviceLabel}: {carrera.detalle_servicio || "Servicio solicitado"}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {pendingQuote ? "Precio" : "Total"}
                  </span>
                  {pendingQuote ? (
                    <span className="text-sm font-black text-amber-400">Por cotizar</span>
                  ) : (
                    <>
                      <span className="text-xl font-black text-white">{formatearUsd(priceUsd)}</span>
                      <span className="block text-[11px] font-bold text-amber-400">
                        {formatearBs(priceUsd, tasa ?? undefined)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {active && (
              <button
                type="button"
                onClick={() => setPaymentOpen(true)}
                className="flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-left transition active:scale-[0.99]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white shadow-md">
                  <span className="material-symbols-outlined text-[20px]">
                    {carrera.metodo_pago === "pago_movil" ? "contactless" : "payments"}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-black uppercase tracking-wider text-amber-700">
                    Método de pago
                  </span>
                  <span className="block truncate text-sm font-black text-amber-950">
                    {metodoPago}
                  </span>
                  <span className="block truncate text-[11px] font-semibold text-amber-700">
                    {carrera.metodo_pago === "pago_movil"
                      ? pagoMovilCompleto
                        ? "Datos del conductor listos para copiar"
                        : "Solicita los datos al conductor"
                      : "Pago directo al conductor, sin comisiones"}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-amber-700 shadow-sm">
                  Ver datos
                </span>
              </button>
            )}

            {active && (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentOpen(true)}
                  className="group flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-lg shadow-slate-900/5 transition active:scale-95"
                >
                  <span
                    className="flex h-11 w-11 animate-[bounce_2.8s_ease-in-out_infinite] items-center justify-center rounded-2xl bg-amber-100 text-amber-700"
                    style={{ animationDelay: "0ms" }}
                  >
                    <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
                  </span>
                  <span className="text-xs font-black text-slate-700">Pago</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChatOpen(true)}
                  className="group flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-lg shadow-slate-900/5 transition active:scale-95"
                >
                  <span
                    className="flex h-11 w-11 animate-[bounce_2.8s_ease-in-out_infinite] items-center justify-center rounded-2xl bg-purple-100 text-purple-700"
                    style={{ animationDelay: "180ms" }}
                  >
                    <span className="material-symbols-outlined text-[22px]">chat</span>
                  </span>
                  <span className="text-xs font-black text-slate-700">Chat</span>
                </button>

                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-lg shadow-slate-900/5 transition active:scale-95"
                  >
                    <span
                      className="flex h-11 w-11 animate-[bounce_2.8s_ease-in-out_infinite] items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"
                      style={{ animationDelay: "360ms" }}
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </span>
                    <span className="text-xs font-black text-slate-700">WhatsApp</span>
                  </a>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-50 p-2.5 opacity-45">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
                      <span className="material-symbols-outlined text-[22px]">chat_bubble</span>
                    </span>
                    <span className="text-[10px] font-black text-slate-500">Sin WhatsApp</span>
                  </div>
                )}
              </div>
            )}

            {active && (
              <div className="flex items-center gap-2">
                {waiting || accepted ? (
                  <button
                    type="button"
                    onClick={onCancelTrip}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-red-200 bg-red-50 py-3 text-xs font-black text-red-600 transition active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    Cancelar viaje
                  </button>
                ) : (
                  <div className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 py-3 text-xs font-black text-emerald-700">
                    <span className="material-symbols-outlined text-[18px]">route</span>
                    Viaje en curso
                  </div>
                )}
                <span className="rounded-2xl bg-slate-100 px-3 py-3 text-[11px] font-black text-slate-500">
                  {metodoPago}
                </span>
              </div>
            )}

            {completed && (
              <div className="space-y-2.5 pt-1">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-center">
                  <span className="material-symbols-outlined text-[30px] text-emerald-600">
                    celebration
                  </span>
                  <p className="mt-1 text-sm font-black text-emerald-950">{statusTitle}</p>
                  <p className="mt-0.5 text-[11px] font-medium leading-snug text-emerald-800">
                    {statusDetail}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onRateTrip}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[19px]">star</span>
                  {carrera.calificacion != null ? "Ver o cambiar reseña" : "Calificar servicio"}
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="w-full py-2 text-[11px] font-bold text-slate-400"
                >
                  Cerrar seguimiento
                </button>
              </div>
            )}

            {cancelled && (
              <div className="space-y-2.5 pt-1">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-center">
                  <span className="material-symbols-outlined text-[30px] text-red-500">cancel</span>
                  <p className="mt-1 text-sm font-black text-red-950">{statusTitle}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-red-700">{statusDetail}</p>
                </div>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-black text-white transition active:scale-[0.98]"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
      )}

      {chatOpen && (
        <div className="fixed inset-0 z-[125] flex items-end justify-center bg-slate-950/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center">
          <button
            type="button"
            aria-label="Cerrar chat"
            className="absolute inset-0"
            onClick={() => setChatOpen(false)}
          />
          <div className="relative w-full max-w-sm">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/50 bg-white/95 text-slate-600 shadow-lg backdrop-blur active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <CarreraChat carreraId={carrera.id} rol="cliente" />
          </div>
        </div>
      )}

      {paymentOpen && (
        <div className="fixed inset-0 z-[125] flex items-end justify-center bg-slate-950/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center">
          <button
            type="button"
            aria-label="Cerrar pago"
            className="absolute inset-0"
            onClick={() => setPaymentOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-[28px] border border-white/80 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-purple-600">
                  Pago directo
                </p>
                <h3 className="mt-0.5 text-lg font-black text-slate-900">Pago del viaje</h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 p-4 text-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {pendingQuote ? "Precio del servicio" : "Monto acordado"}
              </span>
              {pendingQuote ? (
                <div className="mt-2 flex items-center gap-2 rounded-xl bg-amber-400/15 px-3 py-2">
                  <span className="material-symbols-outlined text-[18px] text-amber-400">request_quote</span>
                  <p className="text-xs font-bold text-amber-300">Tu conductor está cotizando</p>
                </div>
              ) : (
                <>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-black">{formatearUsd(priceUsd)}</span>
                    <span className="text-xs font-bold text-slate-400">USD</span>
                  </div>
                  <p className="text-xs font-bold text-amber-400">{formatearBs(priceUsd, tasa ?? undefined)}</p>
                </>
              )}
            </div>

            {metodoPago === "Pago Móvil" && pagoMovilCompleto && pagoMovil ? (
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[19px] text-emerald-700">
                      contactless
                    </span>
                    <p className="text-xs font-black text-emerald-950">Datos Pago Móvil</p>
                  </div>
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                    Listo
                  </span>
                </div>

                <div className="mt-2.5 rounded-xl bg-emerald-600 px-3 py-2 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                    Monto a pagar
                  </p>
                  <p className="text-lg font-black leading-tight">{montoBs}</p>
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
                        <p className="truncate text-sm font-black text-slate-900">{item.value}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void copiar(item.value, item.key)}
                        aria-label={`Copiar ${item.label}`}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition active:scale-90 ${
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

                <p className="mt-2 text-[10px] font-medium leading-relaxed text-emerald-800">
                  Realiza el Pago Móvil y envía el comprobante por WhatsApp al conductor.
                </p>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[19px] text-amber-700">
                    {metodoPago === "Pago Móvil" ? "qr_code_scanner" : "payments"}
                  </span>
                  <p className="text-xs font-black text-amber-950">{metodoPago}</p>
                </div>
                <p className="mt-1 text-xs font-medium leading-relaxed text-amber-800">
                  {metodoPago === "Pago Móvil"
                    ? "El conductor aún no ha cargado sus datos de Pago Móvil. Solicítalos por WhatsApp y envía el comprobante."
                    : "Paga directamente al conductor al finalizar el viaje. Drivip no cobra comisiones."}
                </p>
              </div>
            )}

            <a
              href={whatsappHref ?? undefined}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                if (!whatsappHref) event.preventDefault();
              }}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 active:scale-[0.98] ${
                whatsappHref ? "" : "pointer-events-none opacity-40"
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">chat</span>
              Coordinar por WhatsApp
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
