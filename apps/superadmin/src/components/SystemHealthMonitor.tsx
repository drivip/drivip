import { MOCK_SERVICES } from "../mockData/adminMockData";

const estadoColors: Record<string, { bg: string; text: string; label: string }> = {
  operational: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Operational" },
  degraded: { bg: "bg-amber-100", text: "text-amber-700", label: "Degraded" },
  outage: { bg: "bg-red-100", text: "text-red-700", label: "Outage" },
};

export default function SystemHealthMonitor() {
  return (
    <div className="bg-white rounded-2xl p-4 space-y-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
      <h3 className="text-[14px] lg:text-[16px] font-black text-slate-900">Salud del Sistema</h3>
      <div className="space-y-2">
        {MOCK_SERVICES.map((s) => {
          const colors = estadoColors[s.estado] ?? estadoColors.operational;
          return (
            <div key={s.nombre} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-2.5">
                <span className="text-[12px] lg:text-[13px] text-slate-900 font-medium">{s.nombre}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] lg:text-[10px] font-bold ${colors.bg} ${colors.text}`}>{colors.label}</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                <span>{s.latencia}</span>
                <span>{s.uptime}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
