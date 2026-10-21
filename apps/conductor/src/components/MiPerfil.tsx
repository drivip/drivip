import type { Tenant } from "@drivip/types";
import { MOCK_DRIVER_PROFILE } from "../mockData/driverMockData";

interface MiPerfilProps {
  tenant?: Tenant | null;
  demo?: boolean;
  embedded?: boolean;
}

export default function MiPerfil({ tenant, demo = false, embedded = false }: MiPerfilProps) {
  const p = demo ? MOCK_DRIVER_PROFILE : null;

  const nombre = tenant?.nombre || p?.nombre || "Conductor";
  const cedula = tenant?.cedula || p?.cedula || null;
  const telefono = tenant?.telefono || p?.telefono || null;
  const email = tenant?.email || p?.email || null;
  const plan = tenant?.plan || p?.plan || "estandar";
  const calificacion = tenant?.calificacion ?? p?.calificacion ?? null;
  const totalResenas = tenant?.total_carreras ?? p?.totalResenas ?? 0;
  const vehiculoTipo = tenant?.vehiculo_tipo || p?.vehiculo.tipo || null;
  const vehiculoPlaca = tenant?.vehiculo_placa || p?.vehiculo.placa || null;
  const vehiculoModelo = tenant?.vehiculo_modelo || p?.vehiculo.modelo || null;
  const vehiculoColor = tenant?.vehiculo_color || p?.vehiculo.color || null;
  const ciudad = tenant?.ciudad || null;
  const direccion = tenant?.direccion || null;

  return (
    <div className={embedded ? "space-y-4" : "px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full"}>
      {!embedded && <h1 className="text-xl lg:text-2xl font-black text-slate-900">Mi Perfil</h1>}

      <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <span className="text-3xl lg:text-4xl font-black text-white">{nombre.split(" ").map(n => n[0]).join("")}</span>
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-3 border-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[12px] text-white">check</span>
          </span>
        </div>
        <div className="text-center">
          <h2 className="text-lg lg:text-xl font-black text-slate-900">{nombre}</h2>
          <p className="text-[11px] lg:text-xs text-slate-500">{cedula || "Sin cédula registrada"}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-lg lg:text-xl font-black text-slate-900">{calificacion != null ? calificacion.toFixed(1) : "-"}</p>
            <p className="text-[10px] lg:text-[11px] text-slate-500">Rating</p>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <p className="text-lg lg:text-xl font-black text-slate-900">{totalResenas}</p>
            <p className="text-[10px] lg:text-[11px] text-slate-500">Carreras</p>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] lg:text-xs font-bold uppercase">{plan}</span>
            <p className="text-[10px] lg:text-[11px] text-slate-500 mt-0.5">Plan</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-1">
        {[
          { icon: "badge", label: "Cédula", value: cedula },
          { icon: "phone", label: "Telefono", value: telefono },
          { icon: "mail", label: "Email", value: email },
          { icon: "location_city", label: "Ciudad", value: ciudad },
          { icon: "home", label: "Direccion", value: direccion },
          { icon: "directions_car", label: "Vehiculo", value: [vehiculoColor, vehiculoModelo].filter(Boolean).join(" ") || null },
          { icon: "pin", label: "Placa", value: vehiculoPlaca },
          { icon: "category", label: "Tipo", value: vehiculoTipo },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between py-3 px-2 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-slate-400">{item.icon}</span>
              <span className="text-xs lg:text-sm text-slate-500">{item.label}</span>
            </div>
            <span className="text-xs lg:text-sm font-bold text-slate-900 capitalize">{item.value || "-"}</span>
          </div>
        ))}
      </div>

      <button className="w-full py-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm lg:text-base active:scale-[0.98] transition flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-[18px]">edit</span>
        Editar Perfil
      </button>
    </div>
  );
}
