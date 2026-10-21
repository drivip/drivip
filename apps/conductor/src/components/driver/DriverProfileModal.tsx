import { useEffect, useState } from "react";
import type { ConversacionConductor, Tenant } from "@drivip/types";
import { cn } from "@drivip/ui";
import { useScrollLock } from "../../hooks/useScrollLock";
import MiPerfil from "../MiPerfil";
import DriverMessageCenter from "./DriverMessageCenter";

type ProfileTab = "perfil" | "mensajes";

interface DriverProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ProfileTab;
  tenant?: Tenant | null;
  demo?: boolean;
  profileName: string;
  profileSlug: string;
  profileInitial: string;
  conversaciones: ConversacionConductor[];
  loadingConversaciones: boolean;
  userId: string | null;
  onMarcarLeida: (conversacionId: string) => void;
  onRefetchConversaciones: () => void;
  onNavigate: (module: string) => void;
}

const SHORTCUTS = [
  { id: "clientes", label: "Mis clientes", icon: "group", color: "bg-emerald-100 text-emerald-700" },
  { id: "resenas", label: "Mis reseñas", icon: "reviews", color: "bg-amber-100 text-amber-700" },
  { id: "config", label: "Configuración", icon: "tune", color: "bg-purple-100 text-purple-700" },
  { id: "plan", label: "Mi plan", icon: "credit_card", color: "bg-blue-100 text-blue-700" },
];

export default function DriverProfileModal({
  isOpen,
  onClose,
  initialTab = "perfil",
  tenant,
  demo = false,
  profileName,
  profileSlug,
  profileInitial,
  conversaciones,
  loadingConversaciones,
  userId,
  onMarcarLeida,
  onRefetchConversaciones,
  onNavigate,
}: DriverProfileModalProps) {
  const [tab, setTab] = useState<ProfileTab>(initialTab);

  useScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) setTab(initialTab);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const unread = conversaciones.reduce((total, item) => total + (item.no_leidos ?? 0), 0);

  const go = (module: string) => {
    onNavigate(module);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-[#f1f4f8] shadow-2xl sm:h-[86dvh] sm:rounded-3xl">
        <div className="flex items-center gap-3 border-b border-slate-200/70 bg-white px-4 py-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-sm font-black text-white shadow-md">
            {profileInitial}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-black text-slate-900">{profileName}</h2>
            <p className="truncate text-[10px] font-semibold text-slate-500">
              {profileSlug} · Conductor Drivip
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-95"
            aria-label="Cerrar perfil"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex gap-1 border-b border-slate-200/70 bg-white px-3 py-2">
          <button
            type="button"
            onClick={() => setTab("perfil")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold transition active:scale-[0.98]",
              tab === "perfil"
                ? "bg-purple-700 text-white shadow-md shadow-purple-600/20"
                : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <span className="material-symbols-outlined text-[17px]">person</span>
            Mi perfil
          </button>
          <button
            type="button"
            onClick={() => setTab("mensajes")}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold transition active:scale-[0.98]",
              tab === "mensajes"
                ? "bg-purple-700 text-white shadow-md shadow-purple-600/20"
                : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <span className="material-symbols-outlined text-[17px]">forum</span>
            Mensajes
            {unread > 0 && (
              <span className="absolute right-3 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-3">
          {tab === "mensajes" ? (
            <DriverMessageCenter
              embedded
              isOpen
              onClose={onClose}
              conversaciones={conversaciones}
              loading={loadingConversaciones}
              userId={userId}
              onMarcarLeida={onMarcarLeida}
              onRefetch={onRefetchConversaciones}
            />
          ) : (
            <div className="h-full overflow-y-auto pr-0.5">
              <div className="space-y-4">
                <MiPerfil tenant={tenant} demo={demo} embedded />

                <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/60">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Accesos rápidos
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {SHORTCUTS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => go(item.id)}
                        className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left active:scale-[0.98]"
                      >
                        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", item.color)}>
                          <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                        </span>
                        <span className="text-[11px] font-bold leading-tight text-slate-800">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
