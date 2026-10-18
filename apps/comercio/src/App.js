import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { cn, HamburgerMenu } from "@drivip/ui";
import { AuthProvider, useAuthContext, useTenants } from "@drivip/supabase";
import PedidosActivos from "./components/PedidosActivos";
import ResumenHoy from "./components/ResumenHoy";
import Cuadratura from "./components/Cuadratura";
const navItems = [
    { id: "dashboard", icon: "home", label: "Inicio" },
    { id: "pedidos", icon: "shopping_bag", label: "Pedidos" },
    { id: "productos", icon: "inventory_2", label: "Productos" },
    { id: "reportes", icon: "analytics", label: "Reportes" },
    { id: "config", icon: "settings", label: "Config" },
];
function LoginScreen() {
    const { signIn, signUp, loading, error } = useAuthContext();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isRegister, setIsRegister] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isRegister) {
            await signUp(email, password);
        }
        else {
            await signIn(email, password);
        }
    };
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-surface p-4", children: _jsxs("div", { className: "w-full max-w-[360px] bg-surface-container rounded-2xl p-6 space-y-6", children: [_jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-[24px] text-on-secondary", children: "storefront" }) }), _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-[20px] font-bold text-on-surface font-display", children: "Drivip Comercio" }), _jsx("p", { className: "text-[12px] text-on-surface-variant", children: isRegister ? "Crear cuenta" : "Iniciar sesion" })] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-mono text-on-surface-variant uppercase", children: "Email" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full mt-1 bg-surface-container-high rounded-xl px-4 py-3 text-[14px] text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary-container", placeholder: "comercio@email.com", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-mono text-on-surface-variant uppercase", children: "Password" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full mt-1 bg-surface-container-high rounded-xl px-4 py-3 text-[14px] text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary-container", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] }), error && (_jsx("p", { className: "text-[12px] text-error", children: error })), _jsx("button", { type: "submit", disabled: loading, className: "w-full py-3 rounded-xl bg-secondary text-on-secondary font-semibold text-[14px] disabled:opacity-50", children: loading ? "Procesando..." : isRegister ? "Crear cuenta" : "Ingresar" })] }), _jsx("button", { onClick: () => setIsRegister(!isRegister), className: "w-full text-center text-[12px] text-secondary", children: isRegister ? "Ya tengo cuenta" : "No tengo cuenta" })] }) }));
}
function ComercioApp() {
    const { user, signOut } = useAuthContext();
    const [activeModule, setActiveModule] = useState("dashboard");
    const [menuOpen, setMenuOpen] = useState(false);
    const { tenants } = useTenants();
    const comercioTenant = tenants.find((t) => t.email === user?.email);
    const comercioNombre = comercioTenant?.nombre ?? user?.email?.split("@")[0] ?? "Comercio";
    const handleNavigate = (module) => {
        setActiveModule(module);
    };
    const menuItems = [
        { icon: "home", label: "Inicio", onClick: () => handleNavigate("dashboard") },
        { icon: "shopping_bag", label: "Pedidos", onClick: () => handleNavigate("pedidos") },
        { icon: "inventory_2", label: "Productos", onClick: () => handleNavigate("productos") },
        { icon: "analytics", label: "Reportes", onClick: () => handleNavigate("reportes") },
        { icon: "settings", label: "Config", onClick: () => handleNavigate("config") },
        { icon: "help", label: "Ayuda", onClick: () => { } },
    ];
    const renderModule = () => {
        switch (activeModule) {
            case "dashboard":
                return (_jsxs("div", { className: "px-4 py-4 space-y-5 pb-24 lg:pb-4", children: [_jsx(PedidosActivos, {}), _jsx(ResumenHoy, {}), _jsx(Cuadratura, {})] }));
            case "pedidos":
                return (_jsxs("div", { className: "px-4 py-4 space-y-4 pb-24 lg:pb-4", children: [_jsx("h2", { className: "text-[18px] text-on-surface font-semibold font-display", children: "Todos los Pedidos" }), _jsx(PedidosActivos, { expanded: true })] }));
            case "productos":
                return (_jsxs("div", { className: "px-4 py-4 space-y-4 pb-24 lg:pb-4", children: [_jsx("h2", { className: "text-[18px] text-on-surface font-semibold font-display", children: "Productos" }), _jsx("div", { className: "bg-surface-container rounded-xl p-4 space-y-3", children: [
                                { nombre: "Pan integral", precio: "$1.50", stock: 45 },
                                { nombre: "Croissant", precio: "$2.00", stock: 30 },
                                { nombre: "Medialuna", precio: "$1.75", stock: 25 },
                            ].map((p) => (_jsxs("div", { className: "flex items-center justify-between py-2 border-b border-outline-variant/30 last:border-0", children: [_jsxs("div", { children: [_jsx("span", { className: "text-[13px] text-on-surface", children: p.nombre }), _jsxs("span", { className: "text-[11px] text-on-surface-variant block", children: ["Stock: ", p.stock] })] }), _jsx("span", { className: "font-mono text-[14px] text-primary font-bold", children: p.precio })] }, p.nombre))) })] }));
            case "reportes":
                return (_jsxs("div", { className: "px-4 py-4 space-y-4 pb-24 lg:pb-4", children: [_jsx("h2", { className: "text-[18px] text-on-surface font-semibold font-display", children: "Reportes" }), _jsx("div", { className: "bg-surface-container rounded-xl p-4 space-y-3", children: [
                                { icon: "payments", label: "Ingresos por periodo" },
                                { icon: "shopping_bag", label: "Pedidos por dia" },
                                { icon: "trending_up", label: "Productos mas vendidos" },
                                { icon: "download", label: "Exportar CSV" },
                            ].map((item) => (_jsxs("button", { className: "w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors text-left", children: [_jsx("span", { className: "material-symbols-outlined text-[20px] text-primary", children: item.icon }), _jsx("span", { className: "text-[13px] text-on-surface", children: item.label })] }, item.label))) })] }));
            case "config":
                return (_jsxs("div", { className: "px-4 py-4 space-y-4 pb-24 lg:pb-4", children: [_jsx("h2", { className: "text-[18px] text-on-surface font-semibold font-display", children: "Configuracion" }), _jsxs("div", { className: "bg-surface-container rounded-xl p-4 space-y-3", children: [_jsx("span", { className: "font-mono text-[11px] text-on-surface-variant uppercase", children: "Notificaciones" }), [
                                    { label: "Nuevo pedido", on: true },
                                    { label: "Pedido entregado", on: true },
                                    { label: "Sin stock", on: false },
                                ].map((n) => (_jsxs("div", { className: "flex items-center justify-between py-2", children: [_jsx("span", { className: "text-[13px] text-on-surface", children: n.label }), _jsx("div", { className: cn("w-10 h-6 rounded-full relative cursor-pointer", n.on ? "bg-primary-container" : "bg-surface-variant"), children: _jsx("div", { className: cn("absolute top-0.5 w-5 h-5 rounded-full transition-transform", n.on ? "left-5 bg-on-primary" : "left-0.5 bg-outline") }) })] }, n.label))), _jsx("div", { className: "border-t border-outline-variant/30 pt-3", children: _jsx("span", { className: "font-mono text-[11px] text-on-surface-variant uppercase", children: "General" }) }), _jsxs("div", { className: "flex items-center justify-between py-2", children: [_jsx("span", { className: "text-[13px] text-on-surface", children: "Datos del comercio" }), _jsx("span", { className: "material-symbols-outlined text-[18px] text-on-surface-variant", children: "chevron_right" })] }), _jsxs("div", { className: "flex items-center justify-between py-2", children: [_jsx("span", { className: "text-[13px] text-on-surface", children: "Horario de atencion" }), _jsx("span", { className: "material-symbols-outlined text-[18px] text-on-surface-variant", children: "chevron_right" })] }), _jsx("div", { className: "border-t border-outline-variant/30 pt-3", children: _jsx("button", { onClick: signOut, className: "w-full py-3 rounded-xl bg-error/20 text-error text-[13px] font-semibold", children: "Cerrar sesion" }) })] })] }));
            default:
                return (_jsxs("div", { className: "px-4 py-4 space-y-5 pb-24 lg:pb-4", children: [_jsx(PedidosActivos, {}), _jsx(ResumenHoy, {}), _jsx(Cuadratura, {})] }));
        }
    };
    return (_jsxs("div", { className: "flex h-screen overflow-hidden bg-surface", children: [_jsxs("aside", { className: "hidden lg:flex flex-col w-[260px] bg-surface-container-low border-r border-outline-variant/30", children: [_jsx("div", { className: "flex items-center h-16 px-4 border-b border-outline-variant/30", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-[18px] text-on-secondary", children: "storefront" }) }), _jsx("span", { className: "text-[16px] font-bold text-on-surface font-display", children: "Drivip" }), _jsx("span", { className: "px-1.5 py-0.5 rounded bg-secondary-container/20 text-secondary font-mono text-[9px] font-bold", children: "COMERCIO" })] }) }), _jsx("nav", { className: "flex-1 py-3 px-2 space-y-1 overflow-y-auto", children: navItems.map((item) => {
                            const isActive = activeModule === item.id;
                            return (_jsxs("button", { onClick: () => setActiveModule(item.id), className: cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors", isActive
                                    ? "bg-secondary-container/15 text-secondary font-semibold"
                                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"), children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", children: item.icon }), _jsx("span", { className: "font-mono text-[11px] tracking-wide", children: item.label })] }, item.id));
                        }) }), _jsx("div", { className: "px-2 pb-3", children: _jsxs("div", { className: "p-3 rounded-lg bg-surface-container", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-secondary-container/20 flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-[16px] text-secondary", children: "storefront" }) }), _jsxs("div", { className: "flex flex-col min-w-0", children: [_jsx("span", { className: "text-[12px] text-on-surface font-medium truncate", children: comercioNombre }), _jsxs("span", { className: "font-mono text-[10px] text-on-surface-variant truncate", children: ["drivip.app/", comercioTenant?.slug ?? "comercio"] })] })] }), _jsx("button", { onClick: signOut, className: "mt-2 w-full py-2 rounded-lg bg-secondary/20 text-secondary text-[11px] font-semibold", children: "Cerrar sesion" })] }) })] }), _jsxs("div", { className: "flex flex-col flex-1 min-w-0 overflow-hidden", children: [_jsxs("header", { className: "h-16 flex items-center justify-between px-4 border-b border-outline-variant/30 bg-surface-container-lowest/50 backdrop-blur-sm lg:hidden", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => setMenuOpen(true), className: "w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors", children: _jsx("span", { className: "material-symbols-outlined text-[24px] text-on-surface", children: "menu" }) }), _jsx("span", { className: "text-[16px] font-bold text-on-surface font-display", children: comercioNombre })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { className: "w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors relative", children: [_jsx("span", { className: "material-symbols-outlined text-[22px] text-on-surface", children: "notifications" }), _jsx("div", { className: "absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary" })] }), _jsx("button", { onClick: signOut, className: "w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors", children: _jsx("span", { className: "material-symbols-outlined text-[22px] text-on-surface", children: "logout" }) })] })] }), _jsx("main", { className: "flex-1 overflow-y-auto", children: renderModule() })] }), _jsx("nav", { className: "fixed bottom-0 w-full z-40 lg:hidden bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-1px_12px_rgba(0,0,0,0.5)]", children: _jsx("div", { className: "grid grid-cols-5 items-center h-16 px-1", children: navItems.map((item) => {
                        const isActive = activeModule === item.id;
                        return (_jsxs("button", { onClick: () => setActiveModule(item.id), className: cn("flex flex-col items-center justify-center gap-1 h-12 rounded transition-colors", isActive ? "text-secondary bg-secondary-container/15 font-semibold" : "text-on-surface-variant hover:text-on-surface"), children: [_jsx("span", { className: "material-symbols-outlined text-[20px]", children: item.icon }), _jsx("span", { className: "font-mono text-[9px] tracking-tight truncate", children: item.label })] }, item.id));
                    }) }) }), _jsx(HamburgerMenu, { open: menuOpen, onClose: () => setMenuOpen(false), items: menuItems, header: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[16px] font-bold text-on-surface font-display", children: "Menu" }), _jsx("button", { onClick: () => setMenuOpen(false), className: "w-8 h-8 flex items-center justify-center", children: _jsx("span", { className: "material-symbols-outlined text-[20px] text-on-surface", children: "close" }) })] }) })] }));
}
export default function App() {
    return (_jsx(AuthProvider, { children: _jsx(AppContent, {}) }));
}
function AppContent() {
    const { user, loading } = useAuthContext();
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-surface", children: _jsx("div", { className: "w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center animate-pulse", children: _jsx("span", { className: "material-symbols-outlined text-[24px] text-secondary", children: "sync" }) }) }));
    }
    if (!user) {
        return _jsx(LoginScreen, {});
    }
    return _jsx(ComercioApp, {});
}
