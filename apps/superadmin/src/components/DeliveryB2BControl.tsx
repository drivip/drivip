import { useState } from "react";
import { usePedidosB2B } from "@drivip/supabase";

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white text-[12px] font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white/60 hover:text-white">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

export default function DeliveryB2BControl() {
  const { pedidos, loading, crearPedido, actualizarPedido } = usePedidosB2B();
  const [toast, setToast] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ empresa: "", destino: "", monto: "" });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const activas = pedidos.filter((p) => ["pendiente", "asignada", "en_curso"].includes(p.estado)).length;
  const hoy = new Date().toDateString();
  const completadasHoy = pedidos.filter(
    (p) => p.estado === "completada" && new Date(p.created_at).toDateString() === hoy
  ).length;
  const empresas = new Set(pedidos.map((p) => p.empresa)).size;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa.trim() || !form.destino.trim()) return;
    setSaving(true);
    const monto = Number(form.monto);
    const { error } = await crearPedido({
      empresa: form.empresa,
      destino: form.destino,
      monto: Number.isFinite(monto) && monto > 0 ? monto : undefined,
    });
    setSaving(false);
    if (error) {
      showToast("No se pudo crear la orden");
      return;
    }
    setForm({ empresa: "", destino: "", monto: "" });
    setShowForm(false);
    showToast("Orden B2B creada");
  };

  const asignar = async (id: string) => {
    const { error } = await actualizarPedido(id, { estado: "asignada" });
    showToast(error ? "No se pudo asignar" : `${id.slice(0, 8)} asignada`);
  };

  const completar = async (id: string) => {
    const { error } = await actualizarPedido(id, { estado: "completada" });
    showToast(error ? "No se pudo completar" : "Orden completada");
  };

  return (
    <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="flex items-center justify-between">
        <h2 className="text-base lg:text-lg font-black text-slate-900">Control B2B Delivery</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[10px] font-bold active:scale-95 transition shadow-md"
        >
          {showForm ? "Cancelar" : "+ Nueva Orden"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-4 space-y-3 border border-slate-100">
          <input
            value={form.empresa}
            onChange={(e) => setForm({ ...form, empresa: e.target.value })}
            placeholder="Empresa"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[12px]"
          />
          <input
            value={form.destino}
            onChange={(e) => setForm({ ...form, destino: e.target.value })}
            placeholder="Destino"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[12px]"
          />
          <input
            value={form.monto}
            onChange={(e) => setForm({ ...form, monto: e.target.value })}
            placeholder="Monto USD (opcional)"
            inputMode="decimal"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[12px]"
          />
          <button type="submit" disabled={saving} className="w-full py-2 rounded-xl bg-emerald-600 text-white text-[12px] font-bold disabled:opacity-60">
            {saving ? "Guardando..." : "Crear Orden"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-rose-600">local_shipping</span>
            </div>
          </div>
          <span className="text-[20px] lg:text-[24px] font-black text-slate-900 block leading-tight">{activas}</span>
          <span className="text-[10px] text-slate-500 font-medium">Activas</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
            </div>
          </div>
          <span className="text-[20px] lg:text-[24px] font-black text-slate-900 block leading-tight">{completadasHoy}</span>
          <span className="text-[10px] text-slate-500 font-medium">Hoy</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-blue-600">business</span>
            </div>
          </div>
          <span className="text-[20px] lg:text-[24px] font-black text-slate-900 block leading-tight">{empresas}</span>
          <span className="text-[10px] text-slate-500 font-medium">Empresas</span>
        </div>
      </div>

      {loading && <p className="text-center text-[12px] text-slate-400 py-6">Cargando órdenes...</p>}

      {!loading && pedidos.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
          <span className="material-symbols-outlined text-[40px] text-slate-300">local_shipping</span>
          <p className="text-[12px] text-slate-500 mt-2">No hay órdenes B2B registradas</p>
        </div>
      )}

      <div className="space-y-2">
        {pedidos.map((o) => (
          <div key={o.id} className="bg-white rounded-2xl p-4 space-y-2 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] lg:text-[12px] text-slate-900 font-bold">{o.id.slice(0, 8)}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                o.estado === "completada" ? "bg-emerald-100 text-emerald-700" :
                o.estado === "en_curso" || o.estado === "asignada" ? "bg-amber-100 text-amber-700" :
                "bg-slate-100 text-slate-600"
              }`}>{o.estado}</span>
            </div>
            <div className="text-[12px] lg:text-[13px] text-slate-900 font-medium">{o.empresa}</div>
            <div className="text-[11px] lg:text-[12px] text-slate-500">{o.destino}{o.monto != null ? ` · $${Number(o.monto).toFixed(2)}` : ""}</div>
            {o.conductor && <div className="text-[11px] lg:text-[12px] text-blue-600 font-medium">Conductor: {o.conductor}</div>}
            <div className="flex items-center gap-2 pt-1">
              {o.estado === "pendiente" && (
                <button onClick={() => asignar(o.id)} className="px-3 py-1.5 rounded-xl bg-blue-500 text-white text-[10px] font-bold active:scale-95 transition">
                  Asignar
                </button>
              )}
              {o.estado === "asignada" && (
                <button onClick={() => completar(o.id)} className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[10px] font-bold active:scale-95 transition">
                  Completar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
