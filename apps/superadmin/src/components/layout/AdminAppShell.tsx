import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import AdminBottomNav from "./AdminBottomNav";
import type { AdminModule } from "./AdminSidebar";
import { useScrollLock } from "../../hooks/useScrollLock";

interface AdminAppShellProps {
  activeModule: AdminModule;
  onNavigate: (module: AdminModule) => void;
  onLogout: () => void;
  pendingCount: number;
  menuOpen: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS_MOBILE: { id: AdminModule; icon: string; label: string; desc: string; gradient: string }[] = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard", desc: "Vista general", gradient: "from-slate-500 to-gray-600" },
  { id: "tenants", icon: "business", label: "Tenants", desc: "Conductores", gradient: "from-blue-500 to-indigo-600" },
  { id: "clientes", icon: "group", label: "Clientes", desc: "Clientes registrados", gradient: "from-emerald-500 to-teal-600" },
  { id: "planes", icon: "workspace_premium", label: "Planes", desc: "Suscripciones y precios", gradient: "from-purple-500 to-indigo-600" },
  { id: "suscripciones", icon: "payments", label: "Suscripciones", desc: "Pagos y verificaciones", gradient: "from-emerald-400 to-teal-600" },
  { id: "plugins", icon: "extension", label: "Plugins", desc: "Catalogo de extensiones", gradient: "from-violet-500 to-purple-700" },
  { id: "promociones", icon: "campaign", label: "Promociones", desc: "Banners y descuentos", gradient: "from-amber-500 to-orange-500" },
  { id: "b2b", icon: "local_shipping", label: "B2B Delivery", desc: "Logistica empresas", gradient: "from-rose-500 to-pink-600" },
  { id: "security", icon: "shield", label: "Seguridad", desc: "Credenciales y panico", gradient: "from-red-500 to-rose-600" },
  { id: "devops", icon: "cloud", label: "DevOps", desc: "Deploy y monitoreo", gradient: "from-teal-500 to-emerald-600" },
  { id: "mantenimiento", icon: "build", label: "Mantenimiento", desc: "Reparacion de datos", gradient: "from-slate-500 to-gray-600" },
  { id: "reportes", icon: "analytics", label: "Reportes", desc: "Analytics e ingresos", gradient: "from-cyan-500 to-blue-600" },
  { id: "respaldos", icon: "backup", label: "Respaldos", desc: "Backup y restauracion", gradient: "from-indigo-500 to-blue-600" },
  { id: "soporte", icon: "support_agent", label: "Soporte", desc: "Tickets de tenants", gradient: "from-orange-400 to-red-500" },
];

export default function AdminAppShell({
  activeModule,
  onNavigate,
  onLogout,
  pendingCount,
  menuOpen,
  onMenuOpen,
  onMenuClose,
  children,
}: AdminAppShellProps) {
  useScrollLock(menuOpen);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#f4f6f8]">
      <AdminSidebar activeModule={activeModule} onNavigate={onNavigate} onLogout={onLogout} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="lg:hidden">
          <AdminHeader
            onMenuClick={onMenuOpen}
            onNotificationsClick={() => onNavigate("suscripciones")}
            onLogout={onLogout}
            pendingCount={pendingCount}
          />
        </div>

        <main className="flex-1 overflow-y-auto no-scrollbar">{children}</main>
      </div>

      <AdminBottomNav activeModule={activeModule} onNavigate={onNavigate} />

      {/* Mobile hamburger menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onMenuClose} />

          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-[#f4f6f8] p-5 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Drivip Admin</h3>
                  <span className="text-[10px] text-red-600 font-bold">SUPER ADMIN</span>
                </div>
              </div>
              <button
                className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-95"
                onClick={onMenuClose}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {NAV_ITEMS_MOBILE.map((item) => {
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    className={`p-3.5 rounded-2xl border flex flex-col items-start gap-2 text-left active:scale-95 transition ${
                      isActive ? "bg-white border-red-200 ring-2 ring-red-100" : "bg-white border-slate-100"
                    }`}
                    style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
                    onClick={() => { onNavigate(item.id); onMenuClose(); }}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.gradient} text-white flex items-center justify-center shadow-md`}>
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    </div>
                    <div>
                      <strong className="text-[11px] font-extrabold text-slate-900 block">{item.label}</strong>
                      <span className="text-[9px] text-slate-500">{item.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <button
                onClick={() => { onLogout(); onMenuClose(); }}
                className="w-full py-3 rounded-2xl bg-red-50 text-red-600 text-[12px] font-bold border border-red-100 active:scale-95 transition"
              >
                Cerrar sesion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
