import { useState } from "react";
import { cn, HamburgerMenu, type MenuItem } from "@drivip/ui";
import { AuthProvider, useAuthContext, useTenants, APP_URLS } from "@drivip/supabase";
import PedidosActivos from "./components/PedidosActivos";
import ResumenHoy from "./components/ResumenHoy";
import Cuadratura from "./components/Cuadratura";

type Module =
  | "dashboard"
  | "pedidos"
  | "productos"
  | "reportes"
  | "config";

const navItems: { id: Module; icon: string; label: string }[] = [
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface p-4">
      <div className="w-full max-w-[360px] bg-surface-container rounded-2xl p-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px] text-on-secondary">storefront</span>
          </div>
          <div className="text-center">
            <h1 className="text-[20px] font-bold text-on-surface font-display">Drivip Comercio</h1>
            <p className="text-[12px] text-on-surface-variant">{isRegister ? "Crear cuenta" : "Iniciar sesion"}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-mono text-on-surface-variant uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 bg-surface-container-high rounded-xl px-4 py-3 text-[14px] text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary-container"
              placeholder="comercio@email.com"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-mono text-on-surface-variant uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 bg-surface-container-high rounded-xl px-4 py-3 text-[14px] text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary-container"
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <p className="text-[12px] text-error">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-secondary text-on-secondary font-semibold text-[14px] disabled:opacity-50"
          >
            {loading ? "Procesando..." : isRegister ? "Crear cuenta" : "Ingresar"}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="w-full text-center text-[12px] text-secondary"
        >
          {isRegister ? "Ya tengo cuenta" : "No tengo cuenta"}
        </button>
      </div>
    </div>
  );
}

const MOCK_TENANTS_COMERCIO = [
  { id: "tc1", nombre: "Panadería El Trigal", slug: "panaderia-trigal", email: "", created_at: "2026-03-01" },
];

