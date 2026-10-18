interface AdminHeaderProps {
  onMenuClick: () => void;
  onNotificationsClick: () => void;
  onLogout: () => void;
  pendingCount: number;
}

export default function AdminHeader({
  onMenuClick,
  onNotificationsClick,
  onLogout,
  pendingCount,
}: AdminHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 bg-[#f4f6f8]/90 backdrop-blur-md px-5 lg:px-8 pt-3 pb-3 flex items-center justify-between border-b border-slate-200/60"
      data-purpose="admin-header"
    >
      <button
        aria-label="Abrir Menu"
        className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-white flex items-center justify-center text-slate-700 active:scale-95 transition-transform border border-slate-100"
        style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
        onClick={onMenuClick}
      >
        <svg className="w-6 h-6 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="flex flex-col items-center">
        <span className="text-sm lg:text-base font-black text-slate-900 tracking-tight">Drivip</span>
        <span className="text-[10px] lg:text-[11px] font-bold text-slate-500">Panel Admin</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label="Notificaciones"
          className="relative w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-white flex items-center justify-center text-slate-700 active:scale-95 transition-transform border border-slate-100"
          style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
          onClick={onNotificationsClick}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          aria-label="Cerrar sesion"
          className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-white flex items-center justify-center text-slate-700 active:scale-95 transition-transform border border-slate-100"
          style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
          onClick={onLogout}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}
