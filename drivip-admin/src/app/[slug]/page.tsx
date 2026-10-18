"use client";

import { useParams } from "next/navigation";
import { resolveTenant } from "@/lib/tenantResolver";
import dynamic from "next/dynamic";

const ChoferDashboard = dynamic(() => import("@/app/chofer/page"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-surface">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-[family-name:var(--font-geist-mono)] text-[12px] text-on-surface-variant">
          Cargando panel...
        </p>
      </div>
    </div>
  ),
});

const LineaDashboard = dynamic(() => import("@/app/linea/page"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-surface">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-tertiary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-[family-name:var(--font-geist-mono)] text-[12px] text-on-surface-variant">
          Cargando despacho...
        </p>
      </div>
    </div>
  ),
});

export default function TenantPage() {
  const params = useParams();
  const slug = params.slug as string;
  const tenant = resolveTenant(slug);

  if (!tenant) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-[48px] text-outline">
            error
          </span>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-[20px] text-on-surface font-bold">
            Tenant no encontrado
          </h1>
          <p className="font-[family-name:var(--font-geist-sans)] text-[14px] text-on-surface-variant">
            El slug <span className="text-primary font-mono">/{slug}</span> no
            existe en el sistema.
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 rounded-lg bg-primary-container text-on-primary font-[family-name:var(--font-geist-mono)] text-[12px] font-semibold"
          >
            Volver al portal
          </a>
        </div>
      </div>
    );
  }

  if (tenant.type === "linea") {
    return <LineaDashboard />;
  }

  return <ChoferDashboard />;
}
