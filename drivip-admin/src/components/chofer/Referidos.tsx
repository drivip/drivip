"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { choferProfile } from "@/mockData/choferData";
import Button from "@/components/ui/Button";
import MetricCard from "@/components/ui/MetricCard";
import Toast from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";

export default function Referidos() {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const referralCode = choferProfile.referralCode || "CHO-2847-XYZ";

  const referrals = [
    { name: "Pedro Ramirez", date: "15 Jul 2025", status: "ACTIVO", discount: "-$5.00/mes" },
    { name: "Luis Morales", date: "20 Ago 2025", status: "ACTIVO", discount: "-$5.00/mes" },
    { name: "Carmen Herrera", date: "01 Sep 2025", status: "ACTIVO", discount: "-$5.00/mes" },
  ];

  const activeReferrals = referrals.filter((r) => r.status === "ACTIVO").length;
  const monthlyDiscount = activeReferrals * 5;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    showToast("Codigo copiado al portapapeles");
  };

  const shareWhatsApp = () => {
    const message = encodeURIComponent(
      `Usa mi codigo de referido ${referralCode} en Drivip y obtén beneficios al registrarte como chofer: https://drivip.com/ref/${referralCode}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-white">
          Referidos
        </h1>

        <div className="bg-surface-container border border-primary/20 rounded-xl p-6">
          <p className="font-[family-name:var(--font-geist-mono)] text-sm text-neutral-400 mb-2">
            Mi Codigo
          </p>
          <div className="flex items-center gap-4 mb-4">
            <span className="font-[family-name:var(--font-geist-mono)] text-3xl font-bold text-primary tracking-wider">
              {referralCode}
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={copyCode}>
              <span className="material-symbols-outlined text-sm mr-1">content_copy</span>
              Copiar
            </Button>
            <Button variant="primary" size="sm" onClick={shareWhatsApp}>
              <span className="material-symbols-outlined text-sm mr-1">chat</span>
              Compartir por WhatsApp
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label="Referidos Activos"
            value={activeReferrals.toString()}
            icon="group"
          />
          <MetricCard
            label="Descuento/Mes"
            value={`-$${monthlyDiscount}.00`}
            icon="savings"
          />
        </div>

        <div className="bg-surface-container rounded-xl p-6">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-white mb-4">
            Mis Referidos
          </h2>
          <div className="space-y-3">
            {referrals.map((referral, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-surface"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">person</span>
                  </div>
                  <div>
                    <p className="font-[family-name:var(--font-geist-sans)] text-white font-medium">
                      {referral.name}
                    </p>
                    <p className="font-[family-name:var(--font-geist-sans)] text-sm text-neutral-400">
                      {referral.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="active">{referral.status}</Badge>
                  <span className="font-[family-name:var(--font-geist-mono)] text-secondary text-sm">
                    {referral.discount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container rounded-xl p-4">
          <p className="font-[family-name:var(--font-geist-sans)] text-sm text-neutral-400">
            Por cada chofer que registres con tu codigo, recibiras un descuento de{" "}
            <span className="text-secondary font-semibold">$5.00</span> en tu plan mensual.
            El descuento se aplica automaticamente en tu proximo pago.
          </p>
        </div>

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
