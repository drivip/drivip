"use client";

import { useState, useMemo } from "react";
import { pluginsData, pluginStats } from "@/mockData/pluginsData";
import { tenantsData } from "@/mockData/tenantsData";
import { cn, formatCurrency } from "@/lib/utils";
import SearchInput from "@/components/ui/SearchInput";
import FilterPills from "@/components/ui/FilterPills";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import SlideOver from "@/components/ui/SlideOver";
import Toast from "@/components/ui/Toast";

export default function PluginCatalogGrid() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [pluginStates, setPluginStates] = useState<Record<string, boolean>>({
    DISPATCH: true,
    REFERRALS: true,
    DELIVERY: true,
    CUSTOM_DOMAIN: true,
  });
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerPlugin, setDrawerPlugin] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const filterOptions = [
    { id: "all", label: "Todos", count: pluginsData.length },
    { id: "installed", label: "Instalados", count: 112 },
    { id: "popular", label: "Populares" },
    { id: "enterprise", label: "Enterprise" },
  ];

  const filteredPlugins = useMemo(() => {
    return pluginsData.filter((p) => {
      const matchesFilter =
        activeFilter === "all" || p.categories.includes(activeFilter);
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [searchQuery, activeFilter]);

  const handleToggleGlobal = (pluginId: string) => {
    setPluginStates((prev) => ({
      ...prev,
      [pluginId]: !prev[pluginId],
    }));
    const plugin = pluginsData.find((p) => p.id === pluginId);
    setToastMsg(
      `${plugin?.name}: ${pluginStates[pluginId] ? "pausado globalmente" : "activado"}`
    );
    setToastVisible(true);
  };

  const openAllocationDrawer = (plugin: any) => {
    setDrawerPlugin(plugin);
    setShowDrawer(true);
  };

  const getBadgeColor = (variant: string) => {
    switch (variant) {
      case "secondary":
        return "bg-secondary-container/20 text-secondary";
      case "tertiary":
        return "bg-tertiary-container/20 text-tertiary";
      case "primary":
      default:
        return "bg-primary-container/20 text-primary";
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <Toast
        message={toastMsg}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />

      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary tracking-widest uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Ecosistema Modular SaaS
          </span>
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
            v2.4.0 Engine
          </span>
        </div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-[22px] text-on-surface font-semibold tracking-tight">
          Catalogo de Plugins & Add-ons
        </h1>
        <p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant leading-relaxed">
          Gestion activacion global, precios y licencias de modulos modulares SaaS para choferes.
        </p>
      </div>

      {/* Telemetry Strip */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-secondary">payments</span>
              MRR Add-ons
            </span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-secondary bg-secondary-container/20 px-1.5 py-0.5 rounded font-semibold">
              +{pluginStats.mrrGrowth}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-[family-name:var(--font-space-grotesk)] text-[24px] leading-tight text-on-surface tracking-tight font-bold">
              ${pluginStats.mrrAddons.toLocaleString()}
              <span className="text-[12px] font-normal text-on-surface-variant">/mes</span>
            </span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant mt-0.5">
              Facturado recurrentemente
            </span>
          </div>
        </div>
        <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">hub</span>
              Instancias
            </span>
            <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
          </div>
          <div className="flex flex-col">
            <span className="font-[family-name:var(--font-space-grotesk)] text-[24px] leading-tight text-on-surface tracking-tight font-bold">
              {pluginStats.totalInstances}
            </span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-secondary mt-0.5">
              Plugins activos en flota
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3">
        <SearchInput
          placeholder="Buscar modulo o clave ID..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <FilterPills
          options={filterOptions}
          activeId={activeFilter}
          onChange={setActiveFilter}
        />
      </div>

      {/* Plugin Cards */}
      <div className="flex flex-col gap-3 pb-20 lg:pb-4">
        {filteredPlugins.map((plugin) => (
          <article
            key={plugin.id}
            className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-3 relative transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                    plugin.id === "DELIVERY"
                      ? "bg-tertiary-container/30 text-tertiary"
                      : plugin.id === "CUSTOM_DOMAIN"
                        ? "bg-secondary-container/20 text-secondary-fixed-dim"
                        : "bg-primary-container/25 text-primary"
                  )}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {plugin.icon}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={cn(
                        "font-[family-name:var(--font-geist-mono)] text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider",
                        plugin.id === "DELIVERY"
                          ? "text-tertiary bg-tertiary-container/20"
                          : plugin.id === "CUSTOM_DOMAIN"
                            ? "text-secondary bg-secondary-container/20"
                            : "text-primary bg-primary-container/30"
                      )}
                    >
                      {plugin.id}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full font-[family-name:var(--font-geist-mono)] text-[10px] tracking-wide font-bold",
                        getBadgeColor(plugin.badgeVariant)
                      )}
                    >
                      {plugin.badge}
                    </span>
                  </div>
                  <h2 className="font-[family-name:var(--font-space-grotesk)] text-[16px] leading-tight text-on-surface font-semibold truncate mt-0.5">
                    {plugin.name}
                  </h2>
                </div>
              </div>
              <ToggleSwitch
                checked={pluginStates[plugin.id]}
                onChange={() => handleToggleGlobal(plugin.id)}
              />
            </div>

            <p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant leading-relaxed">
              {plugin.description}
            </p>

            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-col">
                <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">
                  Tarifa por chofer
                </span>
                <span className="font-[family-name:var(--font-geist-mono)] text-[14px] text-on-surface font-semibold">
                  {formatCurrency(plugin.monthlyPrice)}{" "}
                  <span className="text-on-surface-variant font-normal text-[12px]">
                    / mes
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1.5 rounded-lg">
                <span className="material-symbols-outlined text-[15px] text-secondary">
                  groups
                </span>
                <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface font-mono">
                  {plugin.activeTenants} activos
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => openAllocationDrawer(plugin)}
              >
                <span className="material-symbols-outlined text-[17px]">
                  settings_suggest
                </span>
                Gestionar Choferes ({plugin.activeTenants})
              </Button>
              <Button
                variant="ghost"
                className="w-10 h-10 !px-0"
                onClick={() => {
                  setToastMsg(`Historial de licencias cargado para ${plugin.id}`);
                  setToastVisible(true);
                }}
              >
                <span className="material-symbols-outlined text-[18px]">
                  history
                </span>
              </Button>
            </div>
          </article>
        ))}

        {filteredPlugins.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-surface-container-low rounded-xl">
            <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-3">
              <span className="material-symbols-outlined text-[28px]">
                search_off
              </span>
            </div>
            <p className="font-[family-name:var(--font-space-grotesk)] text-[16px] text-on-surface font-semibold">
              No se encontraron plugins
            </p>
            <p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant max-w-[260px] mt-1">
              Intenta con otro termino de busqueda o cambia la categoria de filtro.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("all");
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest font-[family-name:var(--font-geist-mono)] text-[11px] text-primary transition-colors"
            >
              Restablecer filtros
            </button>
          </div>
        )}

        {/* Create New Plugin Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full mt-2 py-4 px-4 rounded-xl bg-surface-container/50 hover:bg-surface-container border-2 border-dashed border-primary/40 hover:border-primary text-primary flex items-center justify-center gap-2 group transition-all"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">
            add_circle
          </span>
          <span className="font-[family-name:var(--font-geist-mono)] text-[13px] font-semibold tracking-wide">
            + Crear Nuevo Modulo / Plugin
          </span>
        </button>
      </div>

      {/* Tenant Allocation Slide-Over */}
      <SlideOver open={showDrawer} onClose={() => setShowDrawer(false)}>
        <div className="flex items-center justify-between pb-2">
          <div className="flex flex-col">
            <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-primary uppercase font-mono">
              {drawerPlugin?.id}
            </span>
              <h3 className="font-[family-name:var(--font-space-grotesk)] text-[18px] text-on-surface font-semibold truncate">
              Asignación de Choferes
            </h3>
          </div>
          <button
            onClick={() => setShowDrawer(false)}
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container-highest"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant mb-4">
          Concede o revoca licencias para este plugin en tiempo real por chofer.
        </p>

        <div className="relative w-full mb-4">
          <span className="material-symbols-outlined absolute left-3 top-2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            className="w-full bg-surface-container text-on-surface text-[13px] pl-9 pr-3 py-2 rounded-lg outline-none"
            placeholder="Filtrar por nombre de flota..."
          />
        </div>

        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[42vh] pr-1">
          {tenantsData.slice(0, 6).map((t) => (
            <div
              key={t.id}
              className="p-2.5 rounded-lg bg-surface-container flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded bg-primary-container/30 text-primary flex items-center justify-center font-bold text-[11px] font-mono">
                  {t.id.slice(0, 2)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-[family-name:var(--font-geist-sans)] text-[13px] text-on-surface font-medium truncate">
                    {t.businessName || t.name}
                  </span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant font-mono">
                    {t.type === "LINEA"
                      ? "Plan Pro"
                      : t.type === "DELIVERY"
                        ? "Plan Delivery Hub"
                        : "Plan Starter"}{" "}
                    &bull;{" "}
                    {t.fleet
                      ? `${t.fleet.total} choferes`
                      : "1 chofer"}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                defaultChecked={drawerPlugin ? t.plugins[drawerPlugin.id as keyof typeof t.plugins] : false}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
            </div>
          ))}
        </div>

        <div className="pt-4 mt-auto flex items-center gap-2">
          <button
            className="flex-1 py-2.5 rounded-lg bg-surface-container-high text-on-surface font-[family-name:var(--font-geist-sans)] text-[13px]"
            onClick={() => setShowDrawer(false)}
          >
            Cancelar
          </button>
          <button
            className="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary font-[family-name:var(--font-geist-sans)] text-[13px] font-semibold"
            onClick={() => {
              setShowDrawer(false);
              setToastMsg("Asignación de choferes guardada con exito.");
              setToastVisible(true);
            }}
          >
            Guardar Cambios
          </button>
        </div>
      </SlideOver>

      {/* Create Plugin Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">
              extension
            </span>
            <h3 className="font-[family-name:var(--font-space-grotesk)] text-[17px] text-on-surface font-semibold">
              Nuevo Plugin Add-on
            </h3>
          </div>
          <button
            className="text-on-surface-variant hover:text-on-surface"
            onClick={() => setShowCreateModal(false)}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant">
          Define el identificador tecnico y precio recurrente para habilitar a los choferes.
        </p>
        <div className="flex flex-col gap-3 mt-2">
          <div>
            <label className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">
              Clave Tecnica (Slug)
            </label>
            <input
              className="w-full bg-surface-container text-on-surface text-[13px] px-3 py-2 rounded-lg outline-none font-mono mt-1"
              placeholder="EJ: WHATSAPP_DISPATCH"
            />
          </div>
          <div>
            <label className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">
              Nombre Publico
            </label>
            <input
              className="w-full bg-surface-container text-on-surface text-[13px] px-3 py-2 rounded-lg outline-none mt-1"
              placeholder="EJ: Despacho por WhatsApp Bot"
            />
          </div>
          <div>
            <label className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">
              Tarifa Mensual ($ USD)
            </label>
            <input
              className="w-full bg-surface-container text-on-surface text-[13px] px-3 py-2 rounded-lg outline-none font-mono mt-1"
              placeholder="29.00"
              type="number"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button
            className="flex-1 py-2 rounded-lg bg-surface-container-high text-on-surface font-[family-name:var(--font-geist-sans)] text-[13px]"
            onClick={() => setShowCreateModal(false)}
          >
            Cancelar
          </button>
          <button
            className="flex-1 py-2 rounded-lg bg-primary-container text-on-primary font-[family-name:var(--font-geist-sans)] text-[13px] font-semibold"
            onClick={() => {
              setShowCreateModal(false);
              setToastMsg("Nuevo modulo registrado en el catalogo maestro.");
              setToastVisible(true);
            }}
          >
            Crear Modulo
          </button>
        </div>
      </Modal>
    </div>
  );
}
