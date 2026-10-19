import { supabase, APP_URLS, type ClienteConRed } from "@drivip/supabase";

interface ClienteDetailPanelProps {
  cliente: ClienteConRed;
  onBack: () => void;
  onRemoved: () => void;
}

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

export default function ClienteDetailPanel({ cliente, onBack, onRemoved }: ClienteDetailPanelProps) {
  const showToast = (msg: string) => {
    const el = document.createElement("div");
    el.className = "fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white text-[12px] font-medium px-4 py-2.5 rounded-xl shadow-xl";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  };

  const handleRemoveConductor = async (redId: string) => {
    const { error } = await supabase.from("red_cliente").delete().eq("id", redId);
    if (!error) {
      showToast("Conductor eliminado de la red");
      onRemoved();
    }
  };

  return (
    <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition">
          <span className="material-symbols-outlined text-[18px] text-slate-600">arrow_back</span>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base lg:text-lg font-black text-slate-900 truncate">{cliente.nombre}</h2>
          <p className="text-[10px] text-slate-500 font-mono">{cliente.email || cliente.telefono || "Sin contacto"}</p>
        </div>
      </div>

      {/* Info Personal */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Datos Personales</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-slate-500 font-medium">Nombre</span>
            <p className="text-[13px] font-bold text-slate-900">{cliente.nombre}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium">Telefono</span>
            <p className="text-[13px] font-bold text-slate-900">{cliente.telefono || "-"}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium">Email</span>
            <p className="text-[13px] font-bold text-slate-900">{cliente.email || "-"}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium">Direccion</span>
            <p className="text-[13px] font-bold text-slate-900 truncate">{cliente.direccion || "-"}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium">Tenant</span>
            <p className="text-[13px] font-bold text-blue-600">{cliente.tenant_nombre || "-"}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium">Registro</span>
            <p className="text-[13px] font-bold text-slate-900">{new Date(cliente.created_at).toLocaleDateString("es-VE")}</p>
          </div>
        </div>
      </div>

      {/* Estadisticas */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Estadisticas</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <span className="text-[24px] font-black text-slate-900 block">{cliente.total_carreras || 0}</span>
            <span className="text-[10px] text-slate-500">Carreras Totales</span>
          </div>
          <div className="text-center">
            <span className="text-[24px] font-black text-emerald-600 block">{cliente.red_conductores.length}</span>
            <span className="text-[10px] text-slate-500">Conductores en Red</span>
          </div>
        </div>
      </div>

      {/* Red de Conductores */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Red de Conductores</h3>
        <p className="text-[10px] text-slate-500">Conductores que este cliente tiene en su circulo</p>

        {cliente.red_conductores.length === 0 ? (
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-[24px] text-slate-300">group_off</span>
            </div>
            <p className="text-[12px] text-slate-400">Sin conductores en su red</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cliente.red_conductores.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-white">{(r.conductor_nombre || "?").charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-slate-900 truncate">{r.conductor_nombre || "Desconocido"}</span>
                      {r.favorito && (
                        <span className="material-symbols-outlined text-[12px] text-amber-500">star</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      {r.apodo && <span className="font-medium">"{r.apodo}"</span>}
                      <span>·</span>
                      <span className="font-mono truncate">{r.conductor_slug ? `${r.conductor_slug} · ` : ""}{APP_URLS.conductor}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${r.notificaciones_activas ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                        {r.notificaciones_activas ? "Notif. activas" : "Notif. off"}
                      </span>
                      <span className="text-[9px] text-slate-400">Agregado {new Date(r.agregado_at).toLocaleDateString("es-VE")}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveConductor(r.id)}
                  className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 active:scale-95 transition"
                >
                  <span className="material-symbols-outlined text-[14px] text-red-500">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
