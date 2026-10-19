import { useState } from "react";
import type { Tenant } from "@drivip/types";
import { useReferidos } from "@drivip/supabase";

export default function Referidos({ tenant }: { tenant?: Tenant | null }) {
  const { referidos, loading } = useReferidos(tenant?.id);
  const [copied, setCopied] = useState(false);

  const codigo = tenant?.codigo_referido ?? "—";
  const activos = referidos.filter((r) => r.estado === "activo").length;

  const copiar = async () => {
    if (!tenant?.codigo_referido) return;
    try {
      await navigator.clipboard.writeText(tenant.codigo_referido);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const compartir = async () => {
    if (!tenant?.codigo_referido) return;
    const url = `${window.location.origin}?ref=${tenant.codigo_referido}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Únete a Drivip",
          text: `Regístrate como conductor con mi código ${tenant.codigo_referido}`,
          url,
        });
      } catch {
        /* usuario canceló */
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full">
      <h1 className="text-xl lg:text-2xl font-black text-slate-900">Referir Conductores</h1>

      <div className="bg-white rounded-3xl p-5 lg:p-6 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
          <span className="material-symbols-outlined text-[32px]">redeem</span>
        </div>
        <div>
          <h2 className="text-lg lg:text-xl font-black text-slate-900">Invita a otros conductores</h2>
          <p className="text-[11px] lg:text-xs text-slate-500 mt-1">Comparte tu código y gana créditos por cada referido</p>
        </div>

        <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 border-dashed">
          <p className="text-[10px] lg:text-[11px] text-slate-400 uppercase font-bold mb-1">Tu código de referido</p>
          <p className="text-xl lg:text-2xl font-black text-purple-700 font-mono tracking-wider">{codigo}</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-200">
          <span className="material-symbols-outlined text-[16px] text-purple-600">group</span>
          <span className="text-xs lg:text-sm font-bold text-purple-700">
            {loading ? "Cargando..." : `${referidos.length} referidos · ${activos} activos`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full">
          <button
            onClick={copiar}
            disabled={!tenant?.codigo_referido}
            className="py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 text-xs lg:text-sm font-bold active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">{copied ? "check" : "content_copy"}</span>
            {copied ? "Copiado" : "Copiar Código"}
          </button>
          <button
            onClick={compartir}
            disabled={!tenant?.codigo_referido}
            className="py-3 rounded-2xl bg-emerald-600 text-white text-xs lg:text-sm font-bold active:scale-95 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            Compartir
          </button>
        </div>
      </div>
    </div>
  );
}
