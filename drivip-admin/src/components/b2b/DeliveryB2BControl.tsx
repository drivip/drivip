"use client";

import { useState, useMemo } from "react";
import { deliveryPluginConfig, choferesWithDelivery, deliveryStats, planLimits } from "@/mockData/b2bData";
import { cn } from "@/lib/utils";
import SearchInput from "@/components/ui/SearchInput";
import FilterPills from "@/components/ui/FilterPills";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";

export default function DeliveryB2BControl() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [pluginEnabled, setPluginEnabled] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const filterOptions = [
    { id: "all", label: "Todos", count: choferesWithDelivery.length },
    { id: "active", label: "Activos", count: choferesWithDelivery.filter((c) => c.deliveryEnabled).length },
    { id: "inactive", label: "Inactivos", count: choferesWithDelivery.filter((c) => !c.deliveryEnabled).length },
    { id: "debt", label: "Con Deuda", count: choferesWithDelivery.filter((c) => c.deudaPendiente > 0).length },
  ];

  const filteredChoferes = useMemo(() => {
    return choferesWithDelivery.filter((c) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "active" && c.deliveryEnabled) ||
        (activeFilter === "inactive" && !c.deliveryEnabled) ||
        (activeFilter === "debt" && c.deudaPendiente > 0);
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.rif.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.businessName && c.businessName.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [searchQuery, activeFilter]);

  const getUtilizationColor = (current: number, limit: number) => {
    const pct = limit === 999 ? 0 : (current / limit) * 100;
    if (pct >= 90) return "text-error";
    if (pct >= 70) return "text-tertiary";
    return "text-secondary";
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-20 lg:pb-4">
      <Toast message={toastMsg} visible={toastVisible} onDismiss={() => setToastVisible(false)} />

      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary tracking-widest uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Centro de Comando B2B
        </span>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-[22px] text-on-surface font-semibold tracking-tight">
          Plugin Delivery Comercios
        </h1>
        <p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant leading-relaxed">
          Control maestro del plugin premium B2B. Gestiona activación, límites de comercios afiliados y revenue.
        </p>
      </div>

      {/* Plugin Master Toggle */}
      <div className="bg-surface-container rounded-xl p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", pluginEnabled ? "bg-tertiary-container/30 text-tertiary" : "bg-surface-container-high text-on-surface-variant")}>
            <span className="material-symbols-outlined text-[24px]">local_shipping</span>
          </div>
          <div className="flex flex-col">
            <span className="font-[family-name:var(--font-geist-sans)] text-[14px] text-on-surface font-medium">
              Plugin Delivery Comercios (DELIVERY)
            </span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant">
              {pluginEnabled ? "Activo globalmente" : "Desactivado globalmente"} — ${deliveryPluginConfig.monthlyPrice}/mes por chofer
            </span>
          </div>
        </div>
        <ToggleSwitch
          checked={pluginEnabled}
          onChange={() => {
            setPluginEnabled(!pluginEnabled);
            setToastMsg(pluginEnabled ? "Plugin DELIVERY desactivado globalmente" : "Plugin DELIVERY activado globalmente");
            setToastVisible(true);
          }}
        />
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-container rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-[14px] text-primary">groups</span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">Choferes</span>
          </div>
          <span className="font-[family-name:var(--font-space-grotesk)] text-[24px] text-on-surface font-bold">{deliveryStats.totalChoferesDELIVERY}</span>
          <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-secondary ml-1">activos</span>
        </div>
        <div className="bg-surface-container rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-[14px] text-tertiary">storefront</span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">Comercios</span>
          </div>
          <span className="font-[family-name:var(--font-space-grotesk)] text-[24px] text-on-surface font-bold">{deliveryStats.totalComercios}</span>
          <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant ml-1">afiliados</span>
        </div>
        <div className="bg-surface-container rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-[14px] text-secondary">payments</span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">Revenue Hoy</span>
          </div>
          <span className="font-[family-name:var(--font-space-grotesk)] text-[24px] text-on-surface font-bold">${deliveryStats.revenueDelHoy.toLocaleString()}</span>
          <div className="flex items-center gap-0.5 mt-0.5">
            <span className="material-symbols-outlined text-[10px] text-secondary">trending_up</span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-secondary">+{deliveryStats.crecimientoMensual}%</span>
          </div>
        </div>
        <div className="bg-surface-container rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-[14px] text-error">warning</span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">Deudas</span>
          </div>
          <span className="font-[family-name:var(--font-space-grotesk)] text-[24px] text-on-surface font-bold">${deliveryStats.deudaTotalPendiente.toLocaleString()}</span>
          <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-error ml-1">pendiente</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3">
        <SearchInput
          placeholder="Buscar chofer con Delivery..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <FilterPills
          options={filterOptions}
          activeId={activeFilter}
          onChange={setActiveFilter}
        />
      </div>

      {/* Choferes Cards */}
      <div className="flex flex-col gap-3">
        {filteredChoferes.map((chofer) => (
          <div
            key={chofer.id}
            className="bg-surface-container rounded-xl overflow-hidden shadow-md"
          >
            <div className={cn("h-1 w-full", chofer.deliveryEnabled ? "bg-gradient-to-r from-tertiary via-secondary to-tertiary" : "bg-outline-variant/30")} />
            <div className="p-4 space-y-3">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center",
                    chofer.deliveryEnabled ? "bg-tertiary-container/30 text-tertiary" : "bg-surface-container-high text-on-surface-variant"
                  )}>
                    <span className="material-symbols-outlined text-[24px]">
                      {chofer.type === "LINEA" ? "local_taxi" : chofer.type === "DELIVERY" ? "storefront" : "two_wheeler"}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-[family-name:var(--font-space-grotesk)] text-[15px] text-on-surface font-semibold truncate">
                        {chofer.businessName || chofer.name}
                      </h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full font-[family-name:var(--font-geist-mono)] text-[9px] uppercase font-bold",
                        chofer.deliveryEnabled ? "bg-secondary/15 text-secondary" : "bg-surface-variant text-on-surface-variant"
                      )}>
                        {chofer.deliveryEnabled ? "ACTIVE" : "OFF"}
                      </span>
                    </div>
                    <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary flex items-center gap-1 truncate">
                      <span className="material-symbols-outlined text-[12px]">link</span>
                      drivip.app/{chofer.slug}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[9px] text-on-surface-variant uppercase">{chofer.planLabel}</span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface font-semibold">${chofer.deudaPendiente === 0 ? "0" : chofer.deudaPendiente}</span>
                  {chofer.deudaPendiente > 0 && (
                    <span className="font-[family-name:var(--font-geist-mono)] text-[9px] text-error">deuda</span>
                  )}
                </div>
              </div>

              {/* Commerce Limits */}
              <div className="bg-surface-container-high/50 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">Comercios Afiliados</span>
                  <span className={cn("font-[family-name:var(--font-geist-mono)] text-[12px] font-bold", getUtilizationColor(chofer.comerciosAfiliados, chofer.comerciosLimite))}>
                    {chofer.comerciosAfiliados} / {chofer.comerciosLimite === 999 ? "∞" : chofer.comerciosLimite}
                  </span>
                </div>
                {chofer.comerciosLimite !== 999 && (
                  <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", getUtilizationColor(chofer.comerciosAfiliados, chofer.comerciosLimite) === "text-error" ? "bg-error" : getUtilizationColor(chofer.comerciosAfiliados, chofer.comerciosLimite) === "text-tertiary" ? "bg-tertiary" : "bg-secondary")}
                      style={{ width: `${Math.min((chofer.comerciosAfiliados / chofer.comerciosLimite) * 100, 100)}%` }}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-on-surface-variant">local_taxi</span>
                    <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant">Carras hoy: </span>
                    <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface font-semibold">{chofer.carrasHoy}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-secondary">payments</span>
                    <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant">Facturado: </span>
                    <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-secondary font-semibold">${chofer.facturadoHoy}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex gap-2">
                <Button
                  variant={chofer.deliveryEnabled ? "secondary" : "primary"}
                  className="flex-1"
                  onClick={() => {
                    setToastMsg(chofer.deliveryEnabled ? `Delivery desactivado para ${chofer.name}` : `Delivery activado para ${chofer.name}`);
                    setToastVisible(true);
                  }}
                >
                  <span className="material-symbols-outlined text-[16px]">{chofer.deliveryEnabled ? "block" : "check_circle"}</span>
                  {chofer.deliveryEnabled ? "Desactivar" : "Activar"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-10 h-10 !px-0"
                  onClick={() => {
                    setToastMsg(`Configuración de ${chofer.name} — Próximamente`);
                    setToastVisible(true);
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