function ComercioApp({ demo }: { demo?: boolean }) {
  const { user, signOut } = useAuthContext();
  const [activeModule, setActiveModule] = useState<Module>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const { tenants } = useTenants();

  const effectiveTenants = demo ? MOCK_TENANTS_COMERCIO : tenants;
  const comercioTenant = effectiveTenants.find((t) => t.email === user?.email) ?? effectiveTenants[0];
  const comercioNombre = demo ? "Panadería El Trigal" : (comercioTenant?.nombre ?? user?.email?.split("@")[0] ?? "Comercio");

  const handleNavigate = (module: string) => {
    setActiveModule(module as Module);
  };

  const menuItems: MenuItem[] = [
    { icon: "home", label: "Inicio", onClick: () => handleNavigate("dashboard") },
    { icon: "shopping_bag", label: "Pedidos", onClick: () => handleNavigate("pedidos") },
    { icon: "inventory_2", label: "Productos", onClick: () => handleNavigate("productos") },
    { icon: "analytics", label: "Reportes", onClick: () => handleNavigate("reportes") },
    { icon: "settings", label: "Config", onClick: () => handleNavigate("config") },
    { icon: "help", label: "Ayuda", onClick: () => {} },
  ];

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return (
          <div className="px-4 py-4 space-y-5 pb-24 lg:pb-4">
            <PedidosActivos />
            <ResumenHoy />
            <Cuadratura />
          </div>
        );
      case "pedidos":
        return (
          <div className="px-4 py-4 space-y-4 pb-24 lg:pb-4">
            <h2 className="text-[18px] text-on-surface font-semibold font-display">Todos los Pedidos</h2>
            <PedidosActivos expanded />
          </div>
        );
      case "productos":
        return (
          <div className="px-4 py-4 space-y-4 pb-24 lg:pb-4">
            <h2 className="text-[18px] text-on-surface font-semibold font-display">Productos</h2>
            <div className="bg-surface-container rounded-xl p-4 space-y-3">
              {[
                { nombre: "Pan integral", precio: "$1.50", stock: 45 },
                { nombre: "Croissant", precio: "$2.00", stock: 30 },
                { nombre: "Medialuna", precio: "$1.75", stock: 25 },
              ].map((p) => (
                <div key={p.nombre} className="flex items-center justify-between py-2 border-b border-outline-variant/30 last:border-0">
                  <div>
                    <span className="text-[13px] text-on-surface">{p.nombre}</span>
                    <span className="text-[11px] text-on-surface-variant block">Stock: {p.stock}</span>
                  </div>
                  <span className="font-mono text-[14px] text-primary font-bold">{p.precio}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case "reportes":
        return (
          <div className="px-4 py-4 space-y-4 pb-24 lg:pb-4">
            <h2 className="text-[18px] text-on-surface font-semibold font-display">Reportes</h2>
            <div className="bg-surface-container rounded-xl p-4 space-y-3">
              {[
                { icon: "payments", label: "Ingresos por periodo" },
                { icon: "shopping_bag", label: "Pedidos por dia" },
                { icon: "trending_up", label: "Productos mas vendidos" },
                { icon: "download", label: "Exportar CSV" },
              ].map((item) => (
                <button key={item.label} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors text-left">
                  <span className="material-symbols-outlined text-[20px] text-primary">{item.icon}</span>
                  <span className="text-[13px] text-on-surface">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case "config":
        return (
          <div className="px-4 py-4 space-y-4 pb-24 lg:pb-4">
            <h2 className="text-[18px] text-on-surface font-semibold font-display">Configuracion</h2>
            <div className="bg-surface-container rounded-xl p-4 space-y-3">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase">Notificaciones</span>
              {[
                { label: "Nuevo pedido", on: true },
                { label: "Pedido entregado", on: true },
                { label: "Sin stock", on: false },
              ].map((n) => (
                <div key={n.label} className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-on-surface">{n.label}</span>
                  <div className={cn("w-10 h-6 rounded-full relative cursor-pointer", n.on ? "bg-primary-container" : "bg-surface-variant")}>
                    <div className={cn("absolute top-0.5 w-5 h-5 rounded-full transition-transform", n.on ? "left-5 bg-on-primary" : "left-0.5 bg-outline")} />
                  </div>
                </div>
              ))}
              <div className="border-t border-outline-variant/30 pt-3">
                <span className="font-mono text-[11px] text-on-surface-variant uppercase">General</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[13px] text-on-surface">Datos del comercio</span>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[13px] text-on-surface">Horario de atencion</span>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
              </div>
              <div className="border-t border-outline-variant/30 pt-3">
                <button
                  onClick={signOut}
                  className="w-full py-3 rounded-xl bg-error/20 text-error text-[13px] font-semibold"
                >
                  Cerrar sesion
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="px-4 py-4 space-y-5 pb-24 lg:pb-4">
            <PedidosActivos />
            <ResumenHoy />
            <Cuadratura />
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-surface-container-low border-r border-outline-variant/30">
        <div className="flex items-center h-16 px-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-on-secondary">storefront</span>
            </div>
            <span className="text-[16px] font-bold text-on-surface font-display">Drivip</span>
            <span className="px-1.5 py-0.5 rounded bg-secondary-container/20 text-secondary font-mono text-[9px] font-bold">COMERCIO</span>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-secondary-container/15 text-secondary font-semibold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
                )}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-mono text-[11px] tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-2 pb-3">
          <div className="p-3 rounded-lg bg-surface-container">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary-container/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] text-secondary">storefront</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] text-on-surface font-medium truncate">{comercioNombre}</span>
                <span className="font-mono text-[10px] text-on-surface-variant truncate">{APP_URLS.comercio}/{comercioTenant?.slug ?? "comercio"}</span>
              </div>
            </div>
            <button
              onClick={signOut}
              className="mt-2 w-full py-2 rounded-lg bg-secondary/20 text-secondary text-[11px] font-semibold"
            >
              Cerrar sesion
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-outline-variant/30 bg-surface-container-lowest/50 backdrop-blur-sm lg:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[24px] text-on-surface">menu</span>
            </button>
            <span className="text-[16px] font-bold text-on-surface font-display">{comercioNombre}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors relative">
              <span className="material-symbols-outlined text-[22px] text-on-surface">notifications</span>
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary" />
            </button>
            <button
              onClick={signOut}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[22px] text-on-surface">logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{renderModule()}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 w-full z-40 lg:hidden bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-1px_12px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-5 items-center h-16 px-1">
          {navItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-12 rounded transition-colors",
                  isActive ? "text-secondary bg-secondary-container/15 font-semibold" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-mono text-[9px] tracking-tight truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Hamburger menu */}
      <HamburgerMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={menuItems}
        header={
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-bold text-on-surface font-display">Menu</span>
            <button onClick={() => setMenuOpen(false)} className="w-8 h-8 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-on-surface">close</span>
            </button>
          </div>
        }
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading, configured } = useAuthContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-[24px] text-secondary">sync</span>
        </div>
      </div>
    );
  }

  if (!user && configured) {
    return <LoginScreen />;
  }

  return <ComercioApp demo={!configured} />;
}
