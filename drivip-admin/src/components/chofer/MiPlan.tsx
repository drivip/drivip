"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { choferProfile } from "@/mockData/choferData";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import MetricCard from "@/components/ui/MetricCard";
import Toast from "@/components/ui/Toast";

const PLUGIN_NAMES: Record<string, string> = {
  DISPATCH: "Dispatch",
  REFERRALS: "Referidos",
  DELIVERY: "Entregas",
  CUSTOM_DOMAIN: "Dominio Personalizado",
};

const PLUGIN_ICONS: Record<string, string> = {
  DISPATCH: "hub",
  REFERRALS: "share",
  DELIVERY: "storefront",
  CUSTOM_DOMAIN: "dns",
};

export default function MiPlan() {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const [plugins, setPlugins] = useState(choferProfile.plugins);

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const togglePlugin = (pluginKey: string) => {
    setPlugins((prev) => ({
      ...prev,
      [pluginKey]: !prev[pluginKey as keyof typeof prev],
    }));
    const isActive = plugins[pluginKey as keyof typeof plugins];
    showToast(
      isActive ? `${PLUGIN_NAMES[pluginKey] || pluginKey} desactivado` : `${PLUGIN_NAMES[pluginKey] || pluginKey} activado`
    );
  };

  const paymentHistory = [
    { date: "15 Oct 2025", description: "Mensualidad Octubre", amount: "$90.00", status: "PAGADO" },
    { date: "15 Sep 2025", description: "Mensualidad Septiembre", amount: "$90.00", status: "PAGADO" },
    { date: "15 Ago 2025", description: "Mensualidad Agosto", amount: "$95.00", status: "PAGADO" },
  ];

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-white">
          Mi Plan
        </h1>

        <div className="bg-surface-container border border-primary/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="active">ACTIVO</Badge>
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-white mb-2">
            {choferProfile.contract.plan}
          </h2>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="font-[family-name:var(--font-geist-mono)] text-4xl font-bold text-white">
              $90.00
            </span>
            <span className="font-[family-name:var(--font-geist-sans)] text-neutral-400">
              /mes
            </span>
          </div>
          <p className="font-[family-name:var(--font-geist-sans)] text-sm text-neutral-400">
            Proximo pago: 15 Nov 2025
          </p>
        </div>

        <div className="bg-surface-container rounded-xl p-6">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-white mb-4">
            Plugins Activos
          </h2>
          <div className="space-y-3">
            {Object.entries(plugins).map(([key, active]) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg bg-surface"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">
                    {PLUGIN_ICONS[key] || "extension"}
                  </span>
                  <span className="font-[family-name:var(--font-geist-sans)] text-white">
                    {PLUGIN_NAMES[key] || key}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={active ? "active" : "offline"}>
                    {active ? "ON" : "OFF"}
                  </Badge>
                  <Button
                    variant={active ? "destructive" : "primary"}
                    size="sm"
                    onClick={() => togglePlugin(key)}
                  >
                    {active ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container rounded-xl p-6">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-white mb-4">
            Historial de Pagos
          </h2>
          <div className="space-y-3">
            {paymentHistory.map((payment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-surface"
              >
                <div>
                  <p className="font-[family-name:var(--font-geist-sans)] text-white">
                    {payment.date}
                  </p>
                  <p className="font-[family-name:var(--font-geist-sans)] text-sm text-neutral-400">
                    {payment.description}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-[family-name:var(--font-geist-mono)] text-white">
                    {payment.amount}
                  </span>
                  <Badge variant="active">{payment.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          className="w-full"
          onClick={() => showToast("Funcionalidad de cambio de plan en desarrollo")}
        >
          Cambiar Plan
        </Button>

        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            visible={true}
            onDismiss={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          />
        ))}
      </div>
    </div>
  );
}
