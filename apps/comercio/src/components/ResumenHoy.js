import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MetricCard } from "@drivip/ui";
export default function ResumenHoy() {
    return (_jsxs("div", { children: [_jsx("h3", { className: "text-[12px] font-mono text-on-surface-variant uppercase tracking-wider mb-3", children: "Hoy" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(MetricCard, { label: "Pedidos", value: "8", icon: "shopping_bag" }), _jsx(MetricCard, { label: "Ingresos", value: "$45.00", icon: "payments" })] })] }));
}
