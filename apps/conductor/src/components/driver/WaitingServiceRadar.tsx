export default function WaitingServiceRadar() {
  return (
    <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center justify-center gap-4">
      <div className="relative w-28 h-28 lg:w-32 lg:h-32 flex items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-purple-200 animate-ping opacity-30" />
        <span className="absolute inset-2 rounded-full border-2 border-purple-300 animate-ping opacity-20" style={{ animationDelay: "0.5s" }} />
        <span className="absolute inset-4 rounded-full border-2 border-purple-400 animate-ping opacity-15" style={{ animationDelay: "1s" }} />
        <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <svg className="w-7 h-7 lg:w-8 lg:h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm lg:text-base font-bold text-slate-900">Esperando servicios en tu zona...</p>
        <p className="text-[11px] lg:text-xs text-slate-500">Te notificaremos cuando haya una solicitud</p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-200">
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
        <span className="text-[11px] lg:text-xs font-bold text-purple-700">Radar Activo</span>
      </div>
    </div>
  );
}
