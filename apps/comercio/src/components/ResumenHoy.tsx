import { MetricCard } from "@drivip/ui";

export default function ResumenHoy() {
  return (
    <div>
      <h3 className="text-[12px] font-mono text-on-surface-variant uppercase tracking-wider mb-3">Hoy</h3>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Pedidos" value="8" icon="shopping_bag" />
        <MetricCard label="Ingresos" value="$45.00" icon="payments" />
      </div>
    </div>
  );
}
