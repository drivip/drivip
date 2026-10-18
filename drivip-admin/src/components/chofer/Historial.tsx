"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { carrerasData } from "@/mockData/carrerasData";
import Badge from "@/components/ui/Badge";
import SearchInput from "@/components/ui/SearchInput";
import FilterPills from "@/components/ui/FilterPills";
import MetricCard from "@/components/ui/MetricCard";

const PERIODO_OPTIONS = [
  { id: "todo", label: "Todo" },
  { id: "hoy", label: "Hoy" },
  { id: "ayer", label: "Ayer" },
  { id: "semana", label: "Esta semana" },
  { id: "mes", label: "Este mes" },
];

const ESTADO_OPTIONS = [
  { id: "todas", label: "Todas" },
  { id: "completadas", label: "Completadas" },
  { id: "canceladas", label: "Canceladas" },
];

const PAGO_OPTIONS = [
  { id: "todos", label: "Todos" },
  { id: "efectivo", label: "Efectivo" },
  { id: "pago_movil", label: "Pago Móvil" },
  { id: "transferencia", label: "Transferencia" },
];

function getPeriodoDate(id: string): Date | null {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (id) {
    case "hoy":
      return startOfToday;
    case "ayer": {
      const d = new Date(startOfToday);
      d.setDate(d.getDate() - 1);
      return d;
    }
    case "semana": {
      const d = new Date(startOfToday);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case "mes": {
      const d = new Date(startOfToday);
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    default:
      return null;
  }
}

function parsePaymentMethodFilter(id: string): string | null {
  switch (id) {
    case "efectivo":
      return "Efectivo";
    case "pago_movil":
      return "Pago Movil";
    case "transferencia":
      return "Transferencia";
    default:
      return null;
  }
}

function formatBs(value: number): string {
  return `Bs ${value.toLocaleString("es-VE")}`;
}

function getPaymentIcon(method: string): string {
  switch (method) {
    case "Efectivo":
      return "paid";
    case "Pago Movil":
      return "smartphone";
    case "Transferencia":
      return "account_balance";
    default:
      return "payment";
  }
}

export default function Historial() {
  const [search, setSearch] = useState("");
  const [periodo, setPeriodo] = useState("todo");
  const [estado, setEstado] = useState("todas");
  const [pago, setPago] = useState("todos");

  const filtered = useMemo(() => {
    let result = [...carrerasData];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.clientName.toLowerCase().includes(q));
    }

    const periodoDate = getPeriodoDate(periodo);
    if (periodoDate) {
      result = result.filter((r) => new Date(r.date) >= periodoDate);
    }

    if (estado === "completadas") {
      result = result.filter((r) => r.status === "COMPLETADA");
    } else if (estado === "canceladas") {
      result = result.filter((r) => r.status === "CANCELADA");
    }

    const pagoFilter = parsePaymentMethodFilter(pago);
    if (pagoFilter) {
      result = result.filter((r) => r.paymentMethod === pagoFilter);
    }

    return result;
  }, [search, periodo, estado, pago]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const completadas = filtered.filter((r) => r.status === "COMPLETADA").length;
    const canceladas = filtered.filter((r) => r.status === "CANCELADA").length;
    const ingresoTotal = filtered.reduce((sum, r) => sum + r.fare, 0);
    const promedio = total > 0 ? Math.round(ingresoTotal / total) : 0;
    const rated = filtered.filter((r) => r.rating > 0);
    const calificacion =
      rated.length > 0
        ? (rated.reduce((sum, r) => sum + r.rating, 0) / rated.length).toFixed(1)
        : "—";
    return { total, completadas, canceladas, ingresoTotal, promedio, calificacion };
  }, [filtered]);

  return (
    <div className="bg-surface min-h-screen p-4 pb-24">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-[22px] font-bold text-white">
            Historial
          </h1>
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-neutral-400">
            {stats.total} carreras
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchInput
          placeholder="Buscar por nombre del cliente..."
          value={search}
          onChange={setSearch}
        />
      </div>

      {/* Filter pills */}
      <div className="mb-4 space-y-2">
        <div>
          <p className="mb-1 font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-wide text-neutral-500">
            Periodo
          </p>
          <FilterPills
            options={PERIODO_OPTIONS}
            activeId={periodo}
            onChange={setPeriodo}
          />
        </div>
        <div>
          <p className="mb-1 font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-wide text-neutral-500">
            Estado
          </p>
          <FilterPills
            options={ESTADO_OPTIONS}
            activeId={estado}
            onChange={setEstado}
          />
        </div>
        <div>
          <p className="mb-1 font-[family-name:var(--font-geist-mono)] text-[9px] uppercase tracking-wide text-neutral-500">
            Método de pago
          </p>
          <FilterPills
            options={PAGO_OPTIONS}
            activeId={pago}
            onChange={setPago}
          />
        </div>
      </div>

      {/* Stats summary */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <MetricCard
          label="Total"
          value={String(stats.total)}
          icon="local_taxi"
          compact
        />
        <MetricCard
          label="Completadas"
          value={String(stats.completadas)}
          icon="check_circle"
          compact
        />
        <MetricCard
          label="Canceladas"
          value={String(stats.canceladas)}
          icon="cancel"
          compact
        />
      </div>
      <div className="mb-5 grid grid-cols-3 gap-3">
        <MetricCard
          label="Ingreso total"
          value={formatBs(stats.ingresoTotal)}
          icon="payments"
          compact
        />
        <MetricCard
          label="Promedio"
          value={formatBs(stats.promedio)}
          icon="trending_up"
          compact
        />
        <MetricCard
          label="Calificación"
          value={stats.calificacion}
          suffix="★"
          icon="star"
          compact
        />
      </div>

      {/* Ride list */}
      <div>
        <p className="mb-3 font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-white">
          Carreras
        </p>
        {filtered.length === 0 ? (
          <div className="rounded-xl bg-surface-container p-8 text-center">
            <span className="material-symbols-outlined text-[36px] text-neutral-600">
              search_off
            </span>
            <p className="mt-3 font-[family-name:var(--font-space-grotesk)] text-[14px] font-bold text-white">
              Sin resultados
            </p>
            <p className="mt-1 font-[family-name:var(--font-geist-sans)] text-[12px] text-neutral-400">
              No se encontraron carreras con los filtros seleccionados
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((ride) => (
              <div key={ride.id} className="rounded-xl bg-surface-container p-3">
                {/* Top row: client + status + fare */}
                <div className="mb-2 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-[family-name:var(--font-geist-sans)] text-[12px] font-semibold text-white truncate">
                        {ride.clientName}
                      </p>
                      <Badge
                        variant={
                          ride.status === "COMPLETADA" ? "active" : "overdue"
                        }
                        className="flex-shrink-0"
                      >
                        {ride.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 font-[family-name:var(--font-geist-mono)] text-[10px] text-neutral-500">
                      {ride.date} • {ride.time}
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0 text-right">
                    <p className="font-[family-name:var(--font-space-grotesk)] text-[14px] font-bold text-secondary">
                      {formatBs(ride.fare)}
                    </p>
                  </div>
                </div>

                {/* Route */}
                <div className="mb-2 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full bg-secondary" />
                    <span className="font-[family-name:var(--font-geist-sans)] text-[11px] text-neutral-300 truncate">
                      {ride.origin}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full bg-error" />
                    <span className="font-[family-name:var(--font-geist-sans)] text-[11px] text-neutral-300 truncate">
                      {ride.destination}
                    </span>
                  </div>
                </div>

                {/* Metrics row */}
                <div className="mb-2 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-neutral-500">
                      schedule
                    </span>
                    <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-neutral-400">
                      {ride.duration} min
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-neutral-500">
                      straighten
                    </span>
                    <span className="font-[family-name:var(--font-geist-mono)] text-[10px] text-neutral-400">
                      {ride.distance} km
                    </span>
                  </div>
                </div>

                {/* Bottom row: payment + rating */}
                <div className="flex items-center justify-between border-t border-outline-variant/20 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[13px] text-primary">
                      {getPaymentIcon(ride.paymentMethod)}
                    </span>
                    <span className="font-[family-name:var(--font-geist-sans)] text-[11px] text-neutral-400">
                      {ride.paymentMethod}
                    </span>
                  </div>
                  {ride.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-[#fbbf24]">
                        star
                      </span>
                      <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-[#fbbf24]">
                        {ride.rating}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
