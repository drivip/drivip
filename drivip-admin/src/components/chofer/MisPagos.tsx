"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { choferProfile, choferStats } from "@/mockData/choferData";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import MetricCard from "@/components/ui/MetricCard";
import FilterPills from "@/components/ui/FilterPills";
import Toast from "@/components/ui/Toast";

type PaymentEntry = {
  date: string;
  client: string;
  method: string;
  amount: number;
  status: "Cobrado" | "Por cobrar";
};

const mockPayments: PaymentEntry[] = [
  { date: "Hoy, 10:30 AM", client: "Maria G.", method: "Efectivo", amount: 350, status: "Cobrado" },
  { date: "Hoy, 11:15 AM", client: "Pedro L.", method: "Pago Movil", amount: 280, status: "Cobrado" },
  { date: "Hoy, 12:00 PM", client: "Ana M.", method: "Pendiente", amount: 420, status: "Por cobrar" },
  { date: "Ayer, 2:45 PM", client: "Carlos H.", method: "Efectivo", amount: 220, status: "Cobrado" },
  { date: "Ayer, 9:15 AM", client: "Maria G.", method: "Efectivo", amount: 275, status: "Cobrado" },
];

const paymentMethods = [
  {
    id: "efectivo",
    name: "Efectivo",
    active: true,
    icon: "payments",
    fields: [],
  },
  {
    id: "pago-movil",
    name: "Pago Móvil",
    active: false,
    icon: "smartphone",
    fields: ["Teléfono", "Cédula", "Banco"],
  },
  {
    id: "transferencia",
    name: "Transferencia",
    active: false,
    icon: "account_balance",
    fields: ["Banco", "Nº Cuenta", "Titular"],
  },
];

const filterOptions = [
  { id: "Hoy", label: "Hoy" },
  { id: "Semana", label: "Semana" },
  { id: "Mes", label: "Mes" },
  { id: "Todo", label: "Todo" },
  { id: "Por método", label: "Por método" },
];

const cuotaDetails = [
  { label: "Plan Base", amount: 35.0 },
  { label: "DISPATCH", amount: 45.0 },
  { label: "REFERRALS", amount: 25.0 },
  { label: "Descuento referidos (3)", amount: -15.0 },
];

