"use client";

import { useState, useMemo } from "react";
import MetricCard from "@/components/ui/MetricCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";
import FilterPills from "@/components/ui/FilterPills";
import Toast from "@/components/ui/Toast";
import { lineaDrivers } from "@/mockData/lineaData";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<string, string> = {
  ONLINE: "bg-secondary",
  OCUPADO: "bg-amber-500",
  EN_RUTA: "bg-primary",
  OFFLINE: "bg-outline",
};

const STATUS_BADGE: Record<string, "active" | "warning" | "active" | "offline"> = {
  ONLINE: "active",
  OCUPADO: "warning",
  EN_RUTA: "active",
  OFFLINE: "offline",
};

const FILTER_OPTIONS = [
  { id: "all", label: "Todos" },
  { id: "ONLINE", label: "Online" },
  { id: "OCUPADO", label: "Ocupados" },
  { id: "OFFLINE", label: "Offline" },
];

export default function FlotaChoferes() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const stats = useMemo(() => {
    const online = lineaDrivers.filter((d) => d.status === "ONLINE").length;
    const busy = lineaDrivers.filter((d) => d.status === "OCUPADO").length;
    const offline = lineaDrivers.filter((d) => d.status === "OFFLINE").length;
    const todayTrips = lineaDrivers.reduce((a, d) => a + d.todayTrips, 0);
    return { online, busy, offline, todayTrips };
  }, []);

  const filteredDrivers = useMemo(() => {
    return lineaDrivers.filter((d) => {
      const matchSearch =
        !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.vehicle.plate.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || d.status === filter;
      return matchSearch && matchFilter;
    });
  }, [search, filter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-[22px] font-bold text-on-surface">
          Flota de Choferes
        </h1>
        <span className="font-[family-name:var(--font-geist-mono)] text-[12px] text-on-surface-variant">
          {lineaDrivers.length} total
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Online"
          value={String(stats.online)}
          icon="cell_tower"
          compact
          className="border-secondary/20"
        />
        <MetricCard
          label="Ocupados"
          value={String(stats.busy)}
          icon="busy"
          compact
          className="border-amber-500/20"
        />
        <MetricCard
          label="Offline"
          value={String(stats.offline)}
          icon="wifi_off"
          compact
          className="border-outline/20"
        />
        <MetricCard
          label="Viajes Hoy"
          value={String(stats.todayTrips)}
          icon="route"
          compact
          className="border-tertiary/20"
        />
      </div>

      <div className="flex flex-col gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o placa..."
        />
        <FilterPills
          options={FILTER_OPTIONS}
          activeId={filter}
          onChange={setFilter}
        />
      </div>

      <div className="flex flex-col gap-3">
        {filteredDrivers.map((driver) => (
          <div
            key={driver.id}
            className="bg-surface-container rounded-xl p-4 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-tertiary/15 flex items-center justify-center">
                  <span className="font-[family-name:var(--font-space-grotesk)] text-[14px] font-bold text-tertiary">
                    {driver.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-container",
                    STATUS_DOT[driver.status]
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-[family-name:var(--font-geist-sans)] text-[13px] font-semibold text-on-surface truncate">
                    {driver.name}
                  </p>
                  <Badge variant={STATUS_BADGE[driver.status]}>
                    {driver.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant">
                  {driver.vehicle.plate} — {driver.vehicle.model}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-on-surface-variant">
              <span className="flex items-center gap-1 font-[family-name:var(--font-geist-sans)] text-[12px]">
                <span className="text-amber-400">★</span> {driver.rating}
              </span>
              <span className="font-[family-name:var(--font-geist-sans)] text-[12px]">
                {driver.todayTrips} hoy
              </span>
              <span className="font-[family-name:var(--font-geist-sans)] text-[12px]">
                {driver.totalTrips.toLocaleString()} total
              </span>
            </div>

            <button
              onClick={() =>
                setExpandedId(expandedId === driver.id ? null : driver.id)
              }
              className="font-[family-name:var(--font-geist-mono)] text-[11px] text-tertiary hover:text-tertiary/80 text-left cursor-pointer"
            >
              {expandedId === driver.id ? "Ocultar acciones" : "Acciones"}
            </button>

            {expandedId === driver.id && (
              <div className="flex items-center gap-2 border-t border-outline/20 pt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    showToast(`Abriendo WhatsApp con ${driver.name}`)
                  }
                >
                  <span className="material-symbols-outlined text-[16px]">
                    chat
                  </span>
                  WhatsApp
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    showToast(`Llamando a ${driver.name}`)
                  }
                >
                  <span className="material-symbols-outlined text-[16px]">
                    call
                  </span>
                  Llamar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    showToast(`Precios enviados a ${driver.name}`)
                  }
                >
                  Enviar precios
                </Button>
              </div>
            )}
          </div>
        ))}

        {filteredDrivers.length === 0 && (
          <div className="bg-surface-container rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant mb-2 block">
              search_off
            </span>
            <p className="font-[family-name:var(--font-geist-sans)] text-[14px] text-on-surface-variant">
              No se encontraron choferes
            </p>
          </div>
        )}
      </div>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        icon="check_circle"
        variant="success"
        onDismiss={() => setToastVisible(false)}
      />
    </div>
  );
}
