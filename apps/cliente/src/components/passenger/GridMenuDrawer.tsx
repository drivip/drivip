import { PushNotificationCard } from "@drivip/supabase";
import { useScrollLock } from "../../hooks/useScrollLock";

interface GridMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressesClick: () => void;
  onDriversClick: () => void;
  onHistoryClick: () => void;
  onReservationsClick: () => void;
  passengerName: string;
}

export default function GridMenuDrawer({
  isOpen,
  onClose,
  onAddressesClick,
  onDriversClick,
  onHistoryClick,
  onReservationsClick,
  passengerName,
}: GridMenuDrawerProps) {
  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" data-purpose="grid-menu-drawer">
      {/* Backdrop with fade */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel - slide in from left */}
      <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm md:left-1/2 md:top-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md lg:max-w-lg md:rounded-3xl md:shadow-2xl bg-[#f4f6f8] p-5 lg:p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-5">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <img
                alt="Pasajero"
                className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl object-cover border-2 border-white shadow-md"
                src="https://lh3.googleusercontent.com/aida/AEtjO1UtcPVc3Q3lAz8nr1VmoqLAl5T0lgizVxTrazT9sC9ZDM_cRsDKVuHjIaIX0wcBNEV1WKS9wk428xTkPA3azZgVXrNT4aS7W2aTgitlKI9zngnrbGDH-2s7Fjdmztf58Hk0cjSuYFw6O1QPwSHuVrYFd_ER2x5Fc8yIBrz847a2LdSejbVlVe-5TUFGLbZxAon4324QNvfjHJjBlqpXPaapJZnNo2aIalP2ftK3Jmp4pgPCxbliIceftzvS"
              />
              <div>
                <h3 className="text-sm lg:text-base font-black text-slate-900 leading-tight">{passengerName}</h3>
                <span className="text-[11px] lg:text-xs text-purple-700 font-bold">Pasajero VIP • Venezuela</span>
              </div>
            </div>
            <button className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-95" onClick={onClose}>
              ✕
            </button>
          </div>

          {/* Grid de Opciones en 2 Columnas */}
          <div className="grid grid-cols-2 gap-3">
            <button
              className="p-3.5 lg:p-4 rounded-2xl bg-white border border-slate-100 flex flex-col items-start gap-2 text-left active:scale-95 transition"
              style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
              onClick={() => { onAddressesClick(); onClose(); }}
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <div>
                <strong className="text-xs lg:text-sm font-extrabold text-slate-900 block">Direcciones</strong>
                <span className="text-[10px] lg:text-[11px] text-slate-500">Casa, Trabajo, Sambil</span>
              </div>
            </button>

            <button
              className="p-3.5 lg:p-4 rounded-2xl bg-white border border-slate-100 flex flex-col items-start gap-2 text-left active:scale-95 transition"
              style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
              onClick={() => { onDriversClick(); onClose(); }}
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <div>
                <strong className="text-xs lg:text-sm font-extrabold text-slate-900 block">Mis Conductores</strong>
                <span className="text-[10px] lg:text-[11px] text-slate-500">Línea Multi-Chofer</span>
              </div>
            </button>

            <button
              className="p-3.5 lg:p-4 rounded-2xl bg-white border border-slate-100 flex flex-col items-start gap-2 text-left active:scale-95 transition"
              style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
              onClick={() => { onHistoryClick(); onClose(); }}
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <div>
                <strong className="text-xs lg:text-sm font-extrabold text-slate-900 block">Historial & Recibos</strong>
                <span className="text-[10px] lg:text-[11px] text-slate-500">Recibos digitales BCV</span>
              </div>
            </button>

            <button
              className="p-3.5 lg:p-4 rounded-2xl bg-white border border-slate-100 flex flex-col items-start gap-2 text-left active:scale-95 transition"
              style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
              onClick={() => { onReservationsClick(); onClose(); }}
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-600 text-white flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <div>
                <strong className="text-xs lg:text-sm font-extrabold text-slate-900 block">Mis Reservas</strong>
                <span className="text-[10px] lg:text-[11px] text-slate-500">Viajes programados</span>
              </div>
            </button>
          </div>

          <PushNotificationCard />
        </div>

        {/* Footer Drawer: WhatsApp Soporte Directo */}
        <div className="pt-4 border-t border-slate-200">
          <a
            className="w-full py-3 lg:py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs lg:text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
            href="https://wa.me/584120000000"
            target="_blank"
            rel="noreferrer"
          >
            <span>Soporte Drivip</span>
          </a>
        </div>
      </div>
    </div>
  );
}
