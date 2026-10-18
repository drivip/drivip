import { useState } from "react";
import { ToggleSwitch, Badge } from "@drivip/ui";
import { MOCK_API_KEYS } from "../mockData/adminMockData";

export default function CredentialsManager() {
  const [apiKeys, setApiKeys] = useState(MOCK_API_KEYS);

  return (
    <div className="bg-white rounded-2xl p-4 space-y-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
      <h3 className="text-[14px] lg:text-[16px] font-black text-slate-900">Credenciales API</h3>
      <div className="space-y-3">
        {apiKeys.map((k) => (
          <div key={k.id} className="bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] lg:text-[13px] font-bold text-slate-900">{k.nombre}</span>
                <Badge variant={k.activo ? "active" : "offline"}>{k.activo ? "Activa" : "Inactiva"}</Badge>
              </div>
              <span className="font-mono text-[11px] text-slate-500">{k.key}</span>
              <div className="text-[10px] text-slate-500">Ultimo uso: {k.ultimoUso}</div>
            </div>
            <div className="flex items-center gap-2">
              <ToggleSwitch checked={k.activo} onChange={() => setApiKeys(prev => prev.map(x => x.id === k.id ? { ...x, activo: !x.activo } : x))} />
              <button className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-[10px] font-bold active:scale-95 transition">Rotar</button>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-[11px] font-bold active:scale-[0.98] transition shadow-md">
        + Generar Nueva Clave
      </button>
    </div>
  );
}
