"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";

export default function RenewModal({ tenant, open, onClose }: { tenant: any; open: boolean; onClose: () => void }) {
  const [plan, setPlan] = useState("monthly");
  const [paymentMethod, setPaymentMethod] = useState("Pago Movil");
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  if (!open || !tenant) return null;

  const plans = [
    { id: "monthly", label: "Mensual", price: tenant.contract?.monthlyFee || 35, period: "/mes" },
    { id: "quarterly", label: "Trimestral", price: Math.round((tenant.contract?.monthlyFee || 35) * 3 * 0.9), period: "/3 meses" },
    { id: "annual", label: "Anual", price: Math.round((tenant.contract?.monthlyFee || 35) * 12 * 0.8), period: "/año" },
  ];

  const selectedPlan = plans.find((p) => p.id === plan) || plans[0];

  const handleRenew = () => {
    setToastMsg(`Suscripción renovada: ${tenant.name} — $${selectedPlan.price} ${selectedPlan.period}`);
    setToastVisible(true);
    setTimeout(() => onClose(), 1200);
  };

  return (
    <>
      <Toast message={toastMsg} visible={toastVisible} onDismiss={() => setToastVisible(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative w-full max-w-md bg-surface-container rounded-2xl shadow-2xl p-6 space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">payments</span>
              <h3 className="font-[family-name:var(--font-space-grotesk)] text-[17px] text-on-surface font-semibold">
                Renovar Suscripción
              </h3>
            </div>
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center">
              <span className="font-[family-name:var(--font-space-grotesk)] text-[13px] font-bold text-primary">
                {(tenant.name || "CH").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-[family-name:var(--font-geist-sans)] text-[14px] text-on-surface font-medium truncate">
                {tenant.businessName || tenant.name}
              </span>
              <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-on-surface-variant">
                {tenant.contract?.status === "PAST_DUE" ? "VENCIDO" : tenant.contract?.status === "SUSPENDED" ? "SUSPENDIDO" : "ACTIVO"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">
              Seleccionar Plan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                    plan === p.id
                      ? "border-primary bg-primary-container/10"
                      : "border-outline-variant/30 bg-surface-container-low hover:border-outline-variant"
                  }`}
                >
                  <span className={`font-[family-name:var(--font-geist-mono)] text-[10px] uppercase font-semibold ${
                    plan === p.id ? "text-primary" : "text-on-surface-variant"
                  }`}>
                    {p.label}
                  </span>
                  <span className={`font-[family-name:var(--font-space-grotesk)] text-[18px] font-bold ${
                    plan === p.id ? "text-on-surface" : "text-on-surface-variant"
                  }`}>
                    ${p.price}
                  </span>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[9px] text-on-surface-variant">
                    {p.period}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-[family-name:var(--font-geist-mono)] text-[10px] text-on-surface-variant uppercase">
              Método de Pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Pago Movil", "Zelle", "Transferencia"].map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 px-2 rounded-lg border text-[11px] font-[family-name:var(--font-geist-mono)] transition-all ${
                    paymentMethod === m
                      ? "border-primary bg-primary-container/10 text-primary font-semibold"
                      : "border-outline-variant/30 bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" className="flex-1 shadow-[0_0_16px_rgba(124,58,237,0.4)]" onClick={handleRenew}>
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Renovar ${selectedPlan.price}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
