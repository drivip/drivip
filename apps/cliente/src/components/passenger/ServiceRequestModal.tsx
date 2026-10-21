import { useEffect, useMemo, useRef, useState } from "react";
import { fetchDrivingRoute } from "@drivip/maps";
import {
  calcularTarifaKm,
  DEFAULT_TARIFA_BASE,
  DEFAULT_TARIFA_POR_KM,
  formatearBs,
  formatearUsd,
  type TarifasTenant,
} from "@drivip/types";
import type { Driver, SavedAddress } from "../../types/passenger";
import { useScrollLock } from "../../hooks/useScrollLock";
import MapPickerModal from "./MapPickerModal";

export type ServiceMode = "delivery" | "purchase";

export interface ServiceRequestInput {
  mode: ServiceMode;
  service: string;
  origin: { address: string; lat: number; lng: number };
  destination: { address: string; lat: number; lng: number };
  distanceKm: number;
  durationMin: number;
  priceUsd: number;
  driverId: string;
}

interface ServiceRequestModalProps {
  isOpen: boolean;
  mode: ServiceMode;
  drivers: Driver[];
  selectedDriverId: string | null;
  tarifas?: TarifasTenant | null;
  tasa?: number | null;
  currentLocation: { lat: number; lng: number; address: string } | null;
  savedAddresses: SavedAddress[];
  onSelectDriver: (driver: Driver) => void;
  onClose: () => void;
  onSubmit: (input: ServiceRequestInput) => Promise<boolean>;
}

interface RequestPlace {
  address: string;
  lat: number;
  lng: number;
}

const DELIVERY_EXAMPLES = ["Paquete", "Documentos", "Comida", "Medicina"];
const PURCHASE_EXAMPLES = ["Comida", "Farmacia", "Supermercado", "Otro"];

const MODE_COPY = {
  delivery: {
    eyebrow: "Delivery Drivip",
    title: "Enviar paquete",
    subtitle: "Tu conductor recibe la solicitud con origen, destino y precio.",
    icon: "package_2",
    gradient: "from-orange-500 to-rose-600",
    serviceLabel: "¿Qué vas a enviar?",
    servicePlaceholder: "Ej. paquete mediano, documentos, comida...",
    originLabel: "Recoger en",
    destinationLabel: "Entregar en",
    examples: DELIVERY_EXAMPLES,
    submitLabel: "Enviar solicitud al conductor",
  },
  purchase: {
    eyebrow: "Compra asistida",
    title: "Servicio de compra",
    subtitle: "El conductor compra y luego te envía el precio desde su panel.",
    icon: "shopping_bag",
    gradient: "from-emerald-600 to-teal-700",
    serviceLabel: "¿Qué necesitas comprar?",
    servicePlaceholder: "Ej. comida, medicina, un producto del supermercado...",
    originLabel: "Comprar en",
    destinationLabel: "Entregar en",
    examples: PURCHASE_EXAMPLES,
    submitLabel: "Pedir compra al conductor",
  },
} as const;

function normalizePlace(value: RequestPlace): RequestPlace {
  return { address: value.address.trim(), lat: value.lat, lng: value.lng };
}

