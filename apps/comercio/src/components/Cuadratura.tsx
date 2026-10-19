import type { PedidoComercio } from "@drivip/types";

function inicioSemana(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function Cuadratura({ pedidos }: { pedidos: PedidoComercio[] }) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const semana = inicioSemana();

  const validos = pedidos.filter((p) => p.estado !== "cancelado");
  const diarios = validos.filter((p) => new Date(p.created_at) >= hoy);
  const semanales = validos.filter((p) => new Date(p.created_at) >= semana);

  const total = (rows: PedidoComercio[]) => rows.reduce((sum, p) => sum + Number(p.total), 0);

  return (
    <div className="bg-surface-container rounded-xl p-4">
      <h3 className="text-[12px] font-mono text-on-surface-variant uppercase tracking-wider mb-3">Cuadratura</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-surface-container-high">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-primary">calendar_today</span>
            <span className="text-[13px] text-on-surface">Cuentas diarias</span>
          </div>
          <div className="text-right">
            <span className="font-mono text-[13px] text-on-surface font-bold block">${total(diarios).toFixed(2)}</span>
            <span className="font-mono text-[10px] text-on-surface-variant">{diarios.length} pedidos</span>
          </div>
        </div>
        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-surface-container-high">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-primary">date_range</span>
            <span className="text-[13px] text-on-surface">Cuentas semanales</span>
          </div>
          <div className="text-right">
            <span className="font-mono text-[13px] text-on-surface font-bold block">${total(semanales).toFixed(2)}</span>
            <span className="font-mono text-[10px] text-on-surface-variant">{semanales.length} pedidos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
