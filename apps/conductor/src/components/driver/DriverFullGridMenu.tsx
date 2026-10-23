import { useScrollLock } from "../../hooks/useScrollLock";

interface DriverFullGridMenuProps {
  isOpen: boolean;
  onClose: () => void;
  driverName: string;
  driverInitial: string;
  unreadMessages?: number;
  unreadSupport?: number;
  onNavigate: (module: string) => void;
}

const MENU_ITEMS = [
  {
    id: "mensajes",
    label: "Mensajes",
    desc: "Chat con tus clientes",
    gradient: "from-purple-600 to-fuchsia-700",
    svgPath: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  },
  {
    id: "soporte",
    label: "Soporte Drivip",
    desc: "Canal directo con el equipo",
    gradient: "from-slate-700 to-slate-900",
    svgPath: "M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 000-5.656M6.343 6.343a8 8 0 000 11.314m3.536-3.536a4 4 0 010-5.656M12 12h.01",
  },
  {
    id: "resenas",
    label: "Mis Reseñas",
    desc: "Opiniones y calificación",
    gradient: "from-amber-400 to-orange-600",
    svgPath: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.673z",
  },
  {
    id: "reservas",
    label: "Reservas",
    desc: "Servicios agendados",
    gradient: "from-indigo-500 to-violet-700",
    svgPath: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    id: "reportes",
    label: "Reportes",
    desc: "Ingresos y estadísticas",
    gradient: "from-blue-500 to-indigo-600",
    svgPath: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    id: "clientes",
    label: "Mis Clientes",
    desc: "Pasajeros frecuentes",
    gradient: "from-purple-600 to-indigo-700",
    svgPath: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    id: "cupones",
    label: "Cupones",
    desc: "Promociones para clientes",
    gradient: "from-orange-500 to-amber-600",
    svgPath: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z",
  },
  {
    id: "referidos",
    label: "Referir",
    desc: "Gana comisiones",
    gradient: "from-amber-500 to-orange-500",
    svgPath: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7",
  },
  {
    id: "plan",
    label: "Mi Plan",
    desc: "Suscripción y plugins",
    gradient: "from-emerald-400 to-teal-600",
    svgPath: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  },
  {
    id: "tarifas",
    label: "Tarifas",
    desc: "Configurar $/KM y zonas",
    gradient: "from-rose-500 to-pink-600",
    svgPath: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    id: "pagos",
    label: "Pagos",
    desc: "Pago Móvil / Zelle",
    gradient: "from-cyan-500 to-blue-600",
    svgPath: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    id: "rutas",
    label: "Rutas Guardadas",
    desc: "Puntos clave",
    gradient: "from-violet-500 to-purple-700",
    svgPath: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    id: "historial",
    label: "Historial",
    desc: "Viajes y calificaciones",
    gradient: "from-teal-500 to-emerald-600",
    svgPath: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

export default function DriverFullGridMenu({
  isOpen,
  onClose,
  driverName,
  driverInitial,
  unreadMessages = 0,
  unreadSupport = 0,
  onNavigate,
}: DriverFullGridMenuProps) {
  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" data-purpose="driver-grid-menu">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm md:left-1/2 md:top-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md lg:max-w-lg md:rounded-3xl md:shadow-2xl bg-[#f4f6f8] p-5 lg:p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-purple-100 flex items-center justify-center border-2 border-white shadow-md">
                <span className="text-base lg:text-lg font-bold text-purple-700">{driverInitial}</span>
              </div>
              <div>
                <h3 className="text-sm lg:text-base font-black text-slate-900 leading-tight">{driverName}</h3>
                <span className="text-[11px] lg:text-xs text-emerald-600 font-bold">Conductor Pro • Venezuela</span>
              </div>
            </div>
            <button
              className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-95"
              onClick={onClose}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                className="relative p-3.5 lg:p-4 rounded-2xl bg-white border border-slate-100 flex flex-col items-start gap-2 text-left active:scale-95 transition"
                style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
                onClick={() => { onNavigate(item.id); onClose(); }}
              >
                {item.id === "mensajes" && unreadMessages > 0 && (
                  <span className="absolute right-2.5 top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
                {item.id === "soporte" && unreadSupport > 0 && (
                  <span className="absolute right-2.5 top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
                    {unreadSupport > 9 ? "9+" : unreadSupport}
                  </span>
                )}
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-tr ${item.gradient} text-white flex items-center justify-center shadow-md`}>
                  <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.svgPath} />
                  </svg>
                </div>
                <div>
                  <strong className="text-xs lg:text-sm font-extrabold text-slate-900 block">{item.label}</strong>
                  <span className="text-[10px] lg:text-[11px] text-slate-500">{item.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 mt-4">
          <a
            className="w-full py-3 lg:py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs lg:text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
            href="https://wa.me/584120000000"
            target="_blank"
            rel="noreferrer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Soporte Drivip
          </a>
        </div>
      </div>
    </div>
  );
}
