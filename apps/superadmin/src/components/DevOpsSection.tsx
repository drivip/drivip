export default function DevOpsSection() {
  return (
    <div className="bg-white rounded-2xl p-4 space-y-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
      <h3 className="text-[14px] lg:text-[16px] font-black text-slate-900">DevOps</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <span className="text-[10px] text-slate-500 font-medium block">Deploy Ultimo</span>
          <span className="text-[18px] font-black text-slate-900">Hace 2h</span>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <span className="text-[10px] text-slate-500 font-medium block">Builds Activos</span>
          <span className="text-[18px] font-black text-slate-900">3</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="px-3 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-[11px] font-bold active:scale-95 transition shadow-md">
          Deploy Manual
        </button>
        <button className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold active:scale-95 transition">
          Ver Logs
        </button>
        <button className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold active:scale-95 transition">
          Rollback
        </button>
      </div>
      <div className="bg-slate-900 rounded-xl p-3 font-mono text-[11px] text-emerald-400 space-y-1">
        <div>[09:42:15] Build #247 completado en 34s</div>
        <div>[09:42:18] Deploy a produccion iniciado</div>
        <div>[09:42:52] Deploy completado exitosamente</div>
        <div>[09:43:01] Health check: todos los servicios OK</div>
      </div>
    </div>
  );
}
