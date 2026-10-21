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

const FORM_INICIAL = {
  tenant_id: "",
  titulo: "",
  descripcion: "",
  imagen_url: "",
  enlace_url: "",
  cta_texto: "",
  prioridad: "normal" as BannerPrioridad,
  orden: 0,
};

export default function BannerManager({ tenants = [] }: { tenants?: Tenant[] }) {
  const { banners, loading, crearBanner, actualizarBanner, toggleBanner, eliminarBanner } = useAllBanners();
  const [toast, setToast] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const tenantName = (id: string) => tenants.find((t) => t.id === id)?.nombre ?? id.slice(0, 8);

  const activosDelTenant = banners.filter(
    (banner) => banner.tenant_id === form.tenant_id && banner.activo && banner.id !== editingId
  ).length;

  const resetForm = () => {
    setForm(FORM_INICIAL);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (banner: TenantBanner) => {
    setForm({
      tenant_id: banner.tenant_id,
      titulo: banner.titulo,
      descripcion: banner.descripcion ?? "",
      imagen_url: banner.imagen_url ?? "",
      enlace_url: banner.enlace_url ?? "",
      cta_texto: banner.cta_texto ?? "",
      prioridad: banner.prioridad,
      orden: banner.orden ?? 0,
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenant_id || !form.titulo.trim()) return;

    if (activosDelTenant >= 4) {
      showToast("Este conductor ya tiene 4 banners activos. Desactiva uno para agregar otro.");
      return;
    }

    setSaving(true);
    const payload = {
      tenant_id: form.tenant_id,
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      imagen_url: form.imagen_url.trim() || null,
      enlace_url: form.enlace_url.trim() || null,
      cta_texto: form.cta_texto.trim() || null,
      activo: true,
      prioridad: form.prioridad,
      orden: Number(form.orden) || 0,
    };

    const ok = editingId
      ? await actualizarBanner(editingId, payload)
      : await crearBanner(payload);

    setSaving(false);
    if (ok) {
      showToast(editingId ? "Banner actualizado" : "Banner creado");
      resetForm();
    } else {
      showToast(editingId ? "No se pudo actualizar el banner" : "No se pudo crear el banner");
    }
  };

  const handleToggle = async (banner: TenantBanner) => {
    if (!banner.activo) {
      const activos = banners.filter(
        (item) => item.tenant_id === banner.tenant_id && item.activo && item.id !== banner.id
      ).length;
      if (activos >= 4) {
        showToast("Este conductor ya tiene 4 banners activos. Desactiva uno para mostrar otro.");
        return;
      }
    }
    const ok = await toggleBanner(banner.id, !banner.activo);
    if (ok) showToast(`${banner.titulo} ${banner.activo ? "ocultado" : "visible"}`);
  };

  const handleDelete = async (b: TenantBanner) => {
    const ok = await eliminarBanner(b.id);
    if (ok) showToast("Banner eliminado");
  };

  return (
    <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base lg:text-lg font-black text-slate-900">Gestion de Banners</h2>
          <p className="text-[10px] text-slate-500">Máximo 4 banners activos por conductor.</p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setForm(FORM_INICIAL);
              setEditingId(null);
              setShowForm(true);
            }
          }}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold active:scale-95 transition shadow-md"
        >
          {showForm ? "Cancelar" : "+ Nuevo Banner"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 space-y-3 border border-slate-100">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-black text-slate-900">
              {editingId ? "Editar banner" : "Nuevo banner"}
            </p>
            {form.imagen_url.trim() && (
              <img
                src={form.imagen_url}
                alt=""
                className="h-10 w-16 rounded-lg object-cover border border-slate-200"
              />
            )}
          </div>

          <select
            value={form.tenant_id}
            disabled={Boolean(editingId)}
            onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[12px] disabled:opacity-60"
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
          <input
            value={form.imagen_url}
            onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
            placeholder="URL de imagen (opcional)"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[12px]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.cta_texto}
              onChange={(e) => setForm({ ...form, cta_texto: e.target.value })}
              placeholder="Texto del botón"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[12px]"
            />
            <input
              value={form.enlace_url}
              onChange={(e) => setForm({ ...form, enlace_url: e.target.value })}
              placeholder="Enlace del botón (URL)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[12px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.prioridad}
              onChange={(e) => setForm({ ...form, prioridad: e.target.value as BannerPrioridad })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[12px]"
            >
              <option value="alta">Prioridad alta</option>
              <option value="normal">Prioridad normal</option>
              <option value="baja">Prioridad baja</option>
            </select>
            <input
              type="number"
              value={form.orden}
              onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
              placeholder="Orden"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[12px]"
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Orden menor aparece primero. Los banners activos se muestran en el panel del conductor.
          </p>
          <button type="submit" disabled={saving} className="w-full py-2 rounded-xl bg-emerald-600 text-white text-[12px] font-bold disabled:opacity-60">
            {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar Banner"}
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
            <div className="flex items-center gap-3">
              {b.imagen_url ? (
                <img src={b.imagen_url} alt="" className="h-12 w-16 rounded-xl object-cover border border-slate-200" />
              ) : (
                <div className="h-12 w-16 rounded-xl bg-gradient-to-br from-purple-700 to-indigo-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px] text-white">campaign</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[13px] lg:text-[14px] font-bold text-slate-900 block truncate">{b.titulo}</span>
                <span className="text-[10px] text-slate-500 block truncate">
                  {tenantName(b.tenant_id)} · Orden {b.orden ?? 0} · {b.prioridad}
                </span>
              </div>
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
              <span className="font-mono text-[10px] lg:text-[11px] text-slate-500 truncate max-w-[55%]">
                {b.cta_texto || "Sin botón"}{b.enlace_url ? ` · ${b.enlace_url}` : ""}
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => handleEdit(b)} className="text-[10px] font-bold text-purple-600 active:scale-95">
                  Editar
                </button>
                <button onClick={() => handleDelete(b)} className="text-[10px] font-bold text-red-600 active:scale-95">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
