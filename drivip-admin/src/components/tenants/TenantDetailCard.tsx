"use client";

import { useState } from "react";
import { cn, getInitials, formatCurrency, formatDateShort } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import ProgressBar from "@/components/ui/ProgressBar";

type TenantDetailCardProps = {
  tenant: any;
  onBack: () => void;
};

export default function TenantDetailCard({ tenant, onBack }: TenantDetailCardProps) {
  const [plugins, setPlugins] = useState(tenant.plugins);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const activeCount = Object.values(plugins).filter(Boolean).length;
  const totalCount = Object.keys(plugins).length;

  const handleToggle = (pluginKey: string) => {
    setPlugins((prev: any) => ({
      ...prev,
      [pluginKey]: !prev[pluginKey],
    }));
    setToastMsg(!plugins[pluginKey] ? "Modulo Activado" : "Modulo Desactivado");
    setToastVisible(true);
  };

  const copySlug = () => {
    navigator.clipboard.writeText(`https://drivip.app/${tenant.slug}`);
    setToastMsg("Slug copiado al portapapeles");
    setToastVisible(true);
  };

  const pluginLabels: Record<string, { name: string; icon: string }> = {
    DISPATCH: { name: "Central de Despacho Multi-Chofer", icon: "alt_route" },
    REFERRALS: { name: "Red de Referidos & Pasaje", icon: "share_location" },
    DELIVERY: { name: "Módulo Delivery", icon: "inventory_2" },
    CUSTOM_DOMAIN: { name: "Dominio Propio / Marca Blanca", icon: "dns" },
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-24 lg:pb-4">
      <Toast message={toastMsg} visible={toastVisible} onDismiss={() => setToastVisible(false)} />

      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-primary hover:text-on-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        <span className="font-[family-name:var(--font-geist-mono)] text-[11px] font-semibold">Volver a lista</span>
      </button>

      {/* 1. Top Tenant Header */}
      <div className="bg-surface-container p-4 rounded-xl shadow-md relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary-container/10 blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-primary-container/20 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.35)]">
              <span className="font-[family-name:var(--font-space-grotesk)] text-[18px] text-primary font-bold tracking-tight">
                {getInitials(tenant.businessName || tenant.name)}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-[family-name:var(--font-space-grotesk)] text-[18px] text-on-surface truncate font-semibold">
                  {tenant.businessName || tenant.name}
                </h1>
                <span className="material-symbols-outlined text-secondary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </div>
              <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-primary">
                  {tenant.type === "LINEA" ? "local_taxi" : tenant.type === "DELIVERY" ? "local_shipping" : "two_wheeler"}
                </span>
                {tenant.businessName || tenant.name}
              </span>
              <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-outline">
                Tipo: {tenant.type === "LINEA" ? "Linea de Taxi / Mototaxi (LINE)" : tenant.type === "DELIVERY" ? "Chofer con Delivery" : "Chofer Independiente (INDEP)"}
              </span>
            </div>
          </div>
        </div>

        {/* Slug & Cedula */}
        <div className="grid grid-cols-1 gap-2 pt-3 relative z-10">
          <div className="bg-surface-container-low px-3 py-2 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-primary text-[16px]">link</span>
              <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface truncate">
                drivip.app/{tenant.slug}
              </span>
            </div>
            <button
              onClick={copySlug}
              className="p-1.5 rounded bg-surface-variant hover:bg-surface-bright text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
            </button>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 bg-surface-container-low rounded-lg font-[family-name:var(--font-geist-mono)] text-[11px]">
            <span className="text-outline uppercase">Cedula / RIF</span>
            <span className="text-on-surface">{tenant.rif}</span>
          </div>
        </div>

        {/* Reset Password Button */}
        <button
          onClick={() => {
            setToastMsg(`Enlace de reseteo enviado a ${tenant.name}`);
            setToastVisible(true);
          }}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-tertiary-container/20 text-tertiary hover:bg-tertiary-container/30 transition-all flex items-center justify-center gap-2 font-[family-name:var(--font-geist-mono)] text-[11px] font-semibold"
        >
          <span className="material-symbols-outlined text-[18px]">key</span>
          <span>Resetear Clave de Acceso</span>
        </button>
      </div>

      {/* 2. Status & Contract Card */}
      <div className="bg-surface-container p-4 rounded-xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase text-on-surface-variant tracking-wider">
            Estado de Contrato
          </span>
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
              ? "ACTIVO / AL DIA"
              : tenant.contract.status === "PAST_DUE"
                ? "VENCIDO"
                : tenant.contract.status === "WARNING"
                  ? "POR VENCER"
                  : "SUSPENDIDO"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-container-low p-3 rounded-lg flex flex-col">
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-outline">Tarifa Mensual</span>
            <span className="font-[family-name:var(--font-space-grotesk)] text-[20px] text-on-surface font-bold mt-1">
              {formatCurrency(tenant.contract.monthlyFee)}
            </span>
            <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-primary">
              {tenant.fleet ? "Flota Enterprise" : "Plan Individual"}
            </span>
          </div>
          <div className="bg-surface-container-low p-3 rounded-lg flex flex-col justify-between">
            <div>
              <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-outline">Prox. Facturacion</span>
              <span className="font-[family-name:var(--font-space-grotesk)] text-[16px] text-on-surface font-semibold block mt-1">
                {formatDateShort(tenant.contract.endDate)}
              </span>
            </div>
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant">Ciclo mensual</span>
          </div>
        </div>

        {tenant.contract.paymentMethod && (
          <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg font-[family-name:var(--font-geist-sans)] text-[12px]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">account_balance_wallet</span>
              <span className="text-on-surface font-medium">Metodo de Pago</span>
            </div>
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant">{tenant.contract.paymentMethod}</span>
          </div>
        )}
      </div>

      {/* 3. Contact & HQ Information */}
      <div className="bg-surface-container p-4 rounded-xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase text-on-surface-variant tracking-wider">
            Contacto & Sede Operativa
          </span>
          <span className="material-symbols-outlined text-primary text-[18px]">business</span>
        </div>
        <div className="space-y-2">
          {/* Email */}
          <a
            href={`mailto:${tenant.email}`}
            className="flex items-center justify-between p-3 bg-surface-container-low hover:bg-surface-container-high rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-outline group-hover:text-primary text-[18px]">alternate_email</span>
              <span className="font-[family-name:var(--font-geist-sans)] text-[14px] text-on-surface truncate">{tenant.email}</span>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
          </a>
          {/* Phone */}
          <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-secondary text-[18px]">call</span>
              <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-on-surface">{tenant.phone}</span>
            </div>
            <div className="flex items-center gap-1">
              <a
                href={`https://wa.me/${tenant.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                className="px-2.5 py-1 rounded bg-secondary-container/20 text-secondary hover:bg-secondary-container/30 transition-colors font-[family-name:var(--font-geist-mono)] text-[11px] font-semibold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">chat</span>
                WhatsApp
              </a>
              <a
                href={`tel:${tenant.phone}`}
                className="p-1.5 rounded bg-surface-variant hover:bg-surface-bright text-on-surface flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[16px]">phone_enabled</span>
              </a>
            </div>
          </div>
          {/* Address */}
          <div className="p-3 bg-surface-container-low rounded-lg flex items-start gap-2">
            <span className="material-symbols-outlined text-outline text-[18px] mt-0.5">location_on</span>
            <div className="flex flex-col">
              <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-outline uppercase">Sede Central</span>
              <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface mt-0.5 leading-snug">
                {tenant.address}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Fleet & Vehicle Register */}
      {tenant.fleet && (
        <div className="bg-surface-container p-4 rounded-xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase text-on-surface-variant tracking-wider block">
                Ficha de Flota Operativa
              </span>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-[16px] text-on-surface font-semibold">
                {tenant.fleet.total} Unidades Activas
              </h2>
            </div>
            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">swap_driving_apps</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {tenant.fleet.sedans && (
              <div className="bg-surface-container-low p-3 rounded-lg flex items-center gap-2">
                <div className="p-2 rounded bg-surface-variant text-on-surface flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">directions_car</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-[family-name:var(--font-space-grotesk)] text-[16px] text-on-surface font-bold">{tenant.fleet.sedans}</span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant">Sedanes / Autos</span>
                </div>
              </div>
            )}
            {tenant.fleet.mototaxis && (
              <div className="bg-surface-container-low p-3 rounded-lg flex items-center gap-2">
                <div className="p-2 rounded bg-surface-variant text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">two_wheeler</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-[family-name:var(--font-space-grotesk)] text-[16px] text-on-surface font-bold">{tenant.fleet.mototaxis}</span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant">Mototaxis Express</span>
                </div>
              </div>
            )}
            {tenant.fleet.riders && (
              <div className="bg-surface-container-low p-3 rounded-lg flex items-center gap-2 col-span-2">
                <div className="p-2 rounded bg-surface-variant text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">two_wheeler</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-[family-name:var(--font-space-grotesk)] text-[16px] text-on-surface font-bold">{tenant.fleet.riders}</span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant">{tenant.fleet.type}</span>
                </div>
              </div>
            )}
          </div>
          {tenant.fleet.flagshipModel && (
            <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between font-[family-name:var(--font-geist-sans)] text-[12px]">
              <span className="text-outline">Modelo insignia:</span>
              <span className="font-[family-name:var(--font-geist-mono)] text-on-surface font-medium">{tenant.fleet.flagshipModel}</span>
            </div>
          )}
        </div>
      )}

      {/* 5. Vehicle Technical Form (for Independiente) */}
      {tenant.type === "INDEPENDIENTE" && tenant.vehicle && (
        <div className="bg-surface-container p-4 rounded-xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase text-on-surface-variant tracking-wider">
              Ficha Tecnica del Vehiculo
            </span>
            <span className="material-symbols-outlined text-primary text-[18px]">directions_car</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-surface-container-low">
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase block">Placa</span>
              <span className="font-[family-name:var(--font-geist-mono)] text-[13px] text-on-surface font-bold">{tenant.vehicle.plate}</span>
            </div>
            <div className="p-2 rounded-lg bg-surface-container-low">
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase block">Modelo</span>
              <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface">{tenant.vehicle.model}</span>
            </div>
            <div className="p-2 rounded-lg bg-surface-container-low">
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase block">Ano</span>
              <span className="font-[family-name:var(--font-geist-mono)] text-[13px] text-on-surface">{tenant.vehicle.year}</span>
            </div>
            <div className="p-2 rounded-lg bg-surface-container-low">
              <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase block">Color</span>
              <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface">{tenant.vehicle.color}</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Active Modules & Plugins Manager */}
      <div className="bg-surface-container p-4 rounded-xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase text-on-surface-variant tracking-wider block">
              Modulos & Addons
            </span>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-[16px] text-on-surface font-semibold">
              Configuracion SaaS
            </h2>
          </div>
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary bg-primary-container/20 px-2 py-0.5 rounded-full font-bold">
            {activeCount} / {totalCount} ON
          </span>
        </div>
        <div className="space-y-2">
          {Object.entries(plugins).map(([key, enabled]) => (
            <div key={key} className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <div className={cn("p-2 rounded", enabled ? "bg-surface-variant text-primary" : "bg-surface-variant text-outline")}>
                  <span className="material-symbols-outlined text-[18px]">{pluginLabels[key]?.icon || "extension"}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-[family-name:var(--font-geist-sans)] text-[14px] text-on-surface font-medium truncate">
                    {pluginLabels[key]?.name || key}
                  </span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-outline">PLUGIN: {key}</span>
                </div>
              </div>
              <ToggleSwitch checked={enabled as boolean} onChange={() => handleToggle(key)} />
            </div>
          ))}
        </div>
      </div>

      {/* 7. Quick Audit Log */}
      {tenant.auditLog && tenant.auditLog.length > 0 && (
        <div className="bg-surface-container p-4 rounded-xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase text-on-surface-variant tracking-wider">
              Log de Auditoria Rapido
            </span>
            <span className="material-symbols-outlined text-outline text-[18px]">security</span>
          </div>
          <div className="space-y-2">
            {tenant.auditLog.map((entry: any, i: number) => (
              <div key={i} className="p-3 bg-surface-container-low rounded-lg flex items-start gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    entry.type === "success"
                      ? "bg-secondary"
                      : entry.type === "error"
                        ? "bg-error"
                        : entry.type === "warning"
                          ? "bg-tertiary"
                          : "bg-primary"
                  )}
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface font-medium">
                    {entry.event}
                  </span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-outline">{entry.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Quick Command Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="secondary"
          className="flex-1 py-3"
          onClick={() => {
            setToastMsg(`Chofer ${tenant.name} suspendido`);
            setToastVisible(true);
          }}
        >
          <span className="material-symbols-outlined text-[18px]">pause_circle</span>
          Suspender Chofer
        </Button>
        <Button
          variant="primary"
          className="flex-1 py-3 shadow-[0_0_16px_rgba(124,58,237,0.4)]"
          onClick={() => {
            setToastMsg("Cambios guardados exitosamente");
            setToastVisible(true);
          }}
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
