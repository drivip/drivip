import { useState } from "react";
import { useTenantDetail, useTenantActions, useTenantBanners, useTenantNotificaciones, useCuentaReferido, useConfigReferidos, APP_URLS } from "@drivip/supabase";
import type { MetodoPagoSuscripcion } from "@drivip/types";

type DetailTab = "info" | "clientes" | "pagos" | "modulos" | "promociones" | "monitoreo";

const TABS: { id: DetailTab; label: string; icon: string }[] = [
  { id: "info", label: "Info", icon: "person" },
  { id: "clientes", label: "Clientes", icon: "group" },
  { id: "pagos", label: "Pagos", icon: "payments" },
  { id: "modulos", label: "Modulos", icon: "extension" },
  { id: "promociones", label: "Promos", icon: "campaign" },
  { id: "monitoreo", label: "Monitor", icon: "monitoring" },
];

const ALL_MODULES = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "carreras", label: "Carreras", icon: "local_taxi" },
  { id: "clientes", label: "Mis Clientes", icon: "group" },
  { id: "pagos", label: "Pagos", icon: "payments" },
  { id: "perfil", label: "Mi Perfil", icon: "person" },
  { id: "qr", label: "QR / Pagina", icon: "qr_code" },
  { id: "config", label: "Configuracion", icon: "settings" },
  { id: "historial", label: "Historial", icon: "history" },
  { id: "referidos", label: "Referidos", icon: "share" },
  { id: "reportes", label: "Reportes", icon: "analytics" },
];

const VEHICLE_ICONS: Record<string, string> = {
  moto: "two_wheeler",
  carro: "directions_car",
  camioneta: "local_shipping",
};

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white text-[12px] font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white/60 hover:text-white">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

interface TenantDetailPanelProps {
  tenantId: string;
  onBack: () => void;
}

