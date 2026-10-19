import { useState } from "react";
import { usePluginsCatalogo } from "@drivip/supabase";

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

export default function PluginCatalogGrid() {
  const { plugins, loading, togglePlugin, crearPlugin } = usePluginsCatalogo();
  const [toast, setToast] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: "", descripcion: "", icono: "extension" });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleToggle = async (id: string, nombre: string, activo: boolean) => {
    const { error } = await togglePlugin(id, !activo);
    showToast(error ? "No se pudo actualizar" : `${nombre} ${activo ? "desactivado" : "activado"}`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setSaving(true);
    const { error } = await crearPlugin({
      id: form.nombre,
      nombre: form.nombre,
      descripcion: form.descripcion,
      icono: form.icono,
    });
    setSaving(false);
    if (error) {
      showToast("No se pudo crear el plugin");
      return;
    }
    setForm({ nombre: "", descripcion: "", icono: "extension" });
    setShowForm(false);
    showToast("Plugin creado");
  };

  return (
    <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="flex items-center justify-between">
        <h2 className="text-base lg:text-lg font-black text-slate-900">Catalogo de Plugins</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-700 text-white text-[10px] font-bold active:scale-95 transition shadow-md"
        >
          {showForm ? "Cancelar" : "+ Nuevo Plugin"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-4 space-y-3 border border-slate-100">
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Nombre del plugin"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[12px]"
          />
          <input
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Descripción"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[12px]"
          />
          <input
            value={form.icono}
            onChange={(e) => setForm({ ...form, icono: e.target.value })}
            placeholder="Ícono (Material Symbols)"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[12px]"
          />
          <button type="submit" disabled={saving} className="w-full py-2 rounded-xl bg-emerald-600 text-white text-[12px] font-bold disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar Plugin"}
          </button>
        </form>
      )}

      {loading && <p className="text-center text-[12px] text-slate-400 py-6">Cargando catálogo...</p>}

      {!loading && plugins.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
          <p className="text-[12px] text-slate-500">No hay plugins en el catálogo</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {plugins.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl p-4 space-y-3 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[20px] text-white">{p.icono}</span>
                </div>
                <div>
                  <span className="text-[13px] lg:text-[14px] font-bold text-slate-900">{p.nombre}</span>
                  <p className="text-[11px] lg:text-[12px] text-slate-500">{p.descripcion ?? "Sin descripción"}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(p.id, p.nombre, p.activo)}
                className={`relative w-11 h-6 rounded-full transition-colors ${p.activo ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${p.activo ? "translate-x-5" : ""}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] lg:text-[11px] text-slate-500">{p.tenantCount} tenants</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${p.activo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {p.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
