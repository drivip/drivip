import { cn } from "@drivip/ui";

export type AdminModule =
  | "dashboard"
  | "tenants"
  | "clientes"
  | "planes"
  | "suscripciones"
  | "plugins"
  | "promociones"
  | "b2b"
  | "security"
  | "devops"
  | "mantenimiento"
  | "reportes"
  | "respaldos"
  | "soporte";

interface NavItem {
  id: AdminModule;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "tenants", icon: "business", label: "Tenants" },
  { id: "clientes", icon: "group", label: "Clientes" },
  { id: "planes", icon: "workspace_premium", label: "Planes" },
  { id: "suscripciones", icon: "payments", label: "Suscripciones" },
  { id: "plugins", icon: "extension", label: "Plugins" },
  { id: "promociones", icon: "campaign", label: "Promociones" },
  { id: "b2b", icon: "local_shipping", label: "B2B Delivery" },
  { id: "security", icon: "shield", label: "Seguridad" },
  { id: "devops", icon: "cloud", label: "DevOps" },
  { id: "mantenimiento", icon: "build", label: "Mantenimiento" },
  { id: "reportes", icon: "analytics", label: "Reportes" },
  { id: "respaldos", icon: "backup", label: "Respaldos" },
  { id: "soporte", icon: "support_agent", label: "Soporte" },
];

interface AdminSidebarProps {
  activeModule: AdminModule;
  onNavigate: (module: AdminModule) => void;
  onLogout: () => void;
}

export default function AdminSidebar({ activeModule, onNavigate, onLogout }: AdminSidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-[260px] bg-[#f8f9fb] border-r border-slate-200/60">
      <div className="flex items-center h-16 px-4 border-b border-slate-200/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-black text-slate-900 tracking-tight">Drivip</span>
            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-mono text-[8px] font-bold tracking-wider w-fit">SUPER ADMIN</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98]",
                isActive
                  ? "bg-white text-red-600 font-bold shadow-md border border-slate-100"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
              )}
              style={!isActive ? undefined : { boxShadow: "3px 3px 8px #d9dde2, -3px -3px 8px #ffffff" }}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-[11px] tracking-wide font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-2 pb-3">
        <div className="p-3 rounded-2xl bg-white border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <span className="text-sm font-bold text-red-600">SA</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] text-slate-900 font-bold truncate">SuperAdmin</span>
              <span className="text-[10px] text-slate-500 font-mono truncate">admin.drivip.app</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="mt-2.5 w-full py-2 rounded-xl bg-red-50 text-red-600 text-[11px] font-bold border border-red-100 active:scale-[0.98] transition"
          >
            Cerrar sesion
          </button>
        </div>
      </div>
    </aside>
  );
}
