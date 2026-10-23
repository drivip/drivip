import { useState, useCallback, useEffect } from "react";
import { AuthProvider, useAuthContext, supabase, useTenants, useSuscripciones, useCarreras, useClientes, useSuperadminStats, useAdminConversaciones, useAdminReferidos } from "@drivip/supabase";
import { FloatingMessageBadge } from "@drivip/ui";
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
import AdminSoporteCenter from "./components/AdminSoporteCenter";
import AdminReferidosCenter from "./components/AdminReferidosCenter";

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
  const [supportTenantId, setSupportTenantId] = useState<string | null>(null);
  const { tenants, loading: tenantsLoading } = useTenants();
  const { pendientes, verificarSuscripcion } = useSuscripciones();
  const { carreras } = useCarreras();
  const { clientes } = useClientes();
  const { stats, loading: statsLoading } = useSuperadminStats();
  const {
    conversaciones: conversacionesSoporte,
    loading: soporteLoading,
    error: soporteError,
    available: soporteAvailable,
    totalNoLeidos: soporteNoLeidos,
    mensajeEntrante: mensajeSoporteEntrante,
    ocultarMensajeEntrante: ocultarMensajeSoporteEntrante,
    refetch: refetchSoporte,
  } = useAdminConversaciones();
  const { alertasPago: alertasPagoReferidos } = useAdminReferidos({ generarComisiones: false });

  const totalTenants = stats?.totalTenants ?? tenants.length;
  const tenantsActivos = stats?.activeTenants ?? tenants.filter((t) => t.suscripcion_activa).length;
  const totalClientes = stats?.totalClients ?? clientes.length;
  const mrr = stats?.mrr ?? 0;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const handleNavigate = (module: AdminModule) => {
    setActiveModule(module);
    setMenuOpen(false);
    if (module === "soporte") ocultarMensajeSoporteEntrante();
  };

  const handleAprobar = async (id: string) => {
    const ok = await verificarSuscripcion(id, true, "admin@drivip.app");
    if (ok) showToast("Suscripcion aprobada");
  };

  const handleRechazar = async (id: string) => {
    const ok = await verificarSuscripcion(id, false, "admin@drivip.app");
    if (ok) showToast("Suscripcion rechazada");
  };

  const ingresos = carreras
    .filter((c) => c.estado === "completada")
    .reduce((sum, c) => sum + (c.precio ?? 0), 0);

  const carrerasPorTenant = tenants
    .map((t) => ({
      nombre: t.nombre,
      total: carreras.filter((c) => c.tenant_id === t.id).length,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const exportarCSV = () => {
    const header = ["id", "fecha", "tenant_id", "origen", "destino", "precio_usd", "metodo_pago", "estado"];
    const rows = carreras.map((c) => [
      c.id,
      c.created_at,
      c.tenant_id,
      c.origen_direccion ?? "",
      c.destino_direccion ?? "",
      String(c.precio ?? 0),
      c.metodo_pago ?? "",
      c.estado,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carreras-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Reporte CSV exportado");
  };

  const exportarRespaldo = async () => {
    const [tenantsRes, carrerasRes, clientesRes, suscripcionesRes] = await Promise.all([
      supabase.from("tenants").select("*"),
      supabase.from("carreras").select("*"),
      supabase.from("clientes").select("*"),
      supabase.from("suscripciones").select("*"),
    ]);
    if (tenantsRes.error || carrerasRes.error || clientesRes.error || suscripcionesRes.error) {
      showToast("No se pudo generar el respaldo");
      return;
    }
    const payload = {
      generado_at: new Date().toISOString(),
      tenants: tenantsRes.data,
      carreras: carrerasRes.data,
      clientes: clientesRes.data,
      suscripciones: suscripcionesRes.data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `respaldo-drivip-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Respaldo exportado");
  };

  const recalcularMetricas = async () => {
    const { error } = await supabase.rpc("recalcular_metricas_tenants");
    showToast(error ? "No se pudieron recalcular las métricas" : "Métricas recalculadas");
  };

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return (
          <AdminDashboard
            totalTenants={totalTenants}
            tenantsActivos={tenantsActivos}
            tenantsLoading={tenantsLoading || statsLoading}
            mrr={mrr}
            totalClientes={totalClientes}
            ridesToday={stats?.ridesToday}
            completedToday={stats?.completedToday}
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
        return <PlanManager tenants={tenants} />;
      case "plugins":
        return <PluginCatalogGrid />;
      case "promociones":
        return <BannerManager tenants={tenants} />;
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
              <button
                onClick={recalcularMetricas}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">calculate</span>
                </div>
                <div>
                  <span className="text-[12px] lg:text-[13px] text-slate-900 font-medium block">Recalcular métricas</span>
                  <span className="text-[10px] lg:text-[11px] text-slate-500">Actualiza totales de carreras y clientes por tenant</span>
                </div>
              </button>
              <button
                onClick={exportarRespaldo}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px] text-blue-600">download</span>
                </div>
                <div>
                  <span className="text-[12px] lg:text-[13px] text-slate-900 font-medium block">Exportar respaldo JSON</span>
                  <span className="text-[10px] lg:text-[11px] text-slate-500">Descarga tenants, carreras, clientes y suscripciones</span>
                </div>
              </button>
              <p className="text-[10px] lg:text-[11px] text-slate-400 px-3 pt-2">
                Restauración, reindexado y políticas de respaldo automático se gestionan desde el panel de Supabase.
              </p>
            </div>
          </div>
        );
      case "reportes":
        return (
          <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
            <h2 className="text-base lg:text-lg font-black text-slate-900">Reportes</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Ingresos", value: `$${ingresos.toFixed(2)}`, icon: "payments" },
                { label: "Carreras", value: String(carreras.length), icon: "local_taxi" },
                { label: "Clientes", value: String(clientes.length), icon: "group" },
                { label: "Conductores", value: String(tenants.length), icon: "two_wheeler" },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
                  <span className="material-symbols-outlined text-[18px] text-cyan-600">{card.icon}</span>
                  <p className="text-[18px] lg:text-[20px] font-black text-slate-900 mt-1">{card.value}</p>
                  <p className="text-[10px] lg:text-[11px] text-slate-500">{card.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-4 space-y-2 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Carreras por conductor</span>
              {carrerasPorTenant.length === 0 && <p className="text-[12px] text-slate-400 py-2">Sin datos</p>}
              {carrerasPorTenant.map((row) => (
                <div key={row.nombre} className="flex items-center justify-between py-1.5 text-[12px] lg:text-[13px]">
                  <span className="text-slate-700 truncate">{row.nombre}</span>
                  <span className="font-mono font-bold text-slate-900">{row.total}</span>
                </div>
              ))}
            </div>
            <button
              onClick={exportarCSV}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-[12px] lg:text-[13px] active:scale-[0.98] transition shadow-lg shadow-blue-600/30"
            >
              Exportar carreras a CSV
            </button>
          </div>
        );
      case "respaldos":
        return (
          <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
            <h2 className="text-base lg:text-lg font-black text-slate-900">Respaldos</h2>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
              <p className="text-[12px] lg:text-[13px] text-slate-500">
                Los respaldos automáticos son administrados por Supabase según el plan del proyecto. Puedes descargar
                una copia de los datos accesibles desde el panel.
              </p>
              <button
                onClick={exportarRespaldo}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold text-[12px] lg:text-[13px] active:scale-[0.98] transition shadow-lg shadow-blue-600/30"
              >
                Descargar respaldo JSON
              </button>
            </div>
          </div>
        );
      case "referidos":
        return <AdminReferidosCenter />;
      case "soporte":
        return (
          <AdminSoporteCenter
            conversaciones={conversacionesSoporte}
            loading={soporteLoading}
            error={soporteError}
            available={soporteAvailable}
            totalNoLeidos={soporteNoLeidos}
            initialTenantId={supportTenantId}
            onRefetch={refetchSoporte}
          />
        );
      default:
        return <TenantManager tenants={tenants} loading={tenantsLoading} />;
    }
  };

  return (
    <>
      <Toast message={toast} onClose={() => setToast("")} />
      {mensajeSoporteEntrante && activeModule !== "soporte" && (
        <FloatingMessageBadge
          title={`Soporte · ${mensajeSoporteEntrante.tenant_nombre}`}
          message={mensajeSoporteEntrante.contenido}
          time={new Date(mensajeSoporteEntrante.created_at).toLocaleTimeString("es-VE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          onOpen={() => {
            setSupportTenantId(mensajeSoporteEntrante.tenant_id);
            handleNavigate("soporte");
            ocultarMensajeSoporteEntrante();
          }}
          onHide={ocultarMensajeSoporteEntrante}
          accent="purple"
        />
      )}
      <AdminAppShell
        activeModule={activeModule}
        onNavigate={handleNavigate}
        onLogout={signOut}
        pendingCount={pendientes.length}
        supportUnread={soporteNoLeidos}
        referralsPending={alertasPagoReferidos.length}
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
  const { user, loading, configured, signOut } = useAuthContext();
  const [roleLoading, setRoleLoading] = useState(Boolean(user));
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsSuperadmin(false);
      setRoleLoading(false);
      return;
    }

    let cancelled = false;
    setRoleLoading(true);

    supabase
      .rpc("is_superadmin")
      .then(({ data, error }) => {
        if (cancelled) return;
        setIsSuperadmin(!error && data === true);
        setRoleLoading(false);
      });

    return () => { cancelled = true; };
  }, [user]);

  if (loading || (user && roleLoading)) {
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

  if (user && !isSuperadmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-6">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <span className="material-symbols-outlined text-[24px] text-red-600">shield_lock</span>
          </div>
          <h1 className="text-lg font-black text-slate-900">Acceso restringido</h1>
          <p className="mt-2 text-sm text-slate-500">
            Esta cuenta no tiene permisos de superadministrador.
          </p>
          <button
            onClick={signOut}
            className="mt-5 w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white active:scale-[0.98]"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboardView />;
}
