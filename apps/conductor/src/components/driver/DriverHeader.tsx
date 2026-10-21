interface DriverHeaderProps {
  onMenuClick: () => void;
  onProfileClick: () => void;
  domain: string;
  isOnline: boolean;
  profileInitial: string;
}

export default function DriverHeader({
  onMenuClick,
  onProfileClick,
  domain,
  isOnline,
  profileInitial,
}: DriverHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/60 bg-[#f1f4f8]/90 px-4 pb-3 pt-3 backdrop-blur-md lg:px-8"
      data-purpose="driver-header"
    >
      <button
        aria-label="Abrir menú"
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-700 transition-transform active:scale-95"
        style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
        onClick={onMenuClick}
      >
        <svg className="h-6 w-6 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="flex min-w-0 flex-col items-center px-2">
        <span className="text-sm font-black tracking-tight text-slate-900 lg:text-base">Drivip</span>
        <span className="max-w-[140px] truncate text-[10px] font-bold text-slate-500 lg:text-[11px]">
          {domain}
        </span>
      </div>

      <button
        aria-label="Abrir perfil"
        className="group relative transition-transform active:scale-95"
        onClick={onProfileClick}
      >
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-white bg-purple-100"
          style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
        >
          <span className="text-sm font-bold text-purple-700">{profileInitial}</span>
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
            isOnline ? "bg-emerald-500" : "bg-red-400"
          }`}
        />
      </button>
    </header>
  );
}
