import { useState, useEffect } from "react";
import type { Carrera } from "@drivip/types";
import { formatearBs, TASA_BCV_REFERENCIA } from "@drivip/types";
import { useTasaCambio } from "@drivip/supabase";
import { MapLibreView, haversineKm, fetchRoute } from "@drivip/maps";

const VOYAGER_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

interface IncomingOrderModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: (reason?: string) => void;
  onQuote?: (precio: number) => Promise<boolean>;
  carrera: Carrera;
}

const QUICK_REJECTIONS = [
  "Lo siento, no estoy disponible",
  "Me desocupo en 30 min",
  "Zona fuera de cobertura",
];

export default function IncomingOrderModal({ isOpen, onAccept, onReject, onQuote, carrera }: IncomingOrderModalProps) {
  const [showRejectOptions, setShowRejectOptions] = useState(false);
  const [routePreview, setRoutePreview] = useState<[number, number][] | null>(null);
  const [distanceKm, setDistanceKm] = useState(carrera.distancia_km ?? 0);
  const [quoteValue, setQuoteValue] = useState("");
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [quoteSent, setQuoteSent] = useState(false);
  const { tasa } = useTasaCambio();

  const isPurchase = carrera.tipo_servicio === "compra";
  const isDelivery = carrera.tipo_servicio === "delivery";

  const handleSendQuote = async () => {
    const precio = Number(String(quoteValue).replace(",", "."));
    if (!Number.isFinite(precio) || precio <= 0) {
      setQuoteError("Escribe un precio válido mayor a cero.");
      return;
    }
    if (!onQuote) return;
    setQuoting(true);
    setQuoteError("");
    const ok = await onQuote(precio);
    setQuoting(false);
    if (!ok) {
      setQuoteError("No pudimos enviar el precio. Intenta de nuevo.");
      return;
    }
    setQuoteSent(true);
  };

  const originCoords: [number, number] = [carrera.origen_lat, carrera.origen_lng];
  const destCoords: [number, number] | null = carrera.destino_lat && carrera.destino_lng
    ? [carrera.destino_lat, carrera.destino_lng]
    : null;

  const center: [number, number] = originCoords;

  useEffect(() => {
    if (!isOpen || !destCoords) return;

    fetchRoute(originCoords, destCoords).then((route) => {
      if (route) {
        setRoutePreview(route.geometry);
        setDistanceKm(route.totalDistance / 1000);
      }
    });
  }, [isOpen, destCoords?.[0], destCoords?.[1]]);

  useEffect(() => {
    if (!isOpen) {
      setShowRejectOptions(false);
      setRoutePreview(null);
      setQuoteValue("");
      setQuoteError("");
      setQuoteSent(false);
      setQuoting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm" onClick={() => onReject()} />

      <div className="relative bg-white w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
        <div className="relative h-44 flex-shrink-0">
          <MapLibreView
            center={center}
            zoom={14}
            mapStyle={VOYAGER_STYLE}
            origin={{ lat: originCoords[0], lng: originCoords[1], label: "Origen" }}
            destination={destCoords ? { lat: destCoords[0], lng: destCoords[1], label: "Destino" } : null}
            route={routePreview ?? undefined}
          />
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-sm font-black text-white bg-slate-900/70 backdrop-blur-sm px-3 py-1 rounded-full">Nueva Solicitud</h3>
          </div>
          <button
            onClick={() => onReject()}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-slate-900/50 backdrop-blur-sm flex items-center justify-center text-white active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
          <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-700 shadow">
            {distanceKm.toFixed(1)} km
          </div>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center border-2 border-white shadow-md">
                <span className="text-base font-bold text-purple-700">
                  {carrera.cliente_id?.charAt(0)?.toUpperCase() ?? "C"}
                </span>
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Cliente</p>
                <p className="text-[10px] text-slate-500">ID: {carrera.cliente_id}</p>
              </div>
            </div>
            <div className="text-right">
              {isPurchase && !carrera.precio ? (
                <p className="text-sm font-black text-amber-600">Por cotizar</p>
              ) : (
                <>
                  <p className="text-xl font-black text-slate-900">${(carrera.precio ?? 0).toFixed(2)}</p>
                  <p className="text-[10px] font-bold text-purple-600">
                    {formatearBs(carrera.precio ?? 0, tasa ?? TASA_BCV_REFERENCIA)}
                  </p>
                </>
              )}
            </div>
          </div>

          {carrera.tipo_servicio && carrera.tipo_servicio !== "viaje" && (
            <div className={`rounded-2xl border p-3 ${isPurchase ? "border-emerald-200 bg-emerald-50" : "border-orange-200 bg-orange-50"}`}>
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[18px] ${isPurchase ? "text-emerald-600" : "text-orange-600"}`}>
                  {isPurchase ? "shopping_bag" : "package_2"}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wide ${isPurchase ? "text-emerald-700" : "text-orange-700"}`}>
                  {isPurchase ? "Servicio de compra" : "Delivery"}
                </span>
              </div>
              <p className="mt-1.5 text-xs font-bold text-slate-800">{carrera.detalle_servicio ?? "Sin detalle"}</p>
            </div>
          )}

          <div className="bg-slate-50 rounded-2xl p-3 space-y-2 border border-slate-100">
            <div className="flex items-start gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Origen</span>
                <p className="text-xs font-bold text-slate-800">{carrera.origen_direccion ?? "Sin dirección"}</p>
              </div>
            </div>
            <div className="ml-1.5 w-px h-3 border-l border-dashed border-slate-300" />
            <div className="flex items-start gap-2.5">
              <span className="w-3 h-3 rounded-full bg-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Destino</span>
                <p className="text-xs font-bold text-slate-800">{carrera.destino_direccion ?? "Sin dirección"}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">straighten</span>
              {distanceKm.toFixed(1)} km
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              {carrera.duracion_min ?? Math.max(1, Math.round(distanceKm * 3))} min
            </span>
            <span className="flex items-center gap-1 capitalize">
              <span className="material-symbols-outlined text-[14px]">payments</span>
              {carrera.metodo_pago === "pago_movil" ? "Pago M�vil" :
               carrera.metodo_pago === "transferencia" ? "Transferencia" : "Efectivo"}
            </span>
          </div>

          {isPurchase && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-600">request_quote</span>
                <p className="text-xs font-black text-amber-800">Envía tu precio al cliente</p>
              </div>
              {quoteSent ? (
                <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                  <p className="text-[11px] font-bold text-emerald-700">
                    Precio enviado. Espera la confirmación del cliente.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 items-center rounded-xl border border-amber-200 bg-white px-3 text-xs font-black text-slate-500">
                      $
                    </span>
                    <input
                      value={quoteValue}
                      onChange={(event) => setQuoteValue(event.target.value)}
                      inputMode="decimal"
                      placeholder="0.00"
                      className="h-10 min-w-0 flex-1 rounded-xl border border-amber-200 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={() => void handleSendQuote()}
                      disabled={quoting}
                      className="h-10 rounded-xl bg-amber-500 px-3.5 text-[11px] font-black text-white shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {quoting ? "..." : "Enviar"}
                    </button>
                  </div>
                  {quoteError && <p className="text-[10px] font-bold text-rose-600">{quoteError}</p>}
                </>
              )}
            </div>
          )}

          {showRejectOptions ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500">Motivo de rechazo:</p>
              {QUICK_REJECTIONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => { onReject(reason); setShowRejectOptions(false); }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 text-left active:scale-[0.98] transition hover:bg-slate-100"
                >
                  {reason}
                </button>
              ))}
              <button
                onClick={() => setShowRejectOptions(false)}
                className="w-full py-2 text-xs text-slate-400 font-medium"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              <button
                onClick={() => setShowRejectOptions(true)}
                className="col-span-2 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 text-sm font-bold active:scale-[0.98] transition flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                Declinar
              </button>
              <button
                onClick={onAccept}
                className="col-span-3 py-3 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white text-sm font-black active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
              >
                <span className="material-symbols-outlined text-[20px] animate-bounce">check_circle</span>
                Aceptar Servicio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
