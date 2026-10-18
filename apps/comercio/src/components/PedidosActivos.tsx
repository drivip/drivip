import { MetricCard } from "@drivip/ui";

interface Pedido {
  id: string;
  producto: string;
  conductor: string;
  cliente: string;
  status: "preparando" | "en_camino" | "entregado";
}

const mockPedidos: Pedido[] = [
  { id: "#3421", producto: "Pan integral x2", conductor: "Jose (moto)", cliente: "Maria", status: "en_camino" },
  { id: "#3420", producto: "Croissant x4", conductor: "Pedro (taxi)", cliente: "Luis", status: "preparando" },
  { id: "#3419", producto: "Medialuna x6", conductor: "Ana (taxi)", cliente: "Carmen", status: "entregado" },
];

const statusConfig: Record<Pedido["status"], { color: string; label: string; bg: string }> = {
  preparando: { color: "text-warning", label: "Preparando", bg: "bg-warning/10" },
  en_camino: { color: "text-primary", label: "En camino", bg: "bg-primary/10" },
  entregado: { color: "text-success", label: "Entregado", bg: "bg-success/10" },
};

interface Props {
  expanded?: boolean;
}

export default function PedidosActivos({ expanded = false }: Props) {
  const pedidos = expanded ? mockPedidos : mockPedidos.filter((p) => p.status !== "entregado");

  return (
    <div className="bg-surface-container rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-mono text-on-surface-variant uppercase tracking-wider">
          {expanded ? "Todos los pedidos" : "Pedidos activos"}
        </h3>
        {!expanded && (
          <span className="font-mono text-[12px] text-secondary font-semibold">{pedidos.length} activos</span>
        )}
      </div>
      <div className="space-y-3">
        {pedidos.map((pedido) => {
          const config = statusConfig[pedido.status];
          return (
            <div key={pedido.id} className="bg-surface-container-high rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[14px] text-on-surface font-bold">{pedido.id}</span>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                    {config.label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                {pedido.producto}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">directions_bike</span>
                  {pedido.conductor} → {pedido.cliente}
                </div>
                {pedido.status === "en_camino" && (
                  <button className="text-[12px] text-primary font-semibold flex items-center gap-1">
                    Ver en mapa
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