export default function ServiceRequestModal({
  isOpen,
  mode,
  drivers,
  selectedDriverId,
  tarifas,
  tasa,
  currentLocation,
  savedAddresses,
  onSelectDriver,
  onClose,
  onSubmit,
}: ServiceRequestModalProps) {
  const copy = MODE_COPY[mode];
  const [service, setService] = useState("");
  const [origin, setOrigin] = useState<RequestPlace | null>(null);
  const [destination, setDestination] = useState<RequestPlace | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ km: number; min: number } | null>(null);
  const [picker, setPicker] = useState<"origin" | "destination" | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const routeRequestRef = useRef(0);
  const wasOpenRef = useRef(false);

  useScrollLock(isOpen);

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === selectedDriverId) ?? drivers[0] ?? null,
    [drivers, selectedDriverId]
  );

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;

    const base = currentLocation
      ? { address: currentLocation.address, lat: currentLocation.lat, lng: currentLocation.lng }
      : null;
    setService("");
    setOrigin(base);
    setDestination(mode === "delivery" ? null : base);
    setRouteInfo(null);
    setPicker(null);
    setFormError("");
    setSubmitting(false);
  }, [isOpen, mode, currentLocation]);

  useEffect(() => {
    if (!isOpen || !origin || !destination) {
      setRouteInfo(null);
      setLoadingRoute(false);
      return;
    }

    const requestId = routeRequestRef.current + 1;
    routeRequestRef.current = requestId;
    setLoadingRoute(true);

    fetchDrivingRoute([origin, destination])
      .then((route) => {
        if (routeRequestRef.current !== requestId) return;
        setRouteInfo(route ? { km: route.distanceKm, min: route.durationMin } : null);
      })
      .catch(() => {
        if (routeRequestRef.current === requestId) setRouteInfo(null);
      })
      .finally(() => {
        if (routeRequestRef.current === requestId) setLoadingRoute(false);
      });
  }, [isOpen, origin, destination]);

  const priceUsd = useMemo(() => {
    if (mode !== "delivery" || !routeInfo) return 0;
    if (tarifas?.modo === "zona") {
      return Number(tarifas.zonas[0]?.precio ?? tarifas.base ?? 0);
    }
    return calcularTarifaKm(
      tarifas?.base ?? DEFAULT_TARIFA_BASE,
      tarifas?.por_km ?? DEFAULT_TARIFA_POR_KM,
      routeInfo.km
    );
  }, [mode, routeInfo, tarifas]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setFormError("");
    if (service.trim().length < 3) {
      setFormError("Describe el servicio que necesitas.");
      return;
    }
    if (!origin) {
      setFormError(`Indica dónde ${mode === "delivery" ? "recogemos" : "compramos"}.`);
      return;
    }
    if (!destination) {
      setFormError("Indica el lugar de entrega.");
      return;
    }
    if (!selectedDriver) {
      setFormError("No tienes un conductor seleccionado. Agrega uno a tu red.");
      return;
    }
    if (mode === "delivery" && !routeInfo) {
      setFormError("No pudimos calcular la ruta. Vuelve a elegir las ubicaciones.");
      return;
    }

    const effectiveRoute = routeInfo ?? { km: 0, min: 0 };

    setSubmitting(true);
    try {
      const ok = await onSubmit({
        mode,
        service: service.trim(),
        origin: normalizePlace(origin),
        destination: normalizePlace(destination),
        distanceKm: effectiveRoute.km,
        durationMin: effectiveRoute.min,
        priceUsd,
        driverId: selectedDriver.id,
      });
      if (ok) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[105] flex items-end justify-center sm:items-center sm:p-4">
        <button
          type="button"
          aria-label="Cerrar solicitud de servicio"
          className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] border border-white/80 bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-[32px]">
          <div className={`shrink-0 bg-gradient-to-r ${copy.gradient} px-4 py-4 text-white`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[23px]">{copy.icon}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/75">
                    {copy.eyebrow}
                  </p>
                  <h2 className="text-lg font-black leading-tight">{copy.title}</h2>
                  <p className="text-[11px] font-medium leading-snug text-white/80">
                    {copy.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
                {copy.serviceLabel}
              </label>
              <input
                value={service}
                onChange={(event) => {
                  setService(event.target.value);
                  if (event.target.value.trim().length >= 3) setFormError("");
                }}
                placeholder={copy.servicePlaceholder}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-purple-300 focus:bg-white"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {copy.examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setService(example)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                      service === example
                        ? "border-purple-300 bg-purple-50 text-purple-700"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50/60 p-3">
              <div className="space-y-2">
                <LocationRow
                  label={copy.originLabel}
                  icon="radio_button_checked"
                  color="text-emerald-600"
                  place={origin}
                  onOpen={() => setPicker("origin")}
                />
                <div className="ml-3 h-4 border-l-2 border-dashed border-slate-300" />
                <LocationRow
                  label={copy.destinationLabel}
                  icon="location_on"
                  color="text-rose-600"
                  place={destination}
                  onOpen={() => setPicker("destination")}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
                Conductor
              </label>
              {drivers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-[11px] font-bold text-amber-800">
                  No tienes conductores en tu red. Agrega uno para enviar el servicio.
                </div>
              ) : (
                <select
                  value={selectedDriver?.id ?? ""}
                  onChange={(event) => {
                    const driver = drivers.find((item) => item.id === event.target.value);
                    if (driver) onSelectDriver(driver);
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-700 outline-none focus:border-purple-300"
                >
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} · {driver.vehicle} · {driver.status === "available" ? "Disponible" : driver.availability}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {mode === "delivery" ? (
              <div className="rounded-[22px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                      Precio estimado del envío
                    </p>
                    <p className="mt-1 text-[24px] font-black leading-none text-emerald-800">
                      {loadingRoute ? "Calculando..." : routeInfo ? formatearUsd(priceUsd) : "-"}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                      {routeInfo
                        ? `${formatearBs(priceUsd, tasa ?? undefined)} · ${routeInfo.km.toFixed(1)} km · ${Math.round(routeInfo.min)} min`
                        : "Elige origen y destino para calcular"}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                    <span className="material-symbols-outlined text-[22px]">receipt_long</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] border border-amber-100 bg-amber-50 p-3.5">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[19px] text-amber-600">request_quote</span>
                  <div>
                    <p className="text-[11px] font-black text-amber-800">El precio lo envía tu conductor</p>
                    <p className="mt-0.5 text-[10px] font-semibold leading-relaxed text-amber-700/80">
                      Verá tu solicitud con el servicio y la ubicación. Te enviará la cotización al instante.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {formError && (
              <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2.5">
                <span className="material-symbols-outlined text-[16px] text-rose-600">error</span>
                <p className="text-[11px] font-bold leading-relaxed text-rose-700">{formError}</p>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200/70 bg-white px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting || (mode === "delivery" && loadingRoute) || drivers.length === 0}
              className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${copy.gradient} text-[13px] font-black text-white shadow-lg transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Enviando solicitud...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  {copy.submitLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <MapPickerModal
        isOpen={picker !== null}
        onClose={() => setPicker(null)}
        onConfirmPin={(place, point) => {
          if (point === "origin") setOrigin(place);
          else setDestination(place);
          setPicker(null);
          setFormError("");
        }}
        onConfirmRoute={(routeOrigin, _stops, routeDestination, totalKm, totalMin) => {
          setOrigin(routeOrigin);
          setDestination(routeDestination);
          setRouteInfo({ km: totalKm, min: totalMin });
          setPicker(null);
          setFormError("");
        }}
        initialOrigin={origin}
        pointType={picker ?? "destination"}
        suggestions={savedAddresses.map((address) => ({
          id: address.id,
          name: address.name,
          address: address.address,
          lat: address.lat,
          lng: address.lng,
          icon: address.icon,
        }))}
      />
    </>
  );
}

function LocationRow({
  label,
  icon,
  color,
  place,
  onOpen,
}: {
  label: string;
  icon: string;
  color: string;
  place: RequestPlace | null;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left shadow-sm active:scale-[0.99]"
    >
      <span className={`material-symbols-outlined text-[20px] ${color}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`truncate text-[13px] font-bold ${place ? "text-slate-800" : "text-slate-400"}`}>
          {place?.address || "Toca para elegir en el mapa"}
        </p>
      </div>
      <span className="material-symbols-outlined text-[18px] text-slate-300">chevron_right</span>
    </button>
  );
}
