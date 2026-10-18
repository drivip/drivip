import { useState } from "react";
import { MOCK_PLUGINS_ADMIN } from "../mockData/adminMockData";

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
  const [plugins, setPlugins] = useState(MOCK_PLUGINS_ADMIN);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const togglePlugin = (id: string, nombre: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p))
    );
    const plugin = plugins.find((p) => p.id === id);
    showToast(`${nombre} ${plugin?.activo ? "desactivado" : "activado"}`);
  };

  return (
    <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="flex items-center justify-between">
        <h2 className="text-base lg:text-lg font-black text-slate-900">Catalogo de Plugins</h2>
        <button
          onClick={() => showToast("Abriendo catalogo de plugins...")}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-700 text-white text-[10px] font-bold active:scale-95 transition shadow-md"
        >
          + Nuevo Plugin
        </button>
      </div>
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
                  <p className="text-[11px] lg:text-[12px] text-slate-500">{p.descripcion}</p>
                </div>
              </div>
              <button
                onClick={() => togglePlugin(p.id, p.nombre)}
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
