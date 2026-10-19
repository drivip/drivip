import { useState } from "react";
import type { AliadoTipo } from "@drivip/types";
import { useAliados } from "@drivip/supabase";

const TIPOS: { value: AliadoTipo; label: string }[] = [
  { value: "tienda", label: "Tienda" },
  { value: "restaurante", label: "Restaurante" },
  { value: "hotel", label: "Hotel" },
  { value: "oficina", label: "Oficina" },
  { value: "otro", label: "Otro" },
];

export default function MisAliados({ tenantId }: { tenantId?: string | null }) {
  const { aliados, loading, addAliado } = useAliados(tenantId);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", tipo: "tienda" as AliadoTipo, direccion: "", telefono: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    setSaving(true);
    setError(null);
    const { error: addError } = await addAliado(form);
    setSaving(false);
    if (addError) {
      setError(addError);
      return;
    }
    setForm({ nombre: "", tipo: "tienda", direccion: "", telefono: "" });
    setShowForm(false);
  };

  return (
    <div className="px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-black text-slate-900">Mis Aliados</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs lg:text-sm font-bold active:scale-95 shadow-md"
        >
          {showForm ? "Cancelar" : "Invitar Aliado"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-3">
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Nombre del aliado"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as AliadoTipo })}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            placeholder="Dirección (opcional)"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
          <input
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="Teléfono (opcional)"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold active:scale-95 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar Aliado"}
          </button>
        </form>
      )}

      {loading && <p className="text-center text-xs text-slate-400 py-6">Cargando aliados...</p>}

      {!loading && aliados.length === 0 && (
        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[56px] text-slate-200">group_add</span>
          <p className="text-sm lg:text-base text-slate-400 font-medium">Aún no tienes aliados registrados</p>
        </div>
      )}

      <div className="space-y-3">
        {aliados.map((ally) => (
          <div key={ally.id} className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="material-symbols-outlined text-[20px]">storefront</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm lg:text-base font-bold text-slate-900 truncate">{ally.nombre}</p>
              <p className="text-[11px] lg:text-xs text-slate-500 truncate">
                {ally.direccion ?? "Sin dirección"} · {TIPOS.find((t) => t.value === ally.tipo)?.label ?? ally.tipo}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm lg:text-base font-black text-slate-900">{ally.carreras}</p>
              <p className="text-[10px] lg:text-[11px] text-slate-500">viajes</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
