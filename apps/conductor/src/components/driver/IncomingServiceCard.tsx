import type { Carrera } from "@drivip/types";

interface IncomingServiceCardProps {
  carrera: Carrera;
  clienteNombre: string;
  clienteTelefono?: string | null;
  onAccept: () => void;
  onOpenMap: () => void;
  onReject: () => void;
}

const TIPO_LABEL: Record<string, string> = {
  viaje: "Viaje",
  delivery: "Delivery",
  compra: "Compra",
};

function inicial(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || "C";
}

export default function IncomingServiceCard({
  carrera,
  clienteNombre,
  clienteTelefono,
  onAccept,
  onOpenMap,
  onReject,
}: IncomingServiceCardProps) {
  const tipo = carrera.tipo_servicio ?? "viaje";
  const esCompra = tipo === "compra";
  const sinPrecio = esCompra && !carrera.precio;

  return (
    <article className="overflow-hidden rounded-3xl border-2 border-amber-300 bg-white shadow-xl shadow-amber-200/40">
      <div className="flex items-center justify-between bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <p className="text-[11px] font-black uppercase tracking-wide text-white">
            Nueva solicitud
          </p>
        </div>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black text-white">
          {TIPO_LABEL[tipo] ?? tipo}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-base font-black text-white shadow-md">
              {inicial(clienteNombre)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">{clienteNombre}</p>
              <p className="truncate text-[10px] font-semibold text-slate-500">
                {clienteTelefono || "Cliente de tu red"}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            {sinPrecio ? (
              <p className="text-xs font-black text-amber-600">Por cotizar</p>
            ) : (
              <p className="text-lg font-black text-slate-900">
                ${(carrera.precio ?? 0).toFixed(2)}
              </p>
            )}
            <p className="text-[9px] font-bold text-purple-600">
              {carrera.distancia_km ?? 0} km · {carrera.duracion_min ?? "—"} min
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-start gap-2">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">Origen</p>
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
        </div>

        {tipo !== "viaje" && carrera.detalle_servicio && (
          <div className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2">
            <p className="text-[10px] font-bold text-orange-800">{carrera.detalle_servicio}</p>
          </div>
        )}

        <div className="grid grid-cols-5 gap-2">
          <button
            type="button"
            onClick={onReject}
            className="col-span-1 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-slate-500 active:scale-95"
            aria-label="Rechazar solicitud"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
          <button
            type="button"
            onClick={onOpenMap}
            className="col-span-2 flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-[11px] font-bold text-slate-700 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">map</span>
            Ver mapa
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="col-span-2 flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 py-2.5 text-[11px] font-black text-white shadow-lg shadow-purple-600/25 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Aceptar
          </button>
        </div>
      </div>
    </article>
  );
}
