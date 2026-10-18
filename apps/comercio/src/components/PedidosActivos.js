import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const mockPedidos = [
    { id: "#3421", producto: "Pan integral x2", conductor: "Jose (moto)", cliente: "Maria", status: "en_camino" },
    { id: "#3420", producto: "Croissant x4", conductor: "Pedro (taxi)", cliente: "Luis", status: "preparando" },
    { id: "#3419", producto: "Medialuna x6", conductor: "Ana (taxi)", cliente: "Carmen", status: "entregado" },
];
const statusConfig = {
    preparando: { color: "text-warning", label: "Preparando", bg: "bg-warning/10" },
    en_camino: { color: "text-primary", label: "En camino", bg: "bg-primary/10" },
    entregado: { color: "text-success", label: "Entregado", bg: "bg-success/10" },
};
export default function PedidosActivos({ expanded = false }) {
    const pedidos = expanded ? mockPedidos : mockPedidos.filter((p) => p.status !== "entregado");
    return (_jsxs("div", { className: "bg-surface-container rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-[12px] font-mono text-on-surface-variant uppercase tracking-wider", children: expanded ? "Todos los pedidos" : "Pedidos activos" }), !expanded && (_jsxs("span", { className: "font-mono text-[12px] text-secondary font-semibold", children: [pedidos.length, " activos"] }))] }), _jsx("div", { className: "space-y-3", children: pedidos.map((pedido) => {
                    const config = statusConfig[pedido.status];
                    return (_jsxs("div", { className: "bg-surface-container-high rounded-xl p-4 space-y-2", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-mono text-[14px] text-on-surface font-bold", children: pedido.id }), _jsx("span", { className: `text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`, children: config.label })] }) }), _jsxs("div", { className: "flex items-center gap-2 text-[12px] text-on-surface-variant", children: [_jsx("span", { className: "material-symbols-outlined text-[14px]", children: "inventory_2" }), pedido.producto] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 text-[12px] text-on-surface-variant", children: [_jsx("span", { className: "material-symbols-outlined text-[14px]", children: "directions_bike" }), pedido.conductor, " \u2192 ", pedido.cliente] }), pedido.status === "en_camino" && (_jsxs("button", { className: "text-[12px] text-primary font-semibold flex items-center gap-1", children: ["Ver en mapa", _jsx("span", { className: "material-symbols-outlined text-[14px]", children: "open_in_new" })] }))] })] }, pedido.id));
                }) })] }));
}
