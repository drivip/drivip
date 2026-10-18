"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

import PanelPrincipal from "@/components/linea/PanelPrincipal";
import MapaFlota from "@/components/linea/MapaFlota";
import FlotaChoferes from "@/components/linea/FlotaChoferes";
import SolicitudesDespacho from "@/components/linea/SolicitudesDespacho";
import ReportesLinea from "@/components/linea/ReportesLinea";

type Module =
  | "dashboard"
  | "mapa"
  | "solicitudes"
  | "choferes"
  | "reportes"
  | "config";

const navItems: { id: Module; icon: string; label: string }[] = [
  { id: "dashboard", icon: "dashboard", label: "Panel" },
  { id: "mapa", icon: "map", label: "Mapa" },
  { id: "solicitudes", icon: "queue", label: "Solicitudes" },
  { id: "choferes", icon: "group", label: "Choferes" },
  { id: "reportes", icon: "analytics", label: "Reportes" },
  { id: "config", icon: "settings", label: "Config" },
];

export default function LineaDashboardPage() {
  const [activeModule, setActiveModule] = useState<Module>("dashboard");

  const handleNavigate = (module: string) => {
    setActiveModule(module as Module);
  };

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <PanelPrincipal onNavigate={handleNavigate} />;
      case "mapa":
        return <MapaFlota />;
      case "solicitudes":
        return <SolicitudesDespacho />;
      case "choferes":
        return <FlotaChoferes />;
      case "reportes":
        return <ReportesLinea />;
      case "config":
        return (
          <div className="px-4 py-4 space-y-4 pb-24 lg:pb-4">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-[18px] text-on-surface font-semibold">
              Configuracion
            </h2>
            <div className="bg-surface-container rounded-xl p-4 space-y-3">
              <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant uppercase">
                Notificaciones
              </span>
              {[
                { label: "Nueva solicitud", on: true },
                { label: "Chofer disponible", on: true },
                { label: "Carrera completada", on: true },
                { label: "Alerta de sistema", on: true },
              ].map((n) => (
                <div
                  key={n.label}
                  className="flex items-center justify-between py-2"
                >
                  <span className="font-[family-name:var(--font-geist-sans)] text-[13px] text-on-surface">
                    {n.label}
                  </span>
                  <div
                    className={cn(
                      "w-10 h-6 rounded-full relative cursor-pointer",
                      n.on ? "bg-primary-container" : "bg-surface-variant"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 w-5 h-5 rounded-full transition-transform",
                        n.on ? "left-5 bg-on-primary" : "left-0.5 bg-outline"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-surface-container rounded-xl p-4 space-y-3">
              <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant uppercase">
                Zona de Cobertura
              </span>
              <div className="flex items-center justify-between py-2">
                <span className="font-[family-name:var(--font-geist-sans)] text-[13px] text-on-surface">
                  Radio maximo
                </span>
                <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-primary">
                  15 km
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-[family-name:var(--font-geist-sans)] text-[13px] text-on-surface">
                  Auto-asignar
                </span>
                <div className="w-10 h-6 rounded-full relative bg-primary-container">
                  <div className="absolute top-0.5 left-5 w-5 h-5 rounded-full bg-on-primary" />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <PanelPrincipal onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-surface-container-low border-r border-outline-variant/30">
        <div className="flex items-center h-16 px-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-tertiary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-on-tertiary">
                local_shipping
              </span>
            </div>
            <span className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-on-surface">
              Drivip
            </span>
            <span className="px-1.5 py-0.5 rounded bg-tertiary-container/20 text-tertiary font-[family-name:var(--font-geist-mono)] text-[9px] font-bold">
              LINEA
            </span>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-tertiary-container/15 text-tertiary font-semibold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
                )}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
                <span className="font-[family-name:var(--font-geist-mono)] text-[11px] tracking-wide">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="px-2 pb-3">
          <div className="p-3 rounded-lg bg-surface-container">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-tertiary-container/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] text-tertiary">
                  local_shipping
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface font-medium truncate">
                  Central de Despacho
                </span>
                <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant truncate">
                  drivip.app/linea
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-5 border-b border-outline-variant/30 bg-surface-container-lowest/50 backdrop-blur-sm lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-tertiary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-on-tertiary">
                local_shipping
              </span>
            </div>
            <span className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-on-surface">
              Drivip
            </span>
            <span className="px-1.5 py-0.5 rounded bg-tertiary-container/20 text-tertiary font-[family-name:var(--font-geist-mono)] text-[9px] font-bold">
              LINEA
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-secondary">
              ● EN VIVO
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{renderModule()}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 lg:hidden bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-1px_12px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-5 items-center h-16 px-1">
          {navItems.slice(0, 5).map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-12 rounded transition-colors",
                  isActive
                    ? "text-tertiary bg-tertiary-container/15 font-semibold"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
                <span className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-tight truncate">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
