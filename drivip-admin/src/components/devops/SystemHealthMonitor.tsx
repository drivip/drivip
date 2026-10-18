"use client";

import { useState, useEffect } from "react";
import { systemHealth, infrastructureNodes } from "@/mockData/systemHealthData";
import { cn } from "@/lib/utils";
import ProgressBar from "@/components/ui/ProgressBar";

export default function SystemHealthMonitor() {
  const [liveData, setLiveData] = useState({
    latency: systemHealth.latency,
    uptime: systemHealth.uptime,
    driversConnected: 1420,
    wsThroughput: 18.4,
    webpushDispatches: 48210,
    lastUpdate: new Date().toLocaleTimeString(),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData((prev) => ({
        latency: Math.max(8, Math.min(45, prev.latency + (Math.random() - 0.5) * 4)),
        uptime: Math.min(99.99, Math.max(99.90, prev.uptime + (Math.random() - 0.3) * 0.02)),
        driversConnected: Math.max(1200, Math.min(1600, prev.driversConnected + Math.floor((Math.random() - 0.5) * 40))),
        wsThroughput: Math.max(12, Math.min(25, prev.wsThroughput + (Math.random() - 0.5) * 2)),
        webpushDispatches: prev.webpushDispatches + Math.floor(Math.random() * 50),
        lastUpdate: new Date().toLocaleTimeString(),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="px-4 py-4 space-y-4 pb-20 lg:pb-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary tracking-widest uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Monitoreo en Tiempo Real
        </span>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-[22px] text-on-surface font-semibold tracking-tight">
          Health Monitor
        </h1>
        <p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant leading-relaxed">
          Telemetria de infraestructura: Base de Datos, WebSockets y servidor Push.
        </p>
      </div>

      {/* Live Status Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low shadow-sm border border-secondary/20">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
          </div>
          <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-secondary uppercase font-bold tracking-wider">
            Todos los Sistemas Operativos
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant">
            Actualizado: {liveData.lastUpdate}
          </span>
          <span className="font-[family-name:var(--font-geist-mono)] text-[13px] text-on-surface font-bold">
            {Math.round(liveData.latency)}ms
          </span>
          <span className="text-outline">•</span>
          <span className="font-[family-name:var(--font-geist-mono)] text-[13px] text-secondary font-bold">
            {liveData.uptime.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase">Latencia Global</span>
            <span className="material-symbols-outlined text-[18px] text-primary">speed</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="font-[family-name:var(--font-space-grotesk)] text-[32px] text-on-surface font-bold tracking-tight">
              {Math.round(liveData.latency)}
            </span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-on-surface-variant">ms</span>
          </div>
          <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-secondary flex items-center mt-1">
            <span className="material-symbols-outlined text-[14px] mr-0.5">trending_down</span>
            {systemHealth.latencyDelta}ms vs ayer
          </span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase">Uptime Mensual</span>
            <span className="material-symbols-outlined text-[18px] text-secondary">verified</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="font-[family-name:var(--font-space-grotesk)] text-[32px] text-on-surface font-bold tracking-tight">
              {liveData.uptime.toFixed(2)}
            </span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-secondary">%</span>
          </div>
          <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant mt-1 block">
            Tier-4 Multi-AZ
          </span>
        </div>
      </div>

      {/* Infrastructure Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase text-on-surface-variant tracking-wider">
            Cluster Telemetry
          </span>
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary font-semibold">
            {systemHealth.nodesAlive}/{systemHealth.nodesTotal} Nodos Vivos
          </span>
        </div>

        {infrastructureNodes.map((node) => (
          <div key={node.id} className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-lg bg-surface-container-high",
                  node.color === "primary" ? "text-primary" : "text-secondary"
                )}>
                  <span className="material-symbols-outlined text-[20px]">{node.icon}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-[family-name:var(--font-space-grotesk)] text-[15px] font-semibold text-on-surface">
                    {node.name}
                  </span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant">
                    {node.subtitle}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-[family-name:var(--font-geist-mono)] text-[10px] font-bold">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full mr-1",
                  node.status === "optimal" ? "bg-secondary animate-pulse" : "bg-secondary"
                )} />
                {node.statusLabel}
              </span>
            </div>

            <div className={cn(
              "grid gap-2 pt-1",
              node.metrics.length === 3 ? "grid-cols-3" : "grid-cols-2"
            )}>
              {node.metrics.map((m) => (
                <div key={m.label} className="p-2 rounded bg-surface-container-low flex flex-col">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">
                    {m.label}
                  </span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-on-surface mt-0.5">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>

            {node.storage && (
              <div className="pt-1 space-y-1.5">
                <div className="flex justify-between font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant">
                  <span>{node.storage.label}</span>
                  <span className="text-on-surface">
                    {node.storage.used} GB / {node.storage.total} GB ({Math.round((node.storage.used / node.storage.total) * 100)}%)
                  </span>
                </div>
                <ProgressBar value={node.storage.used} max={node.storage.total} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
