"use client";

import MetricCard from "@/components/ui/MetricCard";
import { lineaDrivers, lineaStats } from "@/mockData/lineaData";

export default function ReportesLinea() {
  const topDrivers = [...lineaDrivers]
    .sort((a, b) => b.todayEarnings - a.todayEarnings)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-[22px] font-bold text-on-surface">
        Reportes
      </h1>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Ganancias Hoy"
          value={`$${lineaStats.earningsToday.toLocaleString()}`}
          icon="attach_money"
          trend={{ value: "+15% vs ayer", positive: true }}
          className="border-tertiary/20"
        />
        <MetricCard
          label="Tiempo Espera Prom."
          value={`${lineaStats.avgWaitTime}`}
          suffix="min"
          icon="schedule"
          trend={{ value: "-0.8 min", positive: true }}
          className="border-tertiary/20"
        />
      </div>

      <div className="bg-surface-container rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-[15px] font-semibold text-on-surface">
            Rendimiento de Choferes
          </h2>
          <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">
            Top 5
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {topDrivers.map((driver, i) => (
            <div
              key={driver.id}
              className="flex items-center gap-3 bg-surface-container-high rounded-xl p-3"
            >
              <span className="font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold text-on-surface-variant w-6 text-center">
                {i + 1}
              </span>
              <div className="w-9 h-9 rounded-full bg-tertiary/15 flex items-center justify-center shrink-0">
                <span className="font-[family-name:var(--font-space-grotesk)] text-[12px] font-bold text-tertiary">
                  {driver.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-[family-name:var(--font-geist-sans)] text-[13px] font-medium text-on-surface truncate">
                  {driver.name}
                </p>
                <div className="flex items-center gap-3">
                  <span className="font-[family-name:var(--font-geist-sans)] text-[11px] text-amber-400">
                    ★ {driver.rating}
                  </span>
                  <span className="font-[family-name:var(--font-geist-sans)] text-[11px] text-on-surface-variant">
                    {driver.todayTrips} viajes
                  </span>
                </div>
              </div>
              <p className="font-[family-name:var(--font-space-grotesk)] text-[14px] font-bold text-on-surface">
                ${driver.todayEarnings.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-container rounded-xl p-4">
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-[15px] font-semibold text-on-surface mb-3">
          Resumen
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-high rounded-lg p-3">
            <p className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
              Tasa de Aceptación
            </p>
            <p className="font-[family-name:var(--font-space-grotesk)] text-[20px] font-bold text-on-surface">
              {lineaStats.acceptanceRate}%
            </p>
          </div>
          <div className="bg-surface-container-high rounded-lg p-3">
            <p className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
              Solicitudes Pendientes
            </p>
            <p className="font-[family-name:var(--font-space-grotesk)] text-[20px] font-bold text-on-surface">
              {lineaStats.pendingRequests}
            </p>
          </div>
          <div className="bg-surface-container-high rounded-lg p-3">
            <p className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
              Choferes Activos
            </p>
            <p className="font-[family-name:var(--font-space-grotesk)] text-[20px] font-bold text-on-surface">
              {lineaStats.onlineDrivers}
            </p>
          </div>
          <div className="bg-surface-container-high rounded-lg p-3">
            <p className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
              Carreras Activas
            </p>
            <p className="font-[family-name:var(--font-space-grotesk)] text-[20px] font-bold text-on-surface">
              {lineaStats.activeRides}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
