import { useState, useCallback } from "react";
import { AuthProvider, useAuthContext, useTenants, useSuscripciones, useCarreras, useClientes } from "@drivip/supabase";
import LoginScreen from "./components/LoginScreen";
import AdminAppShell from "./components/layout/AdminAppShell";
import type { AdminModule } from "./components/layout/AdminSidebar";
import AdminDashboard from "./components/AdminDashboard";
import TenantManager from "./components/TenantManager";
import PluginCatalogGrid from "./components/PluginCatalogGrid";
import BannerManager from "./components/BannerManager";
import DeliveryB2BControl from "./components/DeliveryB2BControl";
import CredentialsManager from "./components/CredentialsManager";
import PanicButton from "./components/PanicButton";
import SystemHealthMonitor from "./components/SystemHealthMonitor";
import DevOpsSection from "./components/DevOpsSection";
import PlanManager from "./components/PlanManager";
import ClienteManager from "./components/ClienteManager";

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white text-[12px] font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white/60 hover:text-white">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

function AdminDashboardView() {
  const { signOut } = useAuthContext();
  const [activeModule, setActiveModule] = useState<AdminModule>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const { tenants, loading: tenantsLoading } = useTenants();
  const { pendientes, verificarSuscripcion } = useSuscripciones();
  const { carreras } = useCarreras();
  const { clientes } = useClientes();

  const totalTenants = tenants.length;
  const tenantsActivos = tenants.filter((t) => t.suscripcion_activa).length;
  const totalClientes = clientes.length;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const handleNavigate = (module: AdminModule) => {
    setActiveModule(module);
    setMenuOpen(false);
  };

  const handleAprobar = async (id: string) => {
    const ok = await verificarSuscripcion(id, true, "admin@drivip.app");
    if (ok) showToast("Suscripcion aprobada");
  };

  const handleRechazar = async (id: string) => {
    const ok = await verificarSuscripcion(id, false, "admin@drivip.app");
    if (ok) showToast("Suscripcion rechazada");
  };

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return (
          <AdminDashboard
            totalTenants={totalTenants}
            tenantsActivos={tenantsActivos}
            tenantsLoading={tenantsLoading}
            totalClientes={totalClientes}
            onNavigate={handleNavigate}
            carreras={carreras}
            pendientes={pendientes}
          />
        );
      case "tenants":
        return <TenantManager tenants={tenants} loading={tenantsLoading} />;
      case "clientes":
        return <ClienteManager />;
      case "planes":
        return <PlanManager />;
      case "plugins":
        return <PluginCatalogGrid />;
      case "promociones":
        return <BannerManager />;
      case "b2b":
        return <DeliveryB2BControl />;
      case "security":
        return (
          <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
            <CredentialsManager />
            <PanicButton />
          </div>
        );
      case "devops":
        return (
          <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
            <SystemHealthMonitor />
            <DevOpsSection />
          </div>
        );
      case "suscripciones":
        return (
          <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
            <h2 className="text-base lg:text-lg font-black text-slate-900">Suscripciones</h2>
            <div className="bg-white rounded-2xl p-4 space-y-3 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pendientes de verificar</span>
              {pendientes.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                    <span className="material-symbols-outlined text-[24px] text-emerald-600">check_circle</span>
                  </div>
                  <p className="text-[12px] text-slate-500">No hay pagos pendientes</p>
                </div>
              ) : (
                pendientes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div>
                      <span className="text-[12px] lg:text-[13px] text-slate-900 font-medium">Tenant: {p.tenant_id.slice(0, 8)}...</span>
                      <span className="text-[10px] lg:text-[11px] text-slate-500 block">{new Date(p.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] lg:text-[14px] text-emerald-600 font-bold">${p.monto}</span>
                      <button
                        onClick={() => handleAprobar(p.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-[10px] lg:text-[11px] font-bold active:scale-95 transition shadow-sm"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleRechazar(p.id)}
                        className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-[10px] lg:text-[11px] font-bold active:scale-95 transition shadow-sm"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case "mantenimiento":
        return (
          <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
            <h2 className="text-base lg:text-lg font-black text-slate-900">Mantenimiento</h2>
            <div className="bg-white rounded-2xl p-4 space-y-2 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
              {[
                { icon: "backup", label: "Respaldo manual", desc: "Crear respaldo de la base de datos", toast: "Respaldando base de datos..." },
                { icon: "restore", label: "Restaurar respaldo", desc: "Restaurar desde un respaldo anterior", toast: "Restaurando respaldo..." },
                { icon: "build", label: "Reparar datos", desc: "Reparar registros huerfanos", toast: "Reparando datos..." },
                { icon: "replay", label: "Reindexar", desc: "Reindexar tablas para optimizar", toast: "Reindexando tablas..." },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => showToast(item.toast)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-slate-600">{item.icon}</span>
                  </div>
                  <div>
                    <span className="text-[12px] lg:text-[13px] text-slate-900 font-medium block">{item.label}</span>
                    <span className="text-[10px] lg:text-[11px] text-slate-500">{item.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case "reportes":
        return (
          <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
            <h2 className="text-base lg:text-lg font-black text-slate-900">Reportes</h2>
            <div className="bg-white rounded-2xl p-4 space-y-2 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
              {[
                { icon: "payments", label: "Ingresos por periodo", toast: "Generando reporte de ingresos..." },
                { icon: "local_taxi", label: "Carreras por tenant", toast: "Generando reporte de carreras..." },
                { icon: "trending_up", label: "Crecimiento de usuarios", toast: "Generando reporte de usuarios..." },
                { icon: "download", label: "Exportar CSV/PDF", toast: "Exportando datos..." },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => showToast(item.toast)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-cyan-600">{item.icon}</span>
                  </div>
                  <span className="text-[12px] lg:text-[13px] text-slate-900 font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case "respaldos":
        return (
          <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
            <h2 className="text-base lg:text-lg font-black text-slate-900">Respaldos</h2>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
              <p className="text-[12px] lg:text-[13px] text-slate-500">Los respaldos se realizan automaticamente cada 24 horas. Ultimo respaldo: 10/09/2026 03:00 AM</p>
              <button
                onClick={() => showToast("Respaldando base de datos...")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold text-[12px] lg:text-[13px] active:scale-[0.98] transition shadow-lg shadow-blue-600/30"
              >
                Crear respaldo ahora
              </button>
            </div>
          </div>
        );
      case "soporte":
        return (
          <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
            <h2 className="text-base lg:text-lg font-black text-slate-900">Soporte</h2>
            <div className="bg-white rounded-2xl p-4 space-y-3 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
              <p className="text-[12px] lg:text-[13px] text-slate-500">Tickets abiertos: 2</p>
              <button
                onClick={() => showToast("Abriendo panel de tickets...")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold text-[12px] lg:text-[13px] active:scale-[0.98] transition shadow-lg shadow-red-500/30"
              >
                Ver tickets
              </button>
            </div>
          </div>
        );
      default:
        return <TenantManager tenants={tenants} loading={tenantsLoading} />;
    }
  };

  return (
    <>
      <Toast message={toast} onClose={() => setToast("")} />
      <AdminAppShell
        activeModule={activeModule}
        onNavigate={handleNavigate}
        onLogout={signOut}
        pendingCount={pendientes.length}
        menuOpen={menuOpen}
        onMenuOpen={() => setMenuOpen(true)}
        onMenuClose={() => setMenuOpen(false)}
      >
        {renderModule()}
      </AdminAppShell>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading, configured } = useAuthContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4f6f8]">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    );
  }

  if (!user && configured) {
    return <LoginScreen />;
  }

  return <AdminDashboardView />;
}
