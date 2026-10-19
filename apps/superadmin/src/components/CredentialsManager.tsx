import { useState } from "react";
import { Badge } from "@drivip/ui";

const env = (import.meta as unknown as { env: Record<string, string> }).env ?? {};
const projectUrl = env.VITE_SUPABASE_URL ?? "";
const anonKey = env.VITE_SUPABASE_ANON_KEY ?? "";
const projectRef = projectUrl.replace(/^https?:\/\//, "").split(".")[0];

export default function CredentialsManager() {
  const [copied, setCopied] = useState(false);

  const copiarUrl = async () => {
    if (!projectUrl) return;
    await navigator.clipboard.writeText(projectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl p-4 space-y-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
      <h3 className="text-[14px] lg:text-[16px] font-black text-slate-900">Credenciales del Proyecto</h3>

      <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] lg:text-[13px] font-bold text-slate-900">Supabase</span>
              <Badge variant={projectUrl ? "active" : "offline"}>{projectUrl ? "Conectado" : "Sin configurar"}</Badge>
            </div>
            <span className="font-mono text-[11px] text-slate-500 block truncate max-w-[240px]">
              {projectUrl || "VITE_SUPABASE_URL no definida"}
            </span>
            <div className="text-[10px] text-slate-500">
              {projectRef ? `Proyecto: ${projectRef}` : "Configura las variables de entorno"}
            </div>
          </div>
          <button
            onClick={copiarUrl}
            disabled={!projectUrl}
            className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-[10px] font-bold active:scale-95 transition disabled:opacity-50"
          >
            {copied ? "Copiado" : "Copiar URL"}
          </button>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          anon key: {anonKey ? `${anonKey.slice(0, 12)}••••${anonKey.slice(-6)}` : "no definida"}
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        Las claves privadas (service role, CRON_SECRET) se gestionan únicamente en el panel de Supabase y nunca se
        exponen en el frontend.
      </p>

      <a
        href={projectRef ? `https://supabase.com/dashboard/project/${projectRef}/settings/api` : "https://supabase.com/dashboard"}
        target="_blank"
        rel="noreferrer"
        className="block text-center w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-[11px] font-bold active:scale-[0.98] transition shadow-md"
      >
        Abrir panel de Supabase
      </a>
    </div>
  );
}
