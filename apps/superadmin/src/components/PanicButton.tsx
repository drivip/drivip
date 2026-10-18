import { useState } from "react";

export default function PanicButton() {
  const [triggered, setTriggered] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-4 space-y-4 border-2 border-red-200" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-red-600">warning</span>
        </div>
        <h3 className="text-[14px] lg:text-[16px] font-black text-slate-900">Boton de Panico</h3>
      </div>
      <p className="text-[12px] lg:text-[13px] text-slate-500">
        Activa el modo de emergencia: detiene todas las carreras activas y notifica a los conductores.
      </p>
      <button
        onClick={() => setTriggered(true)}
        disabled={triggered}
        className={`w-full py-3 rounded-xl font-bold text-[12px] lg:text-[13px] active:scale-[0.98] transition shadow-lg ${
          triggered
            ? "bg-slate-200 text-slate-500"
            : "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-600/30"
        }`}
      >
        {triggered ? "Emergencia Activada" : "Activar Boton de Panico"}
      </button>
      {triggered && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-[12px] text-red-600 font-medium">
          Emergencia activada. Todas las carreras han sido notificadas.
        </div>
      )}
    </div>
  );
}
