"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { choferProfile } from "@/mockData/choferData";
import dynamic from "next/dynamic";

import ChoferDashboard from "@/components/chofer/ChoferDashboard";
import MisClientes from "@/components/chofer/MisClientes";
import MisAliados from "@/components/chofer/MisAliados";
import MisPrecios from "@/components/chofer/MisPrecios";
import MisPagos from "@/components/chofer/MisPagos";
import Carreras from "@/components/chofer/Carreras";
import Historial from "@/components/chofer/Historial";
import MiPerfil from "@/components/chofer/MiPerfil";
import MiPlan from "@/components/chofer/MiPlan";
import Referidos from "@/components/chofer/Referidos";
import Configuracion from "@/components/chofer/Configuracion";

type Module =
  | "dashboard"
  | "clientes"
  | "aliados"
  | "precios"
  | "pagos"
  | "carreras"
  | "historial"
  | "perfil"
  | "plan"
  | "referidos"
  | "config";

const navItems: { id: Module; icon: string; label: string }[] = [
  { id: "dashboard", icon: "home", label: "Inicio" },
  { id: "carreras", icon: "local_taxi", label: "Carreras" },
  { id: "clientes", icon: "people", label: "Clientes" },
  { id: "aliados", icon: "group_add", label: "Aliados" },
  { id: "precios", icon: "payments", label: "Precios" },
  { id: "pagos", icon: "account_balance_wallet", label: "Pagos" },
  { id: "historial", icon: "history", label: "Historial" },
  { id: "perfil", icon: "person", label: "Perfil" },
  { id: "plan", icon: "card_membership", label: "Plan" },
  { id: "referidos", icon: "share", label: "Referidos" },
  { id: "config", icon: "settings", label: "Config" },
];

export default function ChoferDashboardPage() {
  const [activeModule, setActiveModule] = useState<Module>("dashboard");
  const [isOnline, setIsOnline] = useState(true);

  const profile = choferProfile;

  const handleNavigate = (module: string) => {
    setActiveModule(module as Module);
  };

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <ChoferDashboard onNavigate={handleNavigate} />;
      case "clientes":
        return <MisClientes />;
      case "aliados":
        return <MisAliados />;
      case "precios":
        return <MisPrecios />;
      case "pagos":
        return <MisPagos />;
      case "carreras":
        return <Carreras />;
      case "historial":
        return <Historial />;
      case "perfil":
        return <MiPerfil />;
      case "plan":
        return <MiPlan />;
      case "referidos":
        return <Referidos />;
      case "config":
        return <Configuracion />;
      default:
        return <ChoferDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-surface-container-low border-r border-outline-variant/30">
        <div className="flex items-center h-16 px-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-on-primary">
                route
              </span>
            </div>
            <span className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-on-surface">
              Drivip
            </span>
            <span className="px-1.5 py-0.5 rounded bg-primary-container/20 text-primary font-[family-name:var(--font-geist-mono)] text-[9px] font-bold">
              CHOFER
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
                    ? "bg-primary-container/15 text-primary font-semibold"
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
              <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center">
                <span className="font-[family-name:var(--font-space-grotesk)] text-[11px] font-bold text-primary">
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface font-medium truncate">
                  {profile.name}
                </span>
                <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant truncate">
                  drivip.app/{profile.slug}
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
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-on-primary">
                route
              </span>
            </div>
            <span className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-on-surface">
              Drivip
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "px-2 py-0.5 rounded-full font-[family-name:var(--font-geist-mono)] text-[9px] font-bold",
                isOnline
                  ? "bg-secondary/20 text-secondary"
                  : "bg-surface-container-highest text-outline"
              )}
            >
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={cn(
                "w-10 h-6 rounded-full relative transition-colors",
                isOnline ? "bg-primary-container" : "bg-surface-variant"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full transition-transform",
                  isOnline
                    ? "left-5 bg-on-primary"
                    : "left-0.5 bg-outline"
                )}
              />
            </button>
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
                    ? "text-primary bg-primary-container/15 font-semibold"
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
