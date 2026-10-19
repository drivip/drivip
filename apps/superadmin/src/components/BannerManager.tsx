import { useState } from "react";
import type { BannerPrioridad, Tenant, TenantBanner } from "@drivip/types";
import { useAllBanners } from "@drivip/supabase";

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

export default function BannerManager({ tenants = [] }: { tenants?: Tenant[] }) {
  const { banners, loading, crearBanner, toggleBanner, eliminarBanner } = useAllBanners();
  const [toast, setToast] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tenant_id: "",
    titulo: "",
    descripcion: "",
    prioridad: "normal" as BannerPrioridad,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const tenantName = (id: string) => tenants.find((t) => t.id === id)?.nombre ?? id.slice(0, 8);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenant_id || !form.titulo.trim()) return;
    setSaving(true);
    const ok = await crearBanner({
      tenant_id: form.tenant_id,
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      imagen_url: null,
      activo: true,
      prioridad: form.prioridad,
    });
    setSaving(false);
    if (ok) {
      setForm({ tenant_id: "", titulo: "", descripcion: "", prioridad: "normal" });
      setShowForm(false);
      showToast("Banner creado");
    } else {
      showToast("No se pudo crear el banner");
    }
  };

  const handleToggle = async (b: TenantBanner) => {
    const ok = await toggleBanner(b.id, !b.activo);
    if (ok) showToast(`${b.titulo} ${b.activo ? "ocultado" : "visible"}`);
  };

  const handleDelete = async (b: TenantBanner) => {
    const ok = await eliminarBanner(b.id);
    if (ok) showToast("Banner eliminado");
  };

  return (
    <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="flex items-center justify-between">
        <h2 className="text-base lg:text-lg font-black text-slate-900">Gestion de Banners</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold active:scale-95 transition shadow-md"
        >
          {showForm ? "Cancelar" : "+ Nuevo Banner"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-4 space-y-3 border border-slate-100">
          <select
            value={form.tenant_id}
            onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[12px]"
          >
            <option value="">Selecciona un conductor</option>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
          <input
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Título"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[12px]"
          />
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Descripción (opcional)"
            rows={2}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[12px]"
          />
          <select
            value={form.prioridad}
            onChange={(e) => setForm({ ...form, prioridad: e.target.value as BannerPrioridad })}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[12px]"
          >
            <option value="alta">Alta</option>
            <option value="normal">Normal</option>
            <option value="baja">Baja</option>
          </select>
          <button type="submit" disabled={saving} className="w-full py-2 rounded-xl bg-emerald-600 text-white text-[12px] font-bold disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar Banner"}
          </button>
        </form>
      )}

      {loading && <p className="text-center text-[12px] text-slate-400 py-6">Cargando banners...</p>}

      {!loading && banners.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
          <p className="text-[12px] text-slate-500">No hay banners registrados</p>
        </div>
      )}

      <div className="space-y-2">
        {banners.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl p-4 space-y-2 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] lg:text-[14px] font-bold text-slate-900">{b.titulo}</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${b.activo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {b.activo ? "Visible" : "Oculto"}
                </span>
                <button
                  onClick={() => handleToggle(b)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${b.activo ? "bg-emerald-500" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${b.activo ? "translate-x-5" : ""}`} />
                </button>
              </div>
            </div>
            <p className="text-[11px] lg:text-[12px] text-slate-500">{b.descripcion ?? "Sin descripción"}</p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] lg:text-[11px] text-slate-500">
                {tenantName(b.tenant_id)} · Prioridad: {b.prioridad}
              </span>
              <button onClick={() => handleDelete(b)} className="text-[10px] font-bold text-red-600 active:scale-95">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
