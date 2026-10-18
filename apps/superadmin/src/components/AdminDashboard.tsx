import type { AdminModule } from "./layout/AdminSidebar";
import AdminGridMenu from "./AdminGridMenu";
import type { Carrera, Suscripcion } from "@drivip/types";

interface AdminDashboardProps {
  totalTenants: number;
  tenantsActivos: number;
  tenantsLoading: boolean;
  totalClientes?: number;
  onNavigate: (module: AdminModule) => void;
  carreras?: Carrera[];
  pendientes?: Suscripcion[];
}

export default function AdminDashboard({
  totalTenants,
  tenantsActivos,
  tenantsLoading,
  totalClientes = 0,
  onNavigate,
  carreras = [],
  pendientes = [],
}: AdminDashboardProps) {
  const mrr = tenantsActivos * 10;

  const now = new Date();
  const todayStr = now.toDateString();
  const carrerasHoy = carreras.filter((c) => new Date(c.created_at).toDateString() === todayStr);
  const totalCarreras = carrerasHoy.length;
  const carrerasCompletadas = carrerasHoy.filter((c) => c.estado === "completada").length;

  return (
    <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-5 pb-24 lg:pb-6">
      <div className="bg-white rounded-3xl p-5 lg:p-6 border border-slate-100" style={{ boxShadow: "6px 6px 14px #d9dde2, -6px -6px 14px #ffffff" }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base lg:text-lg font-black text-slate-900">Bienvenido, SuperAdmin</h2>
            <p className="text-[11px] lg:text-xs text-slate-500 mt-0.5">Panel de control Drivip</p>
          </div>
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-blue-600">business</span>
            </div>
          </div>
          <span className="text-[24px] lg:text-[28px] font-black text-slate-900 block leading-tight">{tenantsLoading ? "..." : totalTenants}</span>
          <span className="text-[10px] lg:text-[11px] text-slate-500 font-medium">Total Conductores</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">group</span>
            </div>
          </div>
          <span className="text-[24px] lg:text-[28px] font-black text-emerald-600 block leading-tight">{totalClientes}</span>
          <span className="text-[10px] lg:text-[11px] text-slate-500 font-medium">Total Clientes</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">payments</span>
            </div>
          </div>
          <span className="text-[24px] lg:text-[28px] font-black text-emerald-600 block leading-tight">${mrr}</span>
          <span className="text-[10px] lg:text-[11px] text-slate-500 font-medium">MRR USD</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-purple-600">workspace_premium</span>
            </div>
          </div>
          <span className="text-[24px] lg:text-[28px] font-black text-slate-900 block leading-tight">3</span>
          <span className="text-[10px] lg:text-[11px] text-slate-500 font-medium">Planes Activos</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-purple-600">local_taxi</span>
            </div>
          </div>
          <span className="text-[24px] lg:text-[28px] font-black text-slate-900 block leading-tight">{totalCarreras}</span>
          <span className="text-[10px] lg:text-[11px] text-slate-500 font-medium">Carreras Hoy</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-amber-600">check_circle</span>
            </div>
          </div>
          <span className="text-[24px] lg:text-[28px] font-black text-slate-900 block leading-tight">{carrerasCompletadas}</span>
          <span className="text-[10px] lg:text-[11px] text-slate-500 font-medium">Completadas</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Alertas</h3>
        <div className="flex items-start gap-3 py-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[16px] text-amber-600">warning</span>
          </div>
          <span className="text-[12px] lg:text-[13px] text-slate-700">{pendientes.length} pagos pendientes de verificar</span>
        </div>
        <div className="flex items-start gap-3 py-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
          </div>
          <span className="text-[12px] lg:text-[13px] text-slate-700">Sistema operativo al 100%</span>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Modulos</h3>
        <AdminGridMenu onNavigate={onNavigate} />
      </div>
    </div>
  );
}
