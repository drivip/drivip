export default function Cuadratura() {
  return (
    <div className="bg-surface-container rounded-xl p-4">
      <h3 className="text-[12px] font-mono text-on-surface-variant uppercase tracking-wider mb-3">Cuadratura</h3>
      <div className="space-y-2">
        <button className="w-full flex items-center justify-between py-3 px-4 rounded-xl hover:bg-surface-container-high transition-colors text-left">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-primary">calendar_today</span>
            <span className="text-[13px] text-on-surface">Ver cuentas diarias</span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
        </button>
        <button className="w-full flex items-center justify-between py-3 px-4 rounded-xl hover:bg-surface-container-high transition-colors text-left">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-primary">date_range</span>
            <span className="text-[13px] text-on-surface">Ver cuentas semanales</span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
