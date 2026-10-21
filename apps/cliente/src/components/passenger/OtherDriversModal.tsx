import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeText } from "@drivip/maps";
import type { Driver } from "../../types/passenger";
import { useScrollLock } from "../../hooks/useScrollLock";
import AddConductorModal from "./AddConductorModal";
import DriverRating from "./DriverRating";

interface OtherDriversModalProps {
  open: boolean;
  drivers: Driver[];
  selectedDriverId: string | null;
  onClose: () => void;
  onSelect: (driver: Driver) => void;
  onConductorAdded: () => void;
  onUnfollow?: (driver: Driver) => void | Promise<void>;
}

export default function OtherDriversModal({
  open,
  drivers,
  selectedDriverId,
  onClose,
  onSelect,
  onConductorAdded,
  onUnfollow,
}: OtherDriversModalProps) {
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addTab, setAddTab] = useState<"search" | "qr">("search");
  const [confirmUnfollowId, setConfirmUnfollowId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setAddOpen(false);
      setConfirmUnfollowId(null);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const term = normalizeText(query);
    if (!term) return drivers;
    return drivers.filter((driver) =>
      normalizeText(
        `${driver.name} ${driver.vehicle} ${driver.plate} ${driver.vehicleColor} ${driver.phone}`
      ).includes(term)
    );
  }, [drivers, query]);

  if (!open) return null;

  const openAdd = (tab: "search" | "qr") => {
    setAddTab(tab);
    setAddOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-[115] flex items-end justify-center sm:items-center sm:p-4">
        <button
          type="button"
          aria-label="Cerrar lista de conductores"
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] border border-white/80 bg-white shadow-2xl sm:rounded-[32px]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/70 bg-white px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-purple-600">
                Tu red Drivip
              </p>
              <h2 className="truncate text-lg font-black text-slate-900">Otros conductores</h2>
              <p className="truncate text-[11px] font-semibold text-slate-400">
                {drivers.length} conductor{drivers.length === 1 ? "" : "es"} agregado{drivers.length === 1 ? "" : "s"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 active:scale-95"
            >
              <span className="material-symbols-outlined text-[19px]">close</span>
            </button>
          </div>

          <div className="shrink-0 px-4 py-3">
            <label className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 focus-within:border-purple-300 focus-within:bg-white">
              <span className="material-symbols-outlined text-[20px] text-slate-400">search</span>
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre, vehículo o placa"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Limpiar búsqueda"
                  className="text-slate-400"
                >
                  <span className="material-symbols-outlined text-[17px]">cancel</span>
                </button>
              )}
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-8 text-center">
                <span className="material-symbols-outlined text-[32px] text-slate-300">person_search</span>
                <p className="mt-2 text-xs font-bold text-slate-600">
                  {drivers.length === 0 ? "Aún no tienes conductores" : "Sin resultados"}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  {drivers.length === 0
                    ? "Agrega tu primer conductor por búsqueda o QR."
                    : "Prueba con otro nombre o agrega un conductor nuevo."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((driver) => {
                  const selected = directSelected(selectedDriverId, driver.id);
                  const available = driver.status === "available";
                  return (
                    <div
                      key={`other-${driver.id}`}
                      className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                        selected
                          ? "border-purple-300 bg-purple-50/70 ring-1 ring-purple-200"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="relative shrink-0">
                        {driver.image ? (
                          <img
                            alt={driver.name}
                            src={driver.image}
                            className="h-11 w-11 rounded-xl border border-white object-cover shadow-sm"
                          />
                        ) : (
                          <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-black text-white ${driver.color}`}>
                            {driver.initials}
                          </span>
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                            available ? "bg-emerald-500" : driver.status === "busy" ? "bg-amber-500" : "bg-slate-400"
                          }`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelect(driver);
                          onClose();
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-black text-slate-900">{driver.name}</p>
                          {driver.isVip && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-700">
                              VIP
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs font-semibold text-slate-500">
                          {driver.vehicle} · {driver.vehicleColor}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                          <DriverRating rating={driver.rating} reviews={driver.reviews} size="xs" />
                          <span className="text-[10px] font-bold text-slate-300">·</span>
                          <span className={`text-[10px] font-bold ${available ? "text-emerald-600" : "text-slate-400"}`}>
                            {available ? "Disponible" : driver.availability}
                          </span>
                        </div>
                      </button>

                      {onUnfollow && (
                        confirmUnfollowId === driver.id ? (
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              aria-label="Cancelar"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 active:scale-95"
                              onClick={() => setConfirmUnfollowId(null)}
                            >
                              <span className="material-symbols-outlined text-[17px]">close</span>
                            </button>
                            <button
                              type="button"
                              aria-label={`Confirmar dejar de seguir a ${driver.name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white active:scale-95"
                              onClick={() => {
                                setConfirmUnfollowId(null);
                                void onUnfollow(driver);
                              }}
                            >
                              <span className="material-symbols-outlined text-[17px]">person_remove</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            aria-label={`Dejar de seguir a ${driver.name}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-rose-500 active:scale-95"
                            onClick={() => setConfirmUnfollowId(driver.id)}
                          >
                            <span className="material-symbols-outlined text-[17px]">person_remove</span>
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onSelect(driver);
                          onClose();
                        }}
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          selected
                            ? "bg-purple-700 text-white"
                            : "border border-slate-200 bg-slate-50 text-slate-500"
                        }`}
                        aria-label={`Elegir a ${driver.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {selected ? "check" : "chevron_right"}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200/70 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
            <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Buscar o agregar conductores con QR
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openAdd("search")}
                className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 text-[11px] font-black text-slate-700 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">person_search</span>
                Buscar conductor
              </button>
              <button
                type="button"
                onClick={() => openAdd("qr")}
                className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-slate-900 text-[11px] font-black text-white shadow-md active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                Escanear QR
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddConductorModal
        open={addOpen}
        initialTab={addTab}
        onClose={() => setAddOpen(false)}
        onAdded={() => {
          onConductorAdded();
          setAddOpen(false);
        }}
      />
    </>
  );
}

function directSelected(selectedDriverId: string | null, driverId: string): boolean {
  return selectedDriverId === driverId;
}
