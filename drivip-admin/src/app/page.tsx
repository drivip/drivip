"use client";

import Link from "next/link";

const dashboards = [
  {
    href: "/superadmin",
    icon: "admin_panel_settings",
    title: "SuperAdmin",
    description: "Central de control del SaaS — gestiona tenants, plugins, billing",
    color: "primary",
    features: ["Choferes", "Plugins", "B2B", "Banners", "Seguridad", "DevOps"],
  },
  {
    href: "/chofer",
    icon: "local_taxi",
    title: "Chofer",
    description: "Panel del conductor — gestiona carreras, clientes, precios y pagos",
    color: "secondary",
    features: ["Mapa GPS", "Mis Carreras", "Clientes", "Precios", "Pagos"],
  },
  {
    href: "/linea",
    icon: "local_shipping",
    title: "Linea",
    description: "Central de despacho — administra la flota y asigna carreras",
    color: "tertiary",
    features: ["Mapa Flota", "Solicitudes", "Choferes", "Reportes", "Historial"],
  },
];

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center shadow-[0_0_24px_rgba(124,58,237,0.4)]">
              <span className="material-symbols-outlined text-[28px] text-on-primary">
                route
              </span>
            </div>
            <span className="font-[family-name:var(--font-space-grotesk)] text-[32px] font-bold text-on-surface">
              Drivip
            </span>
          </div>
          <p className="font-[family-name:var(--font-geist-sans)] text-[14px] text-on-surface-variant">
            Selecciona tu panel de operaciones
          </p>
        </div>

        <div className="space-y-4">
          {dashboards.map((dash) => (
            <Link key={dash.href} href={dash.href} className="block group">
              <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 transition-all hover:border-primary/40 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)]">
                <div className="flex items-start gap-4">
                  <div
                    className={
                      dash.color === "primary"
                        ? "w-14 h-14 rounded-xl bg-primary-container/20 flex items-center justify-center shrink-0"
                        : dash.color === "secondary"
                          ? "w-14 h-14 rounded-xl bg-secondary-container/20 flex items-center justify-center shrink-0"
                          : "w-14 h-14 rounded-xl bg-tertiary-container/20 flex items-center justify-center shrink-0"
                    }
                  >
                    <span
                      className={
                        dash.color === "primary"
                          ? "material-symbols-outlined text-[28px] text-primary"
                          : dash.color === "secondary"
                            ? "material-symbols-outlined text-[28px] text-secondary"
                            : "material-symbols-outlined text-[28px] text-tertiary"
                      }
                    >
                      {dash.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-[family-name:var(--font-space-grotesk)] text-[20px] text-on-surface font-bold">
                        {dash.title}
                      </h2>
                      <span
                        className={
                          dash.color === "primary"
                            ? "material-symbols-outlined text-[16px] text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                            : dash.color === "secondary"
                              ? "material-symbols-outlined text-[16px] text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                              : "material-symbols-outlined text-[16px] text-tertiary opacity-0 group-hover:opacity-100 transition-opacity"
                        }
                      >
                        arrow_forward
                      </span>
                    </div>
                    <p className="font-[family-name:var(--font-geist-sans)] text-[13px] text-on-surface-variant">
                      {dash.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {dash.features.map((f) => (
                        <span
                          key={f}
                          className={
                            dash.color === "primary"
                              ? "px-2 py-0.5 rounded bg-primary-container/10 text-primary font-[family-name:var(--font-geist-mono)] text-[10px]"
                              : dash.color === "secondary"
                                ? "px-2 py-0.5 rounded bg-secondary-container/10 text-secondary font-[family-name:var(--font-geist-mono)] text-[10px]"
                                : "px-2 py-0.5 rounded bg-tertiary-container/10 text-tertiary font-[family-name:var(--font-geist-mono)] text-[10px]"
                          }
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-outline">
            drivip.app v1.0
          </span>
        </div>
      </div>
    </div>
  );
}