export default function TenantDetailPanel({ tenantId, onBack }: TenantDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("info");
  const [toast, setToast] = useState("");

  const { tenant, carrerasRecientes, plugins, banners, notificaciones, loading, refetch } = useTenantDetail(tenantId);
  const actions = useTenantActions();
  const bannerActions = useTenantBanners(tenantId);
  const notifActions = useTenantNotificaciones(tenantId);
  const { cuenta: cuentaReferidos } = useCuentaReferido(tenantId);
  const { config: configReferidos } = useConfigReferidos();

  const preciosPlan: Record<string, number> = {
    estandar: Number(configReferidos?.precio_plan_estandar ?? 25),
    profesional: Number(configReferidos?.precio_plan_profesional ?? 25),
    premium: Number(configReferidos?.precio_plan_premium ?? 25),
  };

  const [pauseMotivo, setPauseMotivo] = useState("");
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [pagoForm, setPagoForm] = useState<{
    monto: string;
    moneda: string;
    metodo_pago: MetodoPagoSuscripcion;
    referencia: string;
    meses: string;
  }>({ monto: "10", moneda: "VES", metodo_pago: "pago_movil", referencia: "", meses: "1" });
  const [notifForm, setNotifForm] = useState({ titulo: "", mensaje: "", tipo: "info" as const });
  const [bannerForm, setBannerForm] = useState<{ titulo: string; descripcion: string; prioridad: "baja" | "normal" | "alta" }>({ titulo: "", descripcion: "", prioridad: "normal" });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-8 py-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="px-4 lg:px-8 py-8 text-center">
        <p className="text-sm text-slate-500">Tenant no encontrado</p>
        <button onClick={onBack} className="mt-3 text-sm text-blue-600 font-bold">Volver</button>
      </div>
    );
  }

  const precioPlanActual =
    cuentaReferidos?.total_mensual ??
    preciosPlan[String(tenant.plan ?? "").toLowerCase()] ??
    preciosPlan.estandar;

  const handleTogglePausa = async () => {
    const ok = await actions.togglePausa(tenant.id, !tenant.pausado, pauseMotivo || undefined);
    if (ok) {
      showToast(tenant.pausado ? "Reactivado" : "Pausado");
      setShowPauseModal(false);
      setPauseMotivo("");
      refetch();
    }
  };

  const handleCambiarPlan = async (plan: string) => {
    const ok = await actions.cambiarPlan(tenant.id, plan);
    if (ok) {
      showToast(`Plan cambiado a ${plan}`);
      setShowPlanModal(false);
      refetch();
    }
  };

  const handleToggleActivo = async () => {
    const ok = await actions.toggleActivo(tenant.id, !tenant.suscripcion_activa);
    if (ok) {
      showToast(tenant.suscripcion_activa ? "Conductor desactivado" : "Conductor activado");
      refetch();
    } else {
      showToast("No se pudo actualizar el estado");
    }
  };

  const handleRegistrarPago = async () => {
    const monto = Number(pagoForm.monto);
    const meses = Number(pagoForm.meses) || 1;
    if (!monto || monto <= 0) {
      showToast("Ingresa un monto valido");
      return;
    }
    const ok = await actions.registrarPago(tenant.id, {
      monto,
      moneda: pagoForm.moneda,
      metodo_pago: pagoForm.metodo_pago,
      referencia: pagoForm.referencia || null,
      meses,
      verificado_por: "admin@drivip.app",
    });
    if (ok) {
      showToast("Pago registrado y conductor activado");
      setShowPagoModal(false);
      setPagoForm({ monto: String(precioPlanActual), moneda: "VES", metodo_pago: "pago_movil", referencia: "", meses: "1" });
      refetch();
    } else {
      showToast("No se pudo registrar el pago");
    }
  };

  const handleToggleModulo = async (moduloId: string) => {
    const current = tenant.modulos_activos || [];
    const next = current.includes(moduloId)
      ? current.filter((m) => m !== moduloId)
      : [...current, moduloId];
    const ok = await actions.toggleModulo(tenant.id, next);
    if (ok) {
      refetch();
    }
  };

  const handleEnviarNotif = async () => {
    if (!notifForm.titulo || !notifForm.mensaje) return;
    const ok = await notifActions.enviarNotificacion({
      tenant_id: tenant.id,
      titulo: notifForm.titulo,
      mensaje: notifForm.mensaje,
      tipo: notifForm.tipo,
    });
    if (ok) {
      showToast("Notificacion enviada");
      setShowNotifModal(false);
      setNotifForm({ titulo: "", mensaje: "", tipo: "info" });
    }
  };

  const handleCrearBanner = async () => {
    if (!bannerForm.titulo) return;
    const ok = await bannerActions.crearBanner({
      tenant_id: tenant.id,
      titulo: bannerForm.titulo,
      descripcion: bannerForm.descripcion || null,
      imagen_url: null,
      activo: true,
      prioridad: bannerForm.prioridad,
    });
    if (ok) {
      showToast("Banner creado");
      setShowBannerModal(false);
      setBannerForm({ titulo: "", descripcion: "", prioridad: "normal" });
    }
  };

  return (
    <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
      <Toast message={toast} onClose={() => setToast("")} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition">
          <span className="material-symbols-outlined text-[18px] text-slate-600">arrow_back</span>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base lg:text-lg font-black text-slate-900 truncate">{tenant.nombre}</h2>
          <p className="text-[10px] text-slate-500 font-mono truncate">{APP_URLS.conductor}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${tenant.suscripcion_activa ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {tenant.pausado ? "Pausado" : tenant.suscripcion_activa ? "Activo" : "Inactivo"}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
            {tenant.plan}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition active:scale-95 ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: Info */}
      {activeTab === "info" && (
        <div className="space-y-3">
          {/* Datos personales */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Datos Personales</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Nombre</span>
                <p className="text-[13px] font-bold text-slate-900">{tenant.nombre}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Email</span>
                <p className="text-[13px] font-bold text-slate-900">{tenant.email || "-"}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Telefono</span>
                <p className="text-[13px] font-bold text-slate-900">{tenant.telefono || "-"}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium">App</span>
                <p className="text-[13px] font-bold text-blue-600 font-mono truncate">{APP_URLS.conductor}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Ciudad</span>
                <p className="text-[13px] font-bold text-slate-900">{tenant.ciudad || "-"}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Direccion</span>
                <p className="text-[13px] font-bold text-slate-900">{tenant.direccion || "-"}</p>
              </div>
            </div>
          </div>

          {/* Vehiculo */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Vehiculo</h3>
              <span className="material-symbols-outlined text-[20px] text-slate-400">{VEHICLE_ICONS[tenant.vehiculo_tipo || ""] || "directions_car"}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Tipo</span>
                <p className="text-[13px] font-bold text-slate-900 capitalize">{tenant.vehiculo_tipo || "-"}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Placa</span>
                <p className="text-[13px] font-bold text-slate-900 font-mono">{tenant.vehiculo_placa || "-"}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Modelo</span>
                <p className="text-[13px] font-bold text-slate-900">{tenant.vehiculo_modelo || "-"}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Color</span>
                <p className="text-[13px] font-bold text-slate-900">{tenant.vehiculo_color || "-"}</p>
              </div>
            </div>
          </div>

          {/* Estadisticas */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Estadisticas</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <span className="text-[20px] font-black text-slate-900 block">{tenant.calificacion?.toFixed(1) || "-"}</span>
                <span className="text-[10px] text-slate-500">Rating</span>
              </div>
              <div className="text-center">
                <span className="text-[20px] font-black text-slate-900 block">{tenant.total_clientes || 0}</span>
                <span className="text-[10px] text-slate-500">Clientes</span>
              </div>
              <div className="text-center">
                <span className="text-[20px] font-black text-slate-900 block">{tenant.total_carreras || 0}</span>
                <span className="text-[10px] text-slate-500">Carreras</span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowPauseModal(true)}
              className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold active:scale-95 transition border ${
                tenant.pausado
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-amber-50 text-amber-600 border-amber-200"
              }`}
            >
              {tenant.pausado ? "Reactivar" : "Pausar"}
            </button>
            <button
              onClick={() => setShowPlanModal(true)}
              className="flex-1 py-2.5 rounded-xl bg-blue-50 text-blue-600 text-[11px] font-bold border border-blue-200 active:scale-95 transition"
            >
              Cambiar Plan
            </button>
          </div>
          <button
            onClick={handleToggleActivo}
            className={`w-full py-3 rounded-xl text-[12px] font-bold active:scale-95 transition text-white ${
              tenant.suscripcion_activa ? "bg-red-500" : "bg-emerald-600"
            }`}
          >
            {tenant.suscripcion_activa ? "Desactivar conductor" : "Activar conductor"}
          </button>
        </div>
      )}

      {/* TAB: Clientes y Carreras */}
      {activeTab === "clientes" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
              <span className="text-[24px] font-black text-slate-900 block">{tenant.total_clientes || 0}</span>
              <span className="text-[10px] text-slate-500">Clientes Suscritos</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
              <span className="text-[24px] font-black text-slate-900 block">{tenant.total_carreras || 0}</span>
              <span className="text-[10px] text-slate-500">Total Carreras</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Carreras Recientes</h3>
            {carrerasRecientes.length === 0 ? (
              <p className="text-[12px] text-slate-400 text-center py-4">Sin carreras aun</p>
            ) : (
              <div className="space-y-2">
                {carrerasRecientes.slice(0, 10).map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-900 truncate">{c.origen_direccion || "Sin origen"} → {c.destino_direccion || "Sin destino"}</p>
                      <p className="text-[10px] text-slate-500">{c.distancia_km ? `${c.distancia_km} km` : "-"} · {c.precio ? `$${c.precio}` : "-"}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex-shrink-0 ml-2 ${
                      c.estado === "completada" ? "bg-emerald-100 text-emerald-700" :
                      c.estado === "cancelada" ? "bg-red-100 text-red-600" :
                      c.estado === "en_curso" ? "bg-blue-100 text-blue-600" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {c.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Pagos */}
      {activeTab === "pagos" && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Estado de Suscripcion</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Plan Actual</span>
                <p className="text-[16px] font-black text-blue-600 uppercase">{tenant.plan}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Vencimiento</span>
                <p className="text-[13px] font-bold text-slate-900">
                  {tenant.fecha_vencimiento
                    ? new Date(tenant.fecha_vencimiento).toLocaleDateString("es-VE")
                    : "-"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Estado</span>
                <p className={`text-[13px] font-bold ${tenant.suscripcion_activa ? "text-emerald-600" : "text-red-500"}`}>
                  {tenant.suscripcion_activa ? "Activa" : "Inactiva"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Cuenta mensual</span>
                <p className="text-[13px] font-bold text-slate-900">
                  {cuentaReferidos
                    ? cuentaReferidos.es_gratis
                      ? "GRATIS"
                      : `$${cuentaReferidos.total_mensual.toFixed(2)}/mes`
                    : `$${precioPlanActual.toFixed(2)}/mes`}
                </p>
              </div>
            </div>
          </div>

          {cuentaReferidos && (
            <div className="bg-white rounded-2xl p-4 border border-amber-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Descuento por referidos</h3>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase text-amber-700">
                  {cuentaReferidos.referidos_activos} activos
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Precio del plan</span>
                  <p className="font-bold text-slate-900">${cuentaReferidos.precio_plan.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Descuento ({cuentaReferidos.descuento_pct}%)</span>
                  <p className="font-bold text-emerald-600">-${cuentaReferidos.monto_descuento.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Cuenta del mes</span>
                  <p className="font-black text-purple-700">
                    {cuentaReferidos.es_gratis ? "GRATIS" : `$${cuentaReferidos.total_mensual.toFixed(2)}`}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Estado</span>
                  <p className="font-bold text-slate-900">
                    {cuentaReferidos.es_socio ? "Socio Drivip" : "Conductor"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setPagoForm((prev) => ({
                ...prev,
                monto: String(precioPlanActual),
              }));
              setShowPagoModal(true);
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[12px] font-bold active:scale-95 transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            Validar pago y activar
          </button>
        </div>
      )}

      {/* TAB: Modulos */}
      {activeTab === "modulos" && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Modulos Activos</h3>
            <p className="text-[10px] text-slate-500 mb-4">Activa o desactiva modulos individuales para este conductor</p>
            <div className="space-y-2">
              {ALL_MODULES.map((mod) => {
                const active = (tenant.modulos_activos || []).includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => handleToggleModulo(mod.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition active:scale-[0.98] ${
                      active
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-slate-50 border border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`material-symbols-outlined text-[18px] ${active ? "text-blue-600" : "text-slate-400"}`}>{mod.icon}</span>
                      <span className={`text-[12px] font-bold ${active ? "text-blue-900" : "text-slate-500"}`}>{mod.label}</span>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors ${active ? "bg-blue-600" : "bg-slate-300"}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${active ? "translate-x-[1.125rem]" : "translate-x-[0.125rem]"}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Promociones */}
      {activeTab === "promociones" && (
        <div className="space-y-3">
          {/* Banners */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Banners Individuales</h3>
              <button onClick={() => setShowBannerModal(true)} className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[10px] font-bold active:scale-95 transition">
                + Nuevo
              </button>
            </div>
            {bannerActions.banners.length === 0 ? (
              <p className="text-[12px] text-slate-400 text-center py-3">Sin banners</p>
            ) : (
              <div className="space-y-2">
                {bannerActions.banners.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-slate-900 truncate">{b.titulo}</p>
                      <p className="text-[10px] text-slate-500">{b.prioridad} · {b.activo ? "Activo" : "Inactivo"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => bannerActions.toggleBanner(b.id, !b.activo)} className={`w-9 h-5 rounded-full transition-colors ${b.activo ? "bg-blue-600" : "bg-slate-300"}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${b.activo ? "translate-x-[1.125rem]" : "translate-x-[0.125rem]"}`} />
                      </button>
                      <button onClick={() => bannerActions.eliminarBanner(b.id)} className="text-red-400 hover:text-red-600">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notificaciones */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notificaciones</h3>
              <button onClick={() => setShowNotifModal(true)} className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[10px] font-bold active:scale-95 transition">
                + Enviar
              </button>
            </div>
            {notifActions.notificaciones.length === 0 ? (
              <p className="text-[12px] text-slate-400 text-center py-3">Sin notificaciones</p>
            ) : (
              <div className="space-y-2">
                {notifActions.notificaciones.slice(0, 10).map((n) => (
                  <div key={n.id} className="p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-bold text-slate-900">{n.titulo}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        n.tipo === "promocion" ? "bg-purple-100 text-purple-600" :
                        n.tipo === "alerta" ? "bg-amber-100 text-amber-600" :
                        n.tipo === "sistema" ? "bg-blue-100 text-blue-600" :
                        "bg-slate-100 text-slate-500"
                      }`}>{n.tipo}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{n.mensaje}</p>
                    <p className="text-[9px] text-slate-400 mt-1">{n.enviada_at ? new Date(n.enviada_at).toLocaleString("es-VE") : "Pendiente"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Monitoreo */}
      {activeTab === "monitoreo" && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Estado del Conductor</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Estado</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-2 h-2 rounded-full ${tenant.pausado ? "bg-amber-400" : tenant.suscripcion_activa ? "bg-emerald-400" : "bg-red-400"}`} />
                  <span className="text-[12px] font-bold text-slate-900">{tenant.pausado ? "Pausado" : tenant.suscripcion_activa ? "Activo" : "Inactivo"}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium">Ultima conexion</span>
                <p className="text-[12px] font-bold text-slate-900 mt-1">{new Date(tenant.updated_at).toLocaleString("es-VE")}</p>
              </div>
            </div>
            {tenant.pausado && tenant.pausado_motivo && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] text-amber-600 font-bold">Motivo de pausa:</span>
                <p className="text-[12px] text-amber-800 mt-0.5">{tenant.pausado_motivo}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Actividad Reciente</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 py-1.5">
                <span className="material-symbols-outlined text-[16px] text-blue-500">local_taxi</span>
                <span className="text-[11px] text-slate-700">{carrerasRecientes.length} carreras en historial</span>
              </div>
              <div className="flex items-center gap-2 py-1.5">
                <span className="material-symbols-outlined text-[16px] text-purple-500">extension</span>
                <span className="text-[11px] text-slate-700">{plugins.filter((p) => p.activo).length} plugins activos</span>
              </div>
              <div className="flex items-center gap-2 py-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-500">campaign</span>
                <span className="text-[11px] text-slate-700">{bannerActions.banners.filter((b) => b.activo).length} banners activos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pausar */}
      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowPauseModal(false)}>
          <div className="bg-white rounded-t-2xl lg:rounded-2xl w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-900">{tenant.pausado ? "Reactivar Conductor" : "Pausar Conductor"}</h3>
            {!tenant.pausado && (
              <textarea
                value={pauseMotivo}
                onChange={(e) => setPauseMotivo(e.target.value)}
                placeholder="Motivo de pausa (opcional)"
                className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[12px] text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-20"
              />
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowPauseModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold active:scale-95 transition">Cancelar</button>
              <button onClick={handleTogglePausa} className={`flex-1 py-2.5 rounded-xl text-white text-[11px] font-bold active:scale-95 transition ${tenant.pausado ? "bg-emerald-600" : "bg-amber-500"}`}>
                {tenant.pausado ? "Reactivar" : "Pausar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cambiar Plan */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowPlanModal(false)}>
          <div className="bg-white rounded-t-2xl lg:rounded-2xl w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-900">Cambiar Plan</h3>
            {[
              { id: "estandar", label: "Estándar", desc: "Funciones básicas" },
              { id: "profesional", label: "Profesional", desc: "Más viajes y visibilidad" },
              { id: "premium", label: "Premium", desc: "Todo incluido + Soporte" },
            ].map((plan) => (
              <button
                key={plan.id}
                onClick={() => handleCambiarPlan(plan.id)}
                className={`w-full p-3 rounded-xl text-left transition active:scale-[0.98] ${
                  tenant.plan === plan.id
                    ? "bg-blue-50 border-2 border-blue-500"
                    : "bg-slate-50 border border-slate-200"
                }`}
              >
                <span className="text-[13px] font-bold text-slate-900">{plan.label}</span>
                <span className="text-[10px] text-slate-500 block">
                  ${(preciosPlan[plan.id] ?? preciosPlan.estandar).toFixed(2)}/mes · {plan.desc}
                </span>
              </button>
            ))}
            <button onClick={() => setShowPlanModal(false)} className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold active:scale-95 transition">Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal: Registrar Pago */}
      {showPagoModal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowPagoModal(false)}>
          <div className="bg-white rounded-t-2xl lg:rounded-2xl w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-900">Registrar pago de suscripcion</h3>
            <p className="text-[11px] text-slate-500 -mt-2">Al guardar, el conductor queda activo y con vencimiento renovado.</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monto</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pagoForm.monto}
                  onChange={(e) => setPagoForm((f) => ({ ...f, monto: e.target.value }))}
                  className="w-full mt-1 bg-slate-50 rounded-xl px-3 py-2.5 text-[12px] text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Moneda</label>
                <select
                  value={pagoForm.moneda}
                  onChange={(e) => setPagoForm((f) => ({ ...f, moneda: e.target.value }))}
                  className="w-full mt-1 bg-slate-50 rounded-xl px-3 py-2.5 text-[12px] text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="VES">VES</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Metodo de pago</label>
              <div className="flex gap-2 mt-1">
                {([
                  { id: "pago_movil", label: "Pago Movil" },
                  { id: "transferencia", label: "Transferencia" },
                  { id: "efectivo", label: "Efectivo" },
                ] as const).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPagoForm((f) => ({ ...f, metodo_pago: m.id }))}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition active:scale-95 ${
                      pagoForm.metodo_pago === m.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Referencia</label>
                <input
                  value={pagoForm.referencia}
                  onChange={(e) => setPagoForm((f) => ({ ...f, referencia: e.target.value }))}
                  placeholder="Ej: 441920"
                  className="w-full mt-1 bg-slate-50 rounded-xl px-3 py-2.5 text-[12px] text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Meses</label>
                <input
                  type="number"
                  min="1"
                  value={pagoForm.meses}
                  onChange={(e) => setPagoForm((f) => ({ ...f, meses: e.target.value }))}
                  className="w-full mt-1 bg-slate-50 rounded-xl px-3 py-2.5 text-[12px] text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowPagoModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold active:scale-95 transition">Cancelar</button>
              <button onClick={handleRegistrarPago} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold active:scale-95 transition">Guardar y activar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Enviar Notificacion */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowNotifModal(false)}>
          <div className="bg-white rounded-t-2xl lg:rounded-2xl w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-900">Enviar Notificacion</h3>
            <input
              value={notifForm.titulo}
              onChange={(e) => setNotifForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Titulo"
              className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-[12px] text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <textarea
              value={notifForm.mensaje}
              onChange={(e) => setNotifForm((f) => ({ ...f, mensaje: e.target.value }))}
              placeholder="Mensaje"
              className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[12px] text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-20"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowNotifModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold active:scale-95 transition">Cancelar</button>
              <button onClick={handleEnviarNotif} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-[11px] font-bold active:scale-95 transition">Enviar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear Banner */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowBannerModal(false)}>
          <div className="bg-white rounded-t-2xl lg:rounded-2xl w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-900">Crear Banner</h3>
            <input
              value={bannerForm.titulo}
              onChange={(e) => setBannerForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Titulo del banner"
              className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-[12px] text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <textarea
              value={bannerForm.descripcion}
              onChange={(e) => setBannerForm((f) => ({ ...f, descripcion: e.target.value }))}
              placeholder="Descripcion (opcional)"
              className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[12px] text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-16"
            />
            <div className="flex gap-2">
              {(["baja", "normal", "alta"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setBannerForm((f) => ({ ...f, prioridad: p }))}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition active:scale-95 ${
                    bannerForm.prioridad === p
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowBannerModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold active:scale-95 transition">Cancelar</button>
              <button onClick={handleCrearBanner} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-[11px] font-bold active:scale-95 transition">Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
