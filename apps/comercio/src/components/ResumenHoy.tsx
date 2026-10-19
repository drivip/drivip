import { MetricCard } from "@drivip/ui";
import type { PedidoComercio } from "@drivip/types";

function esHoy(iso: string): boolean {
  const d = new Date(iso);
  const hoy = new Date();
  return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth() && d.getDate() === hoy.getDate();
}

export default function ResumenHoy({ pedidos }: { pedidos: PedidoComercio[] }) {
  const deHoy = pedidos.filter((p) => esHoy(p.created_at) && p.estado !== "cancelado");
  const ingresos = deHoy.reduce((sum, p) => sum + Number(p.total), 0);

  return (
    <div>
      <h3 className="text-[12px] font-mono text-on-surface-variant uppercase tracking-wider mb-3">Hoy</h3>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Pedidos" value={String(deHoy.length)} icon="shopping_bag" />
        <MetricCard label="Ingresos" value={`$${ingresos.toFixed(2)}`} icon="payments" />
      </div>
    </div>
  );
}
