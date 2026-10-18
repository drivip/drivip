import { useState } from "react";
import { MOCK_BANNERS } from "../mockData/adminMockData";

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

export default function BannerManager() {
  const [banners, setBanners] = useState(MOCK_BANNERS);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="flex items-center justify-between">
        <h2 className="text-base lg:text-lg font-black text-slate-900">Gestion de Banners</h2>
        <button
          onClick={() => showToast("Abriendo editor de banner...")}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold active:scale-95 transition shadow-md"
        >
          + Nuevo Banner
        </button>
      </div>
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
                  onClick={() => {
                    setBanners(prev => prev.map(x => x.id === b.id ? { ...x, activo: !x.activo } : x));
                    showToast(`${b.titulo} ${b.activo ? "ocultado" : "visible"}`);
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors ${b.activo ? "bg-emerald-500" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${b.activo ? "translate-x-5" : ""}`} />
                </button>
              </div>
            </div>
            <p className="text-[11px] lg:text-[12px] text-slate-500">{b.descripcion}</p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] lg:text-[11px] text-slate-500">Prioridad: {b.prioridad}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showToast(`Editando ${b.titulo}...`)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-[10px] font-bold active:scale-95 transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    setBanners(prev => prev.filter(x => x.id !== b.id));
                    showToast(`${b.titulo} eliminado`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-100 text-red-600 text-[10px] font-bold active:scale-95 transition"
                >
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
