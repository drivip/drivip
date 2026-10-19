import type { PedidoComercio, PedidoComercioEstado } from "@drivip/types";

const statusConfig: Record<PedidoComercioEstado, { color: string; label: string; bg: string }> = {
  pendiente: { color: "text-warning", label: "Pendiente", bg: "bg-warning/10" },
  preparando: { color: "text-warning", label: "Preparando", bg: "bg-warning/10" },
  en_camino: { color: "text-primary", label: "En camino", bg: "bg-primary/10" },
  entregado: { color: "text-success", label: "Entregado", bg: "bg-success/10" },
  cancelado: { color: "text-error", label: "Cancelado", bg: "bg-error/10" },
};

const siguienteEstado: Partial<Record<PedidoComercioEstado, PedidoComercioEstado>> = {
  pendiente: "preparando",
  preparando: "en_camino",
  en_camino: "entregado",
};

interface Props {
  pedidos: PedidoComercio[];
  loading?: boolean;
  expanded?: boolean;
  onUpdateEstado?: (id: string, estado: PedidoComercioEstado) => Promise<{ error: string | null }>;
}

export default function PedidosActivos({ pedidos, loading, expanded = false, onUpdateEstado }: Props) {
  const visibles = expanded
    ? pedidos
    : pedidos.filter((p) => p.estado !== "entregado" && p.estado !== "cancelado");

  return (
    <div className="bg-surface-container rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-mono text-on-surface-variant uppercase tracking-wider">
          {expanded ? "Todos los pedidos" : "Pedidos activos"}
        </h3>
        {!expanded && (
          <span className="font-mono text-[12px] text-secondary font-semibold">{visibles.length} activos</span>
        )}
      </div>

      {loading && <p className="text-[12px] text-on-surface-variant py-4 text-center">Cargando pedidos...</p>}

      {!loading && visibles.length === 0 && (
        <p className="text-[12px] text-on-surface-variant py-4 text-center">No hay pedidos registrados</p>
      )}

      <div className="space-y-3">
        {visibles.map((pedido) => {
          const config = statusConfig[pedido.estado];
          const next = siguienteEstado[pedido.estado];
          const items = pedido.items ?? [];
          return (
            <div key={pedido.id} className="bg-surface-container-high rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[14px] text-on-surface font-bold">#{pedido.id.slice(0, 6)}</span>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                <span className="font-mono text-[13px] text-on-surface font-bold">${Number(pedido.total).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                {items.length > 0
                  ? items.map((i) => `${i.cantidad}x ${i.nombre}`).join(", ")
                  : "Sin detalle de productos"}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                  {pedido.cliente_nombre}
                  {pedido.direccion_entrega ? ` · ${pedido.direccion_entrega}` : ""}
                </div>
                {next && onUpdateEstado && (
                  <button
                    onClick={() => { void onUpdateEstado(pedido.id, next); }}
                    className="text-[12px] text-primary font-semibold flex items-center gap-1"
                  >
                    Marcar {statusConfig[next].label.toLowerCase()}
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
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
