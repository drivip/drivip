"use client";

import { useState, useMemo } from "react";
import { tenantsData, tenantStats } from "@/mockData/tenantsData";
import { cn, getInitials } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import SearchInput from "@/components/ui/SearchInput";
import FilterPills from "@/components/ui/FilterPills";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import RenewModal from "./RenewModal";

type TenantListTableProps = {
  onSelectTenant: (tenant: any) => void;
};

const filterOptions = [
  { id: "all", label: "Todos", count: tenantStats.totalTenants },
  { id: "LINEA", label: "Linea de Taxi", count: tenantStats.breakdown.linea },
  { id: "INDEPENDIENTE", label: "Independiente", count: tenantStats.breakdown.independiente },
  { id: "DELIVERY", label: "Comercio/Delivery", count: tenantStats.breakdown.delivery },
];

export default function TenantListTable({ onSelectTenant }: TenantListTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [renewTenant, setRenewTenant] = useState<any>(null);

  const filteredTenants = useMemo(() => {
    return tenantsData.filter((t) => {
      const matchesFilter = activeFilter === "all" || t.type === activeFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.rif.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.businessName && t.businessName.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [searchQuery, activeFilter]);

  const typeBadge = (type: string) => {
    switch (type) {
      case "LINEA":
        return <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary font-[family-name:var(--font-geist-mono)] text-[9px] uppercase font-bold tracking-wider">LINEA TAXI</span>;
      case "INDEPENDIENTE":
        return <span className="px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-[family-name:var(--font-geist-mono)] text-[9px] uppercase font-bold">INDEPENDIENTE</span>;
      case "DELIVERY":
        return <span className="px-2 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary font-[family-name:var(--font-geist-mono)] text-[9px] uppercase font-bold">COMERCIO</span>;
      default:
        return null;
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <Toast message={toastMsg} visible={toastVisible} onDismiss={() => setToastVisible(false)} />

      {/* Top Metrics Bento */}
      <div className="grid grid-cols-1 gap-3">
        {/* MRR Card */}
        <div className="bg-surface-container rounded-xl p-4 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">payments</span>
              <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant uppercase">Monthly Recurring Revenue</span>
            </div>
            <div className="flex items-center gap-1 bg-secondary/10 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[14px] text-secondary">trending_up</span>
              <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-secondary font-semibold">+{tenantStats.mrrGrowth}%</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <div>
              <span className="font-[family-name:var(--font-space-grotesk)] text-[28px] text-on-surface font-bold tracking-tight">
                ${tenantStats.mrr.toLocaleString()}
              </span>
              <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant ml-1">USD/mo</span>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-container-high px-2.5 py-1 rounded-lg">
              <span className="material-symbols-outlined text-[15px] text-secondary">local_taxi</span>
              <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface font-semibold">{tenantStats.totalDrivers.toLocaleString()} Drivers</span>
            </div>
          </div>
        </div>

        {/* Tenants Breakdown */}
        <div className="bg-surface-container rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">apartment</span>
              <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant uppercase">Choferes Registrados</span>
            </div>
            <span className="font-[family-name:var(--font-space-grotesk)] text-[20px] text-on-surface font-bold">{tenantStats.totalTenants}</span>
          </div>
          {/* Segmented Bar */}
          <div className="h-2 w-full bg-surface-container-highest rounded-full flex overflow-hidden gap-0.5 mb-2">
            <div className="bg-secondary h-full rounded-full" style={{ width: `${(tenantStats.activeTenants / tenantStats.totalTenants) * 100}%` }} />
            <div className="bg-error h-full rounded-full" style={{ width: `${(tenantStats.overdueTenants / tenantStats.totalTenants) * 100}%` }} />
            <div className="bg-tertiary h-full rounded-full" style={{ width: `${(tenantStats.warningTenants / tenantStats.totalTenants) * 100}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div className="flex items-center gap-1 bg-surface-container-high/60 px-2 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-secondary">{tenantStats.activeTenants} Activos</span>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-high/60 px-2 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-error" />
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-error">{tenantStats.overdueTenants} Vencidos</span>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-high/60 px-2 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-tertiary">{tenantStats.warningTenants} Alerta</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating CTA Banner */}
      <button
        onClick={() => {
          setToastMsg("Funcionalidad de alta rápida — Próximamente");
          setToastVisible(true);
        }}
        className="w-full py-3.5 px-4 rounded-xl bg-surface-container/50 hover:bg-surface-container border-2 border-dashed border-primary/40 hover:border-primary text-primary flex items-center justify-center gap-3 group transition-all"
      >
        <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">add_circle</span>
        <div className="flex flex-col items-start">
          <span className="font-[family-name:var(--font-geist-mono)] text-[12px] font-semibold tracking-wide">Nuevo Cliente SaaS</span>
          <span className="font-[family-name:var(--font-geist-mono)] text-[9px] text-primary/70 uppercase">Alta Rápida</span>
        </div>
        <span className="material-symbols-outlined text-[16px] text-primary/50">arrow_forward</span>
      </button>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3">
        <SearchInput
          placeholder="Buscar por Nombre, Cedula/RIF o Slug..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <FilterPills
          options={filterOptions}
          activeId={activeFilter}
          onChange={setActiveFilter}
        />
      </div>

      {/* Tenant Cards */}
      <div className="flex flex-col gap-4 pb-20 lg:pb-4">
        {filteredTenants.map((tenant) => (
          <div
            key={tenant.id}
            className="bg-surface-container rounded-xl overflow-hidden shadow-md"
          >
            <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary" />
            <div className="p-4 space-y-3">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {tenant.type === "DELIVERY" ? (
                      <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-tertiary">
                        <span className="material-symbols-outlined text-[24px]">lunch_dining</span>
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-primary-container/20 flex items-center justify-center">
                        <span className="font-[family-name:var(--font-space-grotesk)] text-[14px] font-bold text-primary">
                          {getInitials(tenant.businessName || tenant.name)}
                        </span>
                      </div>
                    )}
                    <span
                      className={cn(
                        "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center",
                        tenant.contract.status === "ACTIVE"
                          ? "bg-secondary"
                          : tenant.contract.status === "PAST_DUE"
                            ? "bg-error"
                            : tenant.contract.status === "WARNING"
                              ? "bg-tertiary"
                              : "bg-outline"
                      )}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-[family-name:var(--font-space-grotesk)] text-[15px] text-on-surface font-semibold truncate">
                        {tenant.businessName || tenant.name}
                      </h3>
                      {typeBadge(tenant.type)}
                    </div>
                    <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary flex items-center gap-1 truncate">
                      <span className="material-symbols-outlined text-[12px]">link</span>
                      drivip.app/{tenant.slug}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={
                    tenant.contract.status === "ACTIVE"
                      ? "active"
                      : tenant.contract.status === "PAST_DUE"
                        ? "overdue"
                        : tenant.contract.status === "WARNING"
                          ? "warning"
                          : "offline"
                  }
                >
                  {tenant.contract.status === "ACTIVE"
                    ? "ACTIVO"
                    : tenant.contract.status === "PAST_DUE"
                      ? "VENCIDO"
                      : tenant.contract.status === "WARNING"
                        ? "POR VENCER"
                        : "SUSPENDIDO"}
                </Badge>
              </div>

              {/* Telemetry Strip */}
              <div className="grid grid-cols-3 gap-2 bg-surface-container-high/50 p-2.5 rounded-xl">
                <div className="flex flex-col">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">RIF Fiscal</span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-on-surface">{tenant.rif}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">
                    {tenant.fleet ? "Flota Activa" : "Vehiculo"}
                  </span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-secondary">
                    {tenant.fleet ? `${tenant.fleet.total} Unidades` : tenant.vehicle?.model || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">Mensual</span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-on-surface font-bold">${tenant.contract.monthlyFee}</span>
                </div>
              </div>

              {/* Overdue Warning Banner */}
              {tenant.contract.status === "PAST_DUE" && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-error-container/20">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-error">warning</span>
                    <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-error font-medium">
                      Pago pendiente hace {tenant.contract.daysOverdue} dias
                    </span>
                  </div>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-error font-bold">
                    ${tenant.contract.monthlyFee}/mes
                  </span>
                </div>
              )}

              {/* Vehicle Details for Independiente */}
              {tenant.type === "INDEPENDIENTE" && tenant.vehicle && (
                <div className="grid grid-cols-2 gap-2 bg-surface-container-high/40 p-2.5 rounded-lg">
                  <div>
                    <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase block">Vehiculo</span>
                    <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface font-medium">
                      {tenant.vehicle.model} {tenant.vehicle.year}
                    </span>
                    <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant block">
                      Placa: {tenant.vehicle.plate}
                    </span>
                  </div>
                  <div>
                    <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase block">Color</span>
                    <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface">
                      {tenant.vehicle.color}
                    </span>
                  </div>
                </div>
              )}

              {/* Modules */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                    Modulos SaaS
                  </span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-secondary font-medium">
                    {Object.values(tenant.plugins).filter(Boolean).length} de {Object.keys(tenant.plugins).length} Habilitados
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {Object.entries(tenant.plugins).map(([key, enabled]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 rounded-lg bg-surface-container-high"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn("material-symbols-outlined text-[16px]", enabled ? "text-primary" : "text-on-surface-variant")}>
                          {key === "DISPATCH" ? "hub" : key === "REFERRALS" ? "share" : key === "DELIVERY" ? "storefront" : "dns"}
                        </span>
                        <span className={cn("font-[family-name:var(--font-geist-sans)] text-[12px]", enabled ? "text-on-surface" : "text-on-surface-variant")}>
                          {key === "DISPATCH" ? "Despacho Multi-Chofer" : key === "REFERRALS" ? "Red de Referidos" : key === "DELIVERY" ? "Módulo Delivery" : "Dominio Personalizado"}
                        </span>
                      </div>
                      <span className="font-[family-name:var(--font-geist-mono)] text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">
                        {enabled ? "ON" : "OFF"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action CTAs */}
              <div className={cn("grid gap-3 pt-1", tenant.contract.status === "PAST_DUE" || tenant.type === "DELIVERY" ? "grid-cols-2" : "grid-cols-2")}>
                <Button
                  variant="primary"
                  onClick={() => onSelectTenant(tenant)}
                  className="shadow-md shadow-primary-container/20"
                >
                  <span className="material-symbols-outlined text-[16px]">contact_page</span>
                  Ficha 360
                </Button>
                {tenant.contract.status === "PAST_DUE" ? (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setRenewTenant(tenant);
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px]">replay</span>
                    Reactivar
                  </Button>
                ) : tenant.type === "DELIVERY" ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setToastMsg(`Auditoría de delivery — ${tenant.businessName || tenant.name}`);
                      setToastVisible(true);
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                    Auditar
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setToastMsg(`Clave reseteada para ${tenant.name}`);
                      setToastVisible(true);
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">vpn_key</span>
                    Reset Clave
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <RenewModal tenant={renewTenant} open={!!renewTenant} onClose={() => setRenewTenant(null)} />
    </div>
  );
}
