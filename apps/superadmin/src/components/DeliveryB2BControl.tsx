import { useState } from "react";
import { MOCK_ORDERS_B2B } from "../mockData/adminMockData";

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
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="flex items-center justify-between">
        <h2 className="text-base lg:text-lg font-black text-slate-900">Control B2B Delivery</h2>
        <button
          onClick={() => showToast("Creando nueva orden B2B...")}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[10px] font-bold active:scale-95 transition shadow-md"
        >
          + Nueva Orden
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-rose-600">local_shipping</span>
            </div>
          </div>
          <span className="text-[20px] lg:text-[24px] font-black text-slate-900 block leading-tight">2</span>
          <span className="text-[10px] text-slate-500 font-medium">Activas</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
            </div>
          </div>
          <span className="text-[20px] lg:text-[24px] font-black text-slate-900 block leading-tight">7</span>
          <span className="text-[10px] text-slate-500 font-medium">Hoy</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-blue-600">business</span>
            </div>
          </div>
          <span className="text-[20px] lg:text-[24px] font-black text-slate-900 block leading-tight">5</span>
          <span className="text-[10px] text-slate-500 font-medium">Empresas</span>
        </div>
      </div>
      <div className="space-y-2">
        {MOCK_ORDERS_B2B.map((o) => (
          <div key={o.id} className="bg-white rounded-2xl p-4 space-y-2 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] lg:text-[12px] text-slate-900 font-bold">{o.id}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                o.estado === "completada" ? "bg-emerald-100 text-emerald-700" :
                o.estado === "en_curso" ? "bg-amber-100 text-amber-700" :
                "bg-slate-100 text-slate-600"
              }`}>{o.estado}</span>
            </div>
            <div className="text-[12px] lg:text-[13px] text-slate-900 font-medium">{o.empresa}</div>
            <div className="text-[11px] lg:text-[12px] text-slate-500">{o.destino}</div>
            {o.conductor && <div className="text-[11px] lg:text-[12px] text-blue-600 font-medium">Conductor: {o.conductor}</div>}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => showToast(`Viendo detalles de ${o.id}...`)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-[10px] font-bold active:scale-95 transition"
              >
                Detalle
              </button>
              {o.estado === "pendiente" && (
                <button
                  onClick={() => showToast(`${o.id} asignada a conductor`)}
                  className="px-3 py-1.5 rounded-xl bg-blue-500 text-white text-[10px] font-bold active:scale-95 transition"
                >
                  Asignar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
