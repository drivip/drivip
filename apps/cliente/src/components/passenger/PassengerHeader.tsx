interface PassengerHeaderProps {
  onMenuClick: () => void;
  onProfileClick: () => void;
  profileImage?: string;
  profileInitial?: string;
}

export default function PassengerHeader({
  onMenuClick,
  onProfileClick,
  profileImage,
  profileInitial = "U",
}: PassengerHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 bg-[#f4f6f8]/90 backdrop-blur-md px-5 lg:px-8 pt-3 pb-3 flex items-center justify-between border-b border-slate-200/60"
      data-purpose="passenger-header"
    >
      {/* Botón de Menú Neumórfico */}
      <button
        aria-label="Abrir Menú"
        className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-white flex items-center justify-center text-slate-700 active:scale-95 transition-transform border border-slate-100"
        style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
        onClick={onMenuClick}
      >
        <svg className="w-6 h-6 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Logo — solo imagen */}
      <img src="/logo.png" alt="Drivip" className="w-11 h-11 lg:w-12 lg:h-12 object-contain" />

      {/* Avatar Perfil con Estado */}
      <button
        aria-label="Abrir Perfil"
        className="relative group active:scale-95 transition-transform"
        onClick={onProfileClick}
      >
        {profileImage ? (
          <img
            alt="Pasajero Avatar"
            className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl object-cover border-2 border-white"
            style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
            src={profileImage}
          />
        ) : (
          <div
            className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-purple-100 flex items-center justify-center border-2 border-white"
            style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
          >
            <span className="text-sm lg:text-base font-bold text-purple-700">{profileInitial}</span>
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
      </button>
    </header>
  );
}
