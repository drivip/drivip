"use client";

import { useState } from "react";
import { systemHealth, infrastructureNodes, backups, maintenanceActions } from "@/mockData/systemHealthData";
import { cn, formatCurrency } from "@/lib/utils";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import Toast from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function DevOpsSection() {
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastIcon, setToastIcon] = useState("check_circle");
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [purgeState, setPurgeState] = useState("");
  const [sessionState, setSessionState] = useState("");

  const notify = (msg: string, icon = "check_circle") => {
    setToastMsg(msg);
    setToastIcon(icon);
    setToastVisible(true);
  };

  const handleGenerateSnapshot = () => {
    setGenerating((prev) => ({ ...prev, "sql-snapshot": true }));
    notify("Iniciando volcado binario SQL. Se enviara a S3 Storage...", "hourglass_top");
    setTimeout(() => {
      setGenerating((prev) => ({ ...prev, "sql-snapshot": false }));
      notify("Snapshot generado con exito (1.42 GB)", "verified");
    }, 1800);
  };

  const handleExportJson = () => {
    notify("Generando JSON consolidado de schemas y choferes...", "file_download");
  };

  const handlePurgeGps = () => {
    setShowPurgeConfirm(false);
    setPurgeState("Purgando...");
    notify("Purgando coordenadas GPS antiguas...", "hourglass_top");
    setTimeout(() => {
      setPurgeState("Completado");
      notify("14.2 GB de coordenadas antiguas eliminados.", "cleaning_services");
    }, 1500);
  };

  const handleClearSessions = () => {
    setSessionState("Limpiando...");
    setTimeout(() => {
      setSessionState("0 Sesiones");
      notify("328 sesiones inactivas eliminadas de Redis.", "check");
    }, 1000);
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-20 lg:pb-4">
      <Toast
        message={toastMsg}
        visible={toastVisible}
        icon={toastIcon}
        onDismiss={() => setToastVisible(false)}
      />
      <ConfirmDialog
        open={showPurgeConfirm}
        title="Confirmar Purga de GPS"
        message="Se eliminaran todas las coordenadas GPS con mas de 30 dias de antiguedad. Se liberaran ~14.2 GB de espacio en disco. Esta accion es irreversible."
        confirmLabel="Ejecutar Purga"
        variant="destructive"
        onConfirm={handlePurgeGps}
        onCancel={() => setShowPurgeConfirm(false)}
      />

      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary tracking-widest uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Centro de Control DevOps
        </span>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-[22px] text-on-surface font-semibold tracking-tight">
          DevOps & Respaldos
        </h1>
        <p className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant leading-relaxed">
          Respaldos de Base de Datos, mantenimiento y monitoreo de infraestructura.
        </p>
      </div>

      {/* Live Pulse Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex items-center justify-center w-3 h-3 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
          </div>
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-secondary uppercase font-semibold tracking-wider truncate">
            Todos los Sistemas Operativos
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-on-surface-variant">
            {systemHealth.latency}ms
          </span>
          <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-outline-variant">•</span>
          <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-secondary">
            {systemHealth.uptime}%
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-surface-container flex flex-col space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase">Latencia Global</span>
            <span className="material-symbols-outlined text-[16px] text-primary">speed</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="font-[family-name:var(--font-space-grotesk)] text-[28px] text-on-surface font-bold">
              {systemHealth.latency}
            </span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant">ms</span>
          </div>
          <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-secondary flex items-center">
            <span className="material-symbols-outlined text-[14px] mr-0.5">trending_down</span>
            {systemHealth.latencyDelta}ms vs ayer
          </span>
        </div>
        <div className="p-3 rounded-xl bg-surface-container flex flex-col space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase">Uptime Mensual</span>
            <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="font-[family-name:var(--font-space-grotesk)] text-[28px] text-on-surface font-bold">
              {systemHealth.uptime}
            </span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-secondary">%</span>
          </div>
          <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant">
            Tier-4 Multi-AZ
          </span>
        </div>
      </div>

      {/* Infrastructure Cluster */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase text-on-surface-variant tracking-wider">
            Cluster Telemetry
          </span>
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-primary font-semibold">
            {systemHealth.nodesAlive}/{systemHealth.nodesTotal} Nodos Vivos
          </span>
        </div>

        {infrastructureNodes.map((node) => (
          <div key={node.id} className="p-3 rounded-xl bg-surface-container space-y-2 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-surface-container-high text-primary">
                  <span className="material-symbols-outlined text-[20px]">{node.icon}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-[family-name:var(--font-space-grotesk)] text-[14px] font-semibold text-on-surface">
                    {node.name}
                  </span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant">
                    {node.subtitle}
                  </span>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full font-[family-name:var(--font-geist-mono)] text-[10px] font-bold",
                  node.status === "optimal"
                    ? "bg-secondary/15 text-secondary"
                    : "bg-secondary/15 text-secondary"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full mr-1",
                    node.status === "optimal" ? "bg-secondary animate-pulse" : "bg-secondary"
                  )}
                />
                {node.statusLabel}
              </span>
            </div>

            <div
              className={cn(
                "grid gap-1.5 pt-1",
                node.metrics.length === 3 ? "grid-cols-3" : "grid-cols-2"
              )}
            >
              {node.metrics.map((m) => (
                <div key={m.label} className="p-2 rounded bg-surface-container-low flex flex-col">
                  <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">
                    {m.label}
                  </span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-on-surface">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>

            {node.storage && (
              <div className="pt-1 space-y-1">
                <div className="flex justify-between font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant">
                  <span>{node.storage.label}</span>
                  <span className="text-on-surface">
                    {node.storage.used} GB / {node.storage.total} GB ({Math.round((node.storage.used / node.storage.total) * 100)}%)
                  </span>
                </div>
                <ProgressBar
                  value={node.storage.used}
                  max={node.storage.total}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Backups Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase text-on-surface-variant tracking-wider">
            Respaldos y Mantenimiento
          </span>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">cloud_sync</span>
        </div>

        {backups.map((backup) => (
          <div key={backup.id} className="p-3 rounded-xl bg-surface-container space-y-2 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-surface-container-high text-primary">
                  <span className="material-symbols-outlined text-[22px]">{backup.icon}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-[family-name:var(--font-space-grotesk)] text-[14px] font-semibold text-on-surface">
                    {backup.name}
                  </span>
                  <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant">
                    Ultimo: {backup.lastRun}
                  </span>
                </div>
              </div>
              <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-on-surface bg-surface-container-high px-2 py-0.5 rounded">
                {backup.size}
              </span>
            </div>
            <Button
              variant={backup.id === "sql-snapshot" ? "primary" : "secondary"}
              className="w-full"
              disabled={generating[backup.id]}
              onClick={backup.id === "sql-snapshot" ? handleGenerateSnapshot : handleExportJson}
            >
              <span className="material-symbols-outlined text-[18px]">
                {generating[backup.id] ? "hourglass_top" : backup.id === "sql-snapshot" ? "download_for_offline" : "file_export"}
              </span>
              {generating[backup.id]
                ? "Generando..."
                : backup.id === "sql-snapshot"
                  ? "Generar Snapshot SQL"
                  : "Exportar JSON de Estructura"}
            </Button>
          </div>
        ))}
      </div>

      {/* Maintenance Actions */}
      <div className="space-y-2">
        <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase text-on-surface-variant tracking-wider px-1">
          Optimizacion de Almacenamiento
        </span>

        {maintenanceActions.map((action) => (
          <div key={action.id} className="p-3 rounded-xl bg-surface-container flex items-center justify-between shadow-sm">
            <div className="flex flex-col pr-3">
              <span className="font-[family-name:var(--font-geist-sans)] text-[13px] font-semibold text-on-surface">
                {action.name}
              </span>
              <span className="font-[family-name:var(--font-geist-sans)] text-[12px] text-on-surface-variant">
                {action.description}
              </span>
            </div>
            <Button
              variant={action.id === "purge-gps" ? "destructive" : "secondary"}
              onClick={
                action.id === "purge-gps"
                  ? () => setShowPurgeConfirm(true)
                  : handleClearSessions
              }
              disabled={action.id === "purge-gps" ? !!purgeState : !!sessionState}
            >
              {action.id === "purge-gps"
                ? purgeState || "Ejecutar Purga"
                : sessionState || "Limpiar Sesiones"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
