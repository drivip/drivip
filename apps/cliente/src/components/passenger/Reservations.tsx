import { useState } from "react";
import type { Reservation } from "../../types/passenger";

interface NuevaReservaInput {
  origen: string;
  destino: string;
  fecha_hora: string;
  notas?: string;
  precio_usd?: number | null;
}

interface ReservationsProps {
  reservations: Reservation[];
  onBack: () => void;
  onCreate?: (input: NuevaReservaInput) => Promise<{ error: string | null }>;
  onCancel?: (id: string) => Promise<{ error: string | null }>;
}

export default function Reservations({ reservations, onBack, onCreate, onCancel }: ReservationsProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<NuevaReservaInput>({
    origen: "",
    destino: "",
    fecha_hora: "",
    notas: "",
    precio_usd: null,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreate || !form.origen.trim() || !form.destino.trim() || !form.fecha_hora) return;
    setSaving(true);
    setFormError(null);
    const { error } = await onCreate(form);
    setSaving(false);
    if (error) {
      setFormError(error);
      return;
    }
    setForm({ origen: "", destino: "", fecha_hora: "", notas: "", precio_usd: null });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      {/* TopHeader */}
      <header className="sticky top-0 z-30 bg-[#f4f6f8]/90 backdrop-blur-md px-5 lg:px-8 pt-4 pb-3 flex items-center justify-between border-b border-slate-200/50">
        <button aria-label="Volver" className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-white flex items-center justify-center text-slate-700 active:scale-95 transition-transform border border-white" style={{ boxShadow: "6px 6px 14px rgba(166, 180, 200, 0.25), -6px -6px 14px rgba(255, 255, 255, 0.9)" }} onClick={onBack}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h1 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight leading-tight">Mis Reservas</h1>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs lg:text-sm font-semibold text-slate-500">Drivip VIP</span>
          </div>
        </div>
        <button aria-label="Nueva Reserva" onClick={() => setShowForm(true)} className="h-10 lg:h-12 px-3 lg:px-4 rounded-2xl bg-white border border-white flex items-center gap-1 text-slate-800 active:scale-95 transition-transform" style={{ boxShadow: "6px 6px 14px rgba(166, 180, 200, 0.25), -6px -6px 14px rgba(255, 255, 255, 0.9)" }}>
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs lg:text-sm font-bold text-slate-700">Nueva</span>
        </button>
      </header>

      {/* MainContent */}
      <main className="flex-1 px-4 lg:px-8 py-4 space-y-4 pb-32">
        {/* SegmentedFilterTab */}
        <nav className="p-1.5 bg-slate-200/70 rounded-2xl flex items-center gap-1" style={{ boxShadow: "inset 3px 3px 6px rgba(166, 180, 200, 0.25), inset -3px -3px 6px rgba(255, 255, 255, 0.9)" }}>
          <button className="flex-1 py-2.5 lg:py-3 px-3 rounded-xl bg-white text-xs lg:text-sm font-bold text-slate-900 shadow-sm flex items-center justify-center gap-1.5 transition-all">
            <span>Próximas</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[11px] lg:text-xs font-extrabold">{reservations.length}</span>
          </button>
          <button className="flex-1 py-2.5 lg:py-3 px-3 rounded-xl text-xs lg:text-sm font-semibold text-slate-500 flex items-center justify-center gap-1.5 transition-all hover:text-slate-700">
            <span>Pasadas</span>

          </button>
        </nav>

        {/* Reservation Cards */}
        <div className="lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-5 space-y-4 lg:space-y-0">
          {reservations.map((res) => (
            <article key={res.id} className="bg-white rounded-3xl p-5 lg:p-6 border border-slate-100/90 relative overflow-hidden transition-transform" style={{ boxShadow: "0 12px 30px -10px rgba(148, 163, 184, 0.35)" }}>
              {/* Top accent strip */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                res.status === "confirmed"
                  ? "bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600"
                  : "bg-gradient-to-r from-purple-500 to-indigo-500"
              }`}></div>

              {/* Card Top Bar */}
              <div className="flex items-start justify-between gap-2 pt-1 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className={`w-11 h-11 lg:w-12 lg:h-12 rounded-2xl flex flex-col items-center justify-center border shadow-sm ${
                    res.status === "confirmed"
                      ? "bg-orange-50 text-orange-600 border-orange-100"
                      : "bg-purple-50 text-purple-700 border-purple-100"
                  }`}>
                    <span className="text-[10px] lg:text-[11px] font-extrabold tracking-wider uppercase">{res.dayShort}</span>
                    <span className="text-sm lg:text-base font-black leading-none">{res.dayNum}</span>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm font-semibold text-slate-400 uppercase tracking-wider">{res.title}</p>
                    <h2 className="text-sm lg:text-base font-extrabold text-slate-900">{res.dateLabel}</h2>
                  </div>
                </div>
                {res.status === "confirmed" && res.countdown ? (
                  <div className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] lg:text-xs font-extrabold flex items-center gap-1.5" style={{ boxShadow: "0 4px 14px rgba(255, 87, 34, 0.35)" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    <span>{res.countdown}</span>
                  </div>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] lg:text-[11px] font-extrabold border border-amber-200/80">
                    Por Asignar
                  </span>
                )}
              </div>

              {/* Route Details */}
              <div className="py-4 space-y-3 relative">
                <div className="absolute left-4 top-7 bottom-7 w-0.5 border-l border-dashed border-slate-200"></div>
                <div className="flex items-start gap-3 relative">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm border border-emerald-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v3m0 14v3m10-10h-3M5 12H2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] lg:text-xs font-bold text-slate-400 tracking-wider uppercase">Punto de Origen</p>
                    <p className="text-xs lg:text-sm font-bold text-slate-800 leading-tight">{res.origin}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 relative">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-sm border border-orange-200">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path clipRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" fillRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] lg:text-xs font-bold text-orange-600 tracking-wider uppercase">Destino del Viaje</p>
                    <p className="text-xs lg:text-sm font-bold text-slate-900 leading-tight">{res.destination}</p>
                  </div>
                </div>
              </div>

              {/* Assigned Driver */}
              {res.driverName && (
                <div className="p-3.5 lg:p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center border border-purple-200">
                          {res.driverInitials}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs lg:text-sm font-bold text-slate-900 leading-none">{res.driverName}</p>
                          <span className="text-[10px] lg:text-[11px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-md">Confirmado ✓</span>
                        </div>
                        <p className="text-[11px] lg:text-xs text-slate-500 mt-1 font-medium">{res.driverVehicle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-amber-500 text-xs lg:text-sm font-extrabold gap-0.5">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        <span>{res.driverRating}</span>
                      </div>
                      <span className="text-[10px] lg:text-[11px] text-slate-400">Chofer VIP</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs lg:text-sm">
                    <div>
                      <span className="text-slate-400 font-medium">Tarifa fijada: </span>
                      <span className="font-extrabold text-slate-900 lg:text-base">${res.priceUsd.toFixed(2)} USD</span>
                    </div>
                    <span className="text-[11px] lg:text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                      {res.paymentMethods.join(" o ")}
                    </span>
                  </div>
                </div>
              )}

              {/* Pending status */}
              {res.status === "pending" && res.driversNotified && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <p className="text-xs lg:text-sm font-semibold text-slate-600">
                      <span className="font-bold text-purple-700">{res.driversNotified} Choferes</span> notificados
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] lg:text-[11px] text-slate-400 block font-medium">Estimada</span>
                    <span className="text-sm lg:text-base font-extrabold text-slate-900">${res.priceUsd.toFixed(2)} USD</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {res.status === "confirmed" ? (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button className="py-2.5 px-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs lg:text-sm font-bold border border-emerald-200/80 flex items-center justify-center gap-1 active:scale-95 transition-transform hover:bg-emerald-100">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                    </svg>
                    <span className="truncate">WhatsApp</span>
                  </button>
                  <button className="py-2.5 px-2 rounded-xl bg-slate-100 text-slate-700 text-xs lg:text-sm font-bold border border-slate-200 flex items-center justify-center gap-1 active:scale-95 transition-transform hover:bg-slate-200">
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">Modificar</span>
                  </button>
                  <button onClick={() => { void onCancel?.(res.id); }} className="py-2.5 px-2 rounded-xl bg-red-50 text-red-600 text-xs lg:text-sm font-bold border border-red-100 flex items-center justify-center gap-1 active:scale-95 transition-transform hover:bg-red-100">
                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="truncate">Cancelar</span>
                  </button>
                </div>
              ) : (
                <div className="mt-3.5 flex justify-end">
                  <button className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs lg:text-sm font-bold shadow-md hover:bg-slate-800 active:scale-98 transition-transform flex items-center justify-center gap-1.5">
                    <span>Gestionar Postulaciones</span>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>

        {reservations.length === 0 && (
          <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-[40px] text-slate-300">event</span>
            <p className="text-sm font-semibold text-slate-500 mt-2">No tienes reservas programadas</p>
            <p className="text-xs text-slate-400 mt-1">Programa una carrera con fecha y hora.</p>
          </div>
        )}

        {/* Info Card */}
        <section className="rounded-3xl p-4 lg:p-5 bg-[#f4f6f8] border border-white/80 relative" style={{ boxShadow: "6px 6px 14px rgba(166, 180, 200, 0.25), -6px -6px 14px rgba(255, 255, 255, 0.9)" }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-xs lg:text-sm font-bold text-slate-900">¿Cómo funcionan las reservas en Drivip?</h3>
              <p className="text-[11px] lg:text-xs text-slate-600 leading-relaxed">
                Tu chofer bloquea su agenda exclusivamente para ti. Sin sobreprecio por horario nocturno ni comisiones sorpresas: pago 100% acordado de mutuo acuerdo.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Floating CTA */}
      <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl lg:max-w-5xl px-4 pointer-events-none z-30">
        <button onClick={() => setShowForm(true)} className="w-full py-4 lg:py-5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-orange-500 text-white font-bold text-sm lg:text-base shadow-xl shadow-purple-600/30 flex items-center justify-between active:scale-98 transition-transform pointer-events-auto border border-white/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="tracking-tight text-white lg:text-lg">Programar Nueva Carrera</span>
          </div>
          <div className="flex items-center gap-1 text-xs lg:text-sm bg-white/20 py-1 px-2.5 rounded-lg backdrop-blur-sm">
            <span>Fecha y Hora</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-3xl p-5 w-full max-w-md space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Programar reserva</h3>
              <button type="button" onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500">✕</button>
            </div>
            <input
              value={form.origen}
              onChange={(e) => setForm({ ...form, origen: e.target.value })}
              placeholder="Origen"
              required
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
            />
            <input
              value={form.destino}
              onChange={(e) => setForm({ ...form, destino: e.target.value })}
              placeholder="Destino"
              required
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
            />
            <input
              type="datetime-local"
              value={form.fecha_hora}
              onChange={(e) => setForm({ ...form, fecha_hora: e.target.value })}
              required
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
            />
            <input
              value={form.notas ?? ""}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              placeholder="Notas para el chofer (opcional)"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm"
            />
            {formError && <p className="text-xs text-red-600">{formError}</p>}
            <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white text-sm font-bold disabled:opacity-60">
              {saving ? "Guardando..." : "Confirmar reserva"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
