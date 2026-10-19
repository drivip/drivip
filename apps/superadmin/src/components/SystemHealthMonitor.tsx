import { useEffect, useState } from "react";
import { supabase } from "@drivip/supabase";

type Estado = "operational" | "degraded" | "outage";

interface Servicio {
  nombre: string;
  estado: Estado;
  latencia: string;
  detalle: string;
}

const estadoColors: Record<Estado, { bg: string; text: string; label: string }> = {
  operational: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Operational" },
  degraded: { bg: "bg-amber-100", text: "text-amber-700", label: "Degraded" },
  outage: { bg: "bg-red-100", text: "text-red-700", label: "Outage" },
};

export default function SystemHealthMonitor() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const checks: Servicio[] = [];

      const dbStart = performance.now();
      const { error: dbError } = await supabase.from("tenants").select("id", { head: true, count: "exact" });
      const dbMs = Math.round(performance.now() - dbStart);
      checks.push({
        nombre: "Base de datos",
        estado: dbError ? "outage" : dbMs > 1500 ? "degraded" : "operational",
        latencia: `${dbMs} ms`,
        detalle: dbError ? dbError.message : "Consulta OK",
      });

      const authStart = performance.now();
      const { error: authError } = await supabase.auth.getSession();
      const authMs = Math.round(performance.now() - authStart);
      checks.push({
        nombre: "Autenticación",
        estado: authError ? "outage" : authMs > 1500 ? "degraded" : "operational",
        latencia: `${authMs} ms`,
        detalle: authError ? authError.message : "Sesión verificada",
      });

      const tasaStart = performance.now();
      const { data: tasa, error: tasaError } = await supabase.rpc("get_tasa_actual", { p_moneda: "USD" });
      const tasaMs = Math.round(performance.now() - tasaStart);
      const fecha = (tasa as { fecha?: string } | null)?.fecha;
      const hoy = new Date().toISOString().slice(0, 10);
      checks.push({
        nombre: "Tasa BCV",
        estado: tasaError ? "outage" : !fecha ? "degraded" : fecha.slice(0, 10) === hoy ? "operational" : "degraded",
        latencia: `${tasaMs} ms`,
        detalle: tasaError ? tasaError.message : fecha ? `Última: ${new Date(fecha).toLocaleString("es-VE")}` : "Sin tasa registrada",
      });

      if (!cancelled) {
        setServicios(checks);
        setLoading(false);
      }
    };

    void run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white rounded-2xl p-4 space-y-4 border border-slate-100" style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}>
      <h3 className="text-[14px] lg:text-[16px] font-black text-slate-900">Salud del Sistema</h3>
      {loading ? (
        <p className="text-[12px] text-slate-400 py-4 text-center">Verificando servicios...</p>
      ) : (
        <div className="space-y-2">
          {servicios.map((s) => {
            const colors = estadoColors[s.estado];
            return (
              <div key={s.nombre} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-[12px] lg:text-[13px] text-slate-900 font-medium">{s.nombre}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] lg:text-[10px] font-bold ${colors.bg} ${colors.text}`}>{colors.label}</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span>{s.latencia}</span>
                  <span className="max-w-[180px] truncate" title={s.detalle}>{s.detalle}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
