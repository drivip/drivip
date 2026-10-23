import { useMemo, useState } from "react";
import type { ReservaCliente, ReservaEstado } from "@drivip/types";
import { useReservasConductor } from "@drivip/supabase";

interface ReservasProps {
  tenantId: string | null | undefined;
  demo?: boolean;
}

const ESTADO_LABEL: Record<ReservaEstado, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada",
};

const ESTADO_STYLE: Record<ReservaEstado, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  confirmada: "bg-emerald-100 text-emerald-700",
  completada: "bg-slate-200 text-slate-700",
  cancelada: "bg-rose-100 text-rose-700",
};

function formatFecha(fecha: string) {
  const date = new Date(fecha);
  if (!Number.isFinite(date.getTime())) return fecha;
  return date.toLocaleString("es-VE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReservaCard({
  reserva,
  busy,
  onEstado,
}: {
  reserva: ReservaCliente;
  busy: boolean;
  onEstado: (estado: ReservaEstado) => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {formatFecha(reserva.fecha_hora)}
          </p>
          <h3 className="mt-1 text-sm font-black text-slate-900">{reserva.origen}</h3>
          <p className="text-xs font-semibold text-slate-500">hacia {reserva.destino}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${ESTADO_STYLE[reserva.estado]}`}>
          {ESTADO_LABEL[reserva.estado]}
        </span>
      </div>

      {reserva.notas && (
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">{reserva.notas}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-black text-slate-900">
          {reserva.precio_usd != null ? `$${Number(reserva.precio_usd).toFixed(2)}` : "Por cotizar"}
        </span>
        <div className="flex gap-2">
          {reserva.estado === "pendiente" && (
            <>
              <button
                disabled={busy}
                onClick={() => onEstado("cancelada")}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 disabled:opacity-50"
              >
                Rechazar
              </button>
              <button
                disabled={busy}
                onClick={() => onEstado("confirmada")}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"
              >
                Confirmar
              </button>
            </>
          )}
          {reserva.estado === "confirmada" && (
            <>
              <button
                disabled={busy}
                onClick={() => onEstado("cancelada")}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                disabled={busy}
                onClick={() => onEstado("completada")}
                className="rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"
              >
                Completar
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Reservas({ tenantId, demo }: ReservasProps) {
  const { reservas, loading, error, actualizarEstadoReserva } = useReservasConductor(
    demo ? null : tenantId
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const ordenadas = useMemo(
    () =>
      [...reservas].sort(
        (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
      ),
    [reservas]
  );

  const cambiarEstado = async (id: string, estado: ReservaEstado) => {
    setBusyId(id);
    await actualizarEstadoReserva(id, estado);
    setBusyId(null);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5 lg:py-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">Reservas</h1>
          <p className="text-xs font-semibold text-slate-500">Servicios agendados por tus clientes.</p>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
          {ordenadas.length}
        </span>
      </div>

      {error && (
        <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-3xl bg-white/70" />
          ))}
        </div>
      ) : ordenadas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
          <p className="mt-3 text-sm font-black text-slate-700">No tienes reservas</p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Cuando un cliente agende un servicio contigo, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ordenadas.map((reserva) => (
            <ReservaCard
              key={reserva.id}
              reserva={reserva}
              busy={busyId === reserva.id}
              onEstado={(estado) => void cambiarEstado(reserva.id, estado)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
