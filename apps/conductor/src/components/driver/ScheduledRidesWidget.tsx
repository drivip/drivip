interface ScheduledRide {
  id: string;
  cliente: string;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  precio: number;
  estado: string;
}

interface ScheduledRidesWidgetProps {
  rides: ScheduledRide[];
}

export default function ScheduledRidesWidget({ rides }: ScheduledRidesWidgetProps) {
  return (
    <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm lg:text-base font-black text-slate-900">Viajes Programados</h3>
        {rides.length > 0 && (
          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[11px] lg:text-xs font-bold">
            {rides.length} próximos
          </span>
        )}
      </div>

      {rides.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2">
          <span className="material-symbols-outlined text-[40px] text-slate-300">event_busy</span>
          <p className="text-xs lg:text-sm text-slate-400 font-medium">Aún no tienes nada programado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rides.map((ride) => (
            <div
              key={ride.id}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs lg:text-sm font-bold text-slate-900 truncate">{ride.cliente}</p>
                  <p className="text-[10px] lg:text-[11px] text-slate-500 truncate">{ride.origen} → {ride.destino}</p>
                  <p className="text-[10px] lg:text-[11px] text-purple-600 font-bold">{ride.fecha} • {ride.hora}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm lg:text-base font-black text-slate-900">${ride.precio.toFixed(2)}</p>
                <span className={`text-[10px] lg:text-[11px] font-bold px-2 py-0.5 rounded-full ${ride.estado === 'confirmada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {ride.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