export default function MisPagos() {
  const [activeFilter, setActiveFilter] = useState("Hoy");
  const [toast, setToast] = useState<{ message: string; variant?: "success" | "error" | "info" } | null>(null);

  const filteredPayments = mockPayments.filter((p) => {
    if (activeFilter === "Todo") return true;
    if (activeFilter === "Hoy") return p.date.startsWith("Hoy");
    if (activeFilter === "Semana") return true;
    if (activeFilter === "Mes") return true;
    if (activeFilter === "Por método") return true;
    return true;
  });

  const pendingTotal = mockPayments
    .filter((p) => p.status === "Por cobrar")
    .reduce((sum, p) => sum + p.amount, 0);

  const cuotaTotal = cuotaDetails.reduce((sum, item) => sum + item.amount, 0);

  const showToast = (message: string, variant: "success" | "error" | "info" = "info") => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 3000);
  };

  const handleConfigureMethod = (methodName: string) => {
    showToast(`Configurando ${methodName}...`, "info");
  };

  return (
    <div className="min-h-screen bg-[#0c1324] text-white p-4 md:p-6 space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          visible={true}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}

      <header className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-[family-name:var(--font-space-grotesk)] font-bold">
          Mis Pagos
        </h1>
        <Button
          variant="outline"
          className="font-[family-name:var(--font-geist-sans)]"
          onClick={() => showToast("Exportando reporte...", "info")}
        >
          <span className="material-symbols-outlined text-sm mr-2">download</span>
          Exportar
        </Button>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-[family-name:var(--font-space-grotesk)] font-semibold">
          Métodos de Pago
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="bg-surface-container rounded-xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">
                    {method.icon}
                  </span>
                  <span className="font-[family-name:var(--font-geist-sans)] font-medium">
                    {method.name}
                  </span>
                </div>
                <Badge
                  variant={method.active ? "active" : "warning"}
                  className="font-[family-name:var(--font-geist-mono)] text-xs"
                >
                  {method.active ? "ACTIVO" : "CONFIGURAR"}
                </Badge>
              </div>

              {method.fields.length > 0 && !method.active && (
                <div className="space-y-2 mt-2">
                  {method.fields.map((field) => (
                    <div key={field} className="bg-surface rounded-lg p-2">
                      <span className="text-xs text-gray-400 font-[family-name:var(--font-geist-mono)]">
                        {field}
                      </span>
                      <div className="h-3 bg-surface-container rounded mt-1" />
                    </div>
                  ))}
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full font-[family-name:var(--font-geist-sans)]"
                    onClick={() => handleConfigureMethod(method.name)}
                  >
                    Configurar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-[family-name:var(--font-space-grotesk)] font-semibold">
          Resumen Financiero
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Ingreso Hoy"
            value="$2,450 Bs"
            icon="today"
            className="font-[family-name:var(--font-geist-sans)]"
          />
          <MetricCard
            label="Ingreso Semanal"
            value="$16,800 Bs"
            icon="date_range"
            className="font-[family-name:var(--font-geist-sans)]"
          />
          <MetricCard
            label="Ingreso Mensual"
            value="$68,200 Bs"
            icon="calendar_month"
            className="font-[family-name:var(--font-geist-sans)]"
          />
          <MetricCard
            label="Promedio por Carrera"
            value="$204 Bs"
            icon="average"
            className="font-[family-name:var(--font-geist-sans)]"
          />
        </div>
      </section>

      {pendingTotal > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-400">warning</span>
          <div>
            <p className="font-[family-name:var(--font-geist-sans)] font-medium text-amber-300">
              Pendiente por cobrar
            </p>
            <p className="font-[family-name:var(--font-geist-mono)] text-sm text-amber-400">
              ${pendingTotal} Bs
            </p>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-[family-name:var(--font-space-grotesk)] font-semibold">
            Historial de Pagos
          </h2>
        </div>
        <FilterPills
          options={filterOptions}
          activeId={activeFilter}
          onChange={setActiveFilter}
          className="font-[family-name:var(--font-geist-sans)]"
        />
        <div className="space-y-2">
          {filteredPayments.map((payment, index) => (
            <div
              key={index}
              className="bg-surface-container rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                  <span className="material-symbols-outlined text-[var(--color-secondary)]">
                    person
                  </span>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-geist-sans)] font-medium">
                    {payment.client}
                  </p>
                  <p className="text-xs text-gray-400 font-[family-name:var(--font-geist-mono)]">
                    {payment.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-[family-name:var(--font-geist-mono)] font-semibold">
                    ${payment.amount} Bs
                  </p>
                  <p className="text-xs text-gray-400 font-[family-name:var(--font-geist-mono)]">
                    {payment.method}
                  </p>
                </div>
                <Badge
                  variant={payment.status === "Cobrado" ? "active" : "warning"}
                  className="font-[family-name:var(--font-geist-mono)] text-xs"
                >
                  {payment.status === "Cobrado" ? "Cobrado" : "Por cobrar"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-[family-name:var(--font-space-grotesk)] font-semibold">
          Cuota Mensual Drivip
        </h2>
        <div className="bg-surface-container rounded-xl p-4 space-y-4">
          <div className="space-y-2">
            {cuotaDetails.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between font-[family-name:var(--font-geist-sans)]"
              >
                <span className={cn("text-sm", item.amount < 0 ? "text-[var(--color-secondary)]" : "text-gray-300")}>
                  {item.label}
                </span>
                <span
                  className={cn(
                    "font-[family-name:var(--font-geist-mono)] text-sm",
                    item.amount < 0 ? "text-[var(--color-secondary)]" : "text-white"
                  )}
                >
                  {item.amount < 0 ? "-" : "+"}${Math.abs(item.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-700 pt-3 flex items-center justify-between">
            <span className="font-[family-name:var(--font-geist-sans)] font-semibold">
              Total
            </span>
            <span className="font-[family-name:var(--font-geist-mono)] text-lg font-bold text-[var(--color-primary)]">
              ${cuotaTotal.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 font-[family-name:var(--font-geist-sans)]">
              Próximo pago: 15 de Noviembre
            </span>
            <Badge
              variant="active"
              className="font-[family-name:var(--font-geist-mono)]"
            >
              AL DÍA
            </Badge>
          </div>
        </div>
      </section>
    </div>
  );
}
