import { useResenasConductor } from "@drivip/supabase";
import { useScrollLock } from "../../hooks/useScrollLock";

interface DriverReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId?: string | null;
}

function Estrellas({ valor, size = "text-[16px]" }: { valor: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((estrella) => (
        <span
          key={estrella}
          className={`material-symbols-outlined ${size} ${
            estrella <= Math.round(valor) ? "text-amber-400" : "text-slate-200"
          }`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      ))}
    </div>
  );
}

export default function DriverReviewsModal({ isOpen, onClose, tenantId }: DriverReviewsModalProps) {
  const { resenas, total, promedio, distribucion, loading, error } = useResenasConductor(
    isOpen ? tenantId : null
  );

  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[82dvh] sm:rounded-3xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <span className="material-symbols-outlined text-[20px]">reviews</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black text-slate-900">Mis reseñas</h2>
            <p className="text-[10px] font-semibold text-slate-500">Lo que dicen tus clientes</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-95"
            aria-label="Cerrar reseñas"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <p className="py-10 text-center text-xs font-semibold text-slate-400">Cargando reseñas...</p>
          )}

          {!loading && error && (
            <p className="py-10 text-center text-xs font-semibold text-rose-500">{error}</p>
          )}

          {!loading && !error && total === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <span className="material-symbols-outlined text-[32px] text-slate-300">star</span>
              </div>
              <p className="mt-3 text-sm font-black text-slate-700">Sin reseñas todavía</p>
              <p className="mt-1 max-w-[260px] text-[11px] text-slate-400">
                Cuando tus clientes califiquen un servicio completado, verás aquí su opinión y tu promedio.
              </p>
            </div>
          )}

          {!loading && !error && total > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-3 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                <div className="col-span-2 flex flex-col items-center justify-center border-r border-amber-100">
                  <p className="text-4xl font-black leading-none text-slate-900">
                    {promedio.toFixed(1)}
                  </p>
                  <Estrellas valor={promedio} size="text-[14px]" />
                  <p className="mt-1 text-[10px] font-bold text-slate-500">
                    {total} {total === 1 ? "reseña" : "reseñas"}
                  </p>
                </div>
                <div className="col-span-3 space-y-1">
                  {distribucion.map((fila) => {
                    const porcentaje = total > 0 ? (fila.cantidad / total) * 100 : 0;
                    return (
                      <div key={fila.estrellas} className="flex items-center gap-1.5">
                        <span className="w-2 text-[9px] font-bold text-slate-500">{fila.estrellas}</span>
                        <span className="material-symbols-outlined text-[11px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${porcentaje}%` }} />
                        </div>
                        <span className="w-4 text-right text-[9px] font-bold text-slate-400">
                          {fila.cantidad}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                {resenas.map((resena, index) => (
                  <article
                    key={`${resena.fecha}-${index}`}
                    className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-[11px] font-black text-purple-700">
                          {resena.cliente.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-900">{resena.cliente}</p>
                          <p className="text-[9px] font-semibold text-slate-400">
                            {new Date(resena.fecha).toLocaleDateString("es-VE", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <Estrellas valor={resena.calificacion} size="text-[13px]" />
                    </div>
                    {resena.comentario && (
                      <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
                        {resena.comentario}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
