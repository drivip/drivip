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
      <div className="absolute left-0 top-0 bottom-0 flex w-[88%] max-w-sm flex-col justify-between gap-4 overflow-y-auto bg-[#f4f6f8] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] md:bottom-auto md:left-1/2 md:top-1/2 md:max-h-[85dvh] md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:shadow-2xl lg:max-w-lg lg:p-6">
        <div className="space-y-5">
          {/* Drawer Header */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-white bg-purple-100 text-lg font-black text-purple-700 shadow-md lg:h-14 lg:w-14 lg:text-xl">
                {passengerName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-base font-black leading-tight text-slate-900 lg:text-lg">{passengerName}</h3>
                <span className="block text-xs font-bold text-purple-700">Pasajero VIP</span>
                <span className="block text-[10px] font-semibold text-slate-400">Venezuela</span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Cerrar menú"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm active:scale-95"
              onClick={onClose}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
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
                <strong className="block text-sm font-extrabold text-slate-900">Direcciones</strong>
                <span className="text-xs text-slate-500">Casa, Trabajo, Sambil</span>
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
                <strong className="block text-sm font-extrabold text-slate-900">Mis Conductores</strong>
                <span className="text-xs text-slate-500">Línea Multi-Chofer</span>
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
                <strong className="block text-sm font-extrabold text-slate-900">Historial & Recibos</strong>
                <span className="text-xs text-slate-500">Recibos digitales BCV</span>
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
                <strong className="block text-sm font-extrabold text-slate-900">Mis Reservas</strong>
                <span className="text-xs text-slate-500">Viajes programados</span>
              </div>
            </button>
          </div>

          <PushNotificationCard />
        </div>

        <div className="border-t border-slate-200 pt-4">
          <a
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] lg:py-3.5 lg:text-sm"
            href="https://drivip-home.pages.dev"
            target="_blank"
            rel="noreferrer"
          >
            <span className="material-symbols-outlined text-[18px] text-purple-600">help</span>
            Centro de ayuda
          </a>
        </div>
      </div>
    </div>
  );
}
