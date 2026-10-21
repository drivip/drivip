import { useEffect, useState } from "react";
import type { Carrera } from "@drivip/types";
import { CarreraChat } from "@drivip/supabase";
import { useScrollLock } from "../../hooks/useScrollLock";
import DriverMapView from "./DriverMapView";
import EndTripConfirmation from "./EndTripConfirmation";

interface ActiveServiceModalProps {
  carrera: Carrera;
  clienteNombre: string;
  clienteTelefono?: string | null;
  onArrived: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

const TIPO_LABEL: Record<string, string> = {
  viaje: "Viaje",
  delivery: "Delivery",
  compra: "Compra",
};

function initials(nombre: string): string {
  return (
    nombre
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "C"
  );
}

export default function ActiveServiceModal({
  carrera,
  clienteNombre,
  clienteTelefono,
  onArrived,
  onStart,
  onComplete,
  onCancel,
}: ActiveServiceModalProps) {
  const [pickupArrived, setPickupArrived] = useState(Boolean(carrera.llego_at));
  const [atDestination, setAtDestination] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showEndTrip, setShowEndTrip] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useScrollLock(true);

  useEffect(() => {
    if (carrera.llego_at) setPickupArrived(true);
  }, [carrera.llego_at]);

  useEffect(() => {
    setAtDestination(false);
  }, [carrera.id]);

  const enCurso = carrera.estado === "en_curso";
  const pickupCoords: [number, number] = [carrera.origen_lat, carrera.origen_lng];
  const destinationCoords: [number, number] | null =
    enCurso && carrera.destino_lat && carrera.destino_lng
      ? [carrera.destino_lat, carrera.destino_lng]
      : null;

  const ridePhase = enCurso
    ? atDestination
      ? "at_destination"
      : "in_trip"
    : pickupArrived
      ? "at_pickup"
      : "going_to_pickup";

  const faseLabel = enCurso
    ? atDestination
      ? "En el destino"
      : "Viaje en curso"
    : pickupArrived
      ? "En el punto de recogida"
      : "En camino al cliente";

  const faseColor = enCurso ? "bg-emerald-500" : pickupArrived ? "bg-purple-600" : "bg-amber-500";
  const tipo = carrera.tipo_servicio ?? "viaje";

  const handleArrived = () => {
    setPickupArrived(true);
    onArrived();
  };

  const handleStart = () => {
    onStart();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-slate-900">
      <DriverMapView
        isOnline
        pickupCoords={pickupCoords}
        destinationCoords={destinationCoords}
        ridePhase={ridePhase}
        onArrivedAtDestination={() => setAtDestination(true)}
      />

      <div className="absolute inset-x-0 bottom-0 z-30 max-h-[62dvh] overflow-y-auto rounded-t-3xl border-t border-white/70 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-16px_50px_rgba(15,23,42,0.28)]">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-sm font-black text-white shadow-lg">
              {initials(clienteNombre)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${faseColor}`} />
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  {faseLabel}
                </p>
              </div>
              <p className="truncate text-base font-black leading-tight text-slate-900">
                {clienteNombre}
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                <span>{TIPO_LABEL[tipo] ?? tipo}</span>
                {clienteTelefono && (
                  <a
                    href={`tel:${clienteTelefono}`}
                    className="inline-flex items-center gap-1 text-purple-600"
                  >
                    <span className="material-symbols-outlined text-[12px]">call</span>
                    Llamar
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">Tarifa</p>
            <p className="text-xl font-black text-slate-900">${(carrera.precio ?? 0).toFixed(2)}</p>
            <p className="text-[9px] font-bold text-purple-600">
              {carrera.metodo_pago === "pago_movil"
                ? "Pago Móvil"
                : carrera.metodo_pago === "transferencia"
                  ? "Transferencia"
                  : "Efectivo"}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-start gap-2">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                {tipo === "compra" ? "Punto de encuentro" : "Origen"}
              </p>
              <p className="truncate text-[11px] font-bold text-slate-800">
                {carrera.origen_direccion ?? "Sin dirección"}
              </p>
            </div>
          </div>
          <div className="ml-1 h-2 border-l border-dashed border-slate-300" />
          <div className="flex items-start gap-2">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" />
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">Destino</p>
              <p className="truncate text-[11px] font-bold text-slate-800">
                {carrera.destino_direccion ?? "Sin dirección"}
              </p>
            </div>
          </div>
          {tipo !== "viaje" && carrera.detalle_servicio && (
            <div className="rounded-xl border border-orange-100 bg-orange-50 px-2.5 py-2">
              <p className="text-[10px] font-bold text-orange-800">{carrera.detalle_servicio}</p>
            </div>
          )}
        </div>

        <div className="mt-3">
          {!enCurso && !pickupArrived && (
            <button
              type="button"
              onClick={handleArrived}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/25 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">where_to_vote</span>
              Ya llegué al punto de recogida
            </button>
          )}

          {!enCurso && pickupArrived && (
            <button
              type="button"
              onClick={handleStart}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 py-3.5 text-sm font-black text-white shadow-lg shadow-purple-600/25 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">person_pin_circle</span>
              Recogí al cliente · Iniciar viaje
            </button>
          )}

          {enCurso && (
            <button
              type="button"
              onClick={() => setShowEndTrip(true)}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white shadow-lg active:scale-[0.98] ${
                atDestination
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/25"
                  : "bg-gradient-to-r from-slate-700 to-slate-900 shadow-slate-500/25"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {atDestination ? "check_circle" : "flag"}
              </span>
              {atDestination ? "Finalizar viaje" : "Finalizar viaje manualmente"}
            </button>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowChat((value) => !value)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-700 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-purple-600">chat</span>
            {showChat ? "Ocultar mensajes" : "Mensajes"}
          </button>

          {!confirmCancel ? (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="text-[10px] font-bold text-rose-500 active:scale-95"
            >
              Cancelar servicio
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="text-[10px] font-bold text-slate-500"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-[10px] font-black text-white active:scale-95"
              >
                Sí, cancelar
              </button>
            </div>
          )}
        </div>

        {showChat && (
          <div className="mt-3">
            <CarreraChat carreraId={carrera.id} rol="conductor" defaultOpen />
          </div>
        )}
      </div>

      <EndTripConfirmation
        isOpen={showEndTrip}
        onClose={() => setShowEndTrip(false)}
        onConfirm={() => {
          setShowEndTrip(false);
          onComplete();
        }}
        rideDetails={{
          cliente: clienteNombre,
          origen: carrera.origen_direccion ?? "Origen",
          destino: carrera.destino_direccion ?? "Destino",
          precioUsd: carrera.precio ?? 0,
          precioBs: (carrera.precio ?? 0) * 58,
        }}
      />
    </div>
  );
}
