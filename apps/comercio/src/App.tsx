import { useState } from "react";
import { cn, HamburgerMenu, type MenuItem } from "@drivip/ui";
import { AuthProvider, useAuthContext, supabase, useMiTenant, useProductos, usePedidosComercio, APP_URLS } from "@drivip/supabase";
import type { PedidoComercioEstado } from "@drivip/types";
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

function slugify(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "comercio";
}

function LoginScreen() {
  const { signIn, loading, error } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!isRegister) {
      await signIn(email, password);
      return;
    }

    if (!nombre.trim()) {
      setLocalError("Ingresa el nombre del comercio");
      return;
    }

    setSubmitting(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { rol: "comercio", nombre: nombre.trim(), telefono },
      },
    });

    if (authError) {
      setLocalError(authError.message);
      setSubmitting(false);
      return;
    }

    const user = authData?.user;
    if (!user) {
      setLocalError("No se pudo crear la cuenta. Intenta de nuevo.");
      setSubmitting(false);
      return;
    }

    const slug = `${slugify(nombre)}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const tenantId = crypto.randomUUID();

    const { error: tenantError } = await supabase.from("tenants").insert({
      id: tenantId,
      slug,
      type: "comercio",
      nombre: nombre.trim(),
      email,
      telefono,
      suscripcion_activa: false,
    });

    if (tenantError) {
      setLocalError("Error al crear el comercio. Intenta de nuevo.");
      setSubmitting(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      tenant_id: tenantId,
      rol: "comercio",
      nombre: nombre.trim(),
      telefono,
      activo: true,
    });

    if (profileError) {
      setLocalError("Error al vincular tu cuenta. Intenta de nuevo.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  };

  const busy = loading || submitting;

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
          {isRegister && (
            <>
              <div>
                <label className="text-[11px] font-mono text-on-surface-variant uppercase">Nombre del comercio</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full mt-1 bg-surface-container-high rounded-xl px-4 py-3 text-[14px] text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary-container"
                  placeholder="Panadería El Trigal"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-on-surface-variant uppercase">Teléfono</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full mt-1 bg-surface-container-high rounded-xl px-4 py-3 text-[14px] text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary-container"
                  placeholder="0412-0000000"
                />
              </div>
            </>
          )}
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
          {(localError || error) && (
            <p className="text-[12px] text-error">{localError ?? error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-secondary text-on-secondary font-semibold text-[14px] disabled:opacity-50"
          >
            {busy ? "Procesando..." : isRegister ? "Crear cuenta" : "Ingresar"}
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

function ComercioApp() {
  const { user, signOut } = useAuthContext();
  const [activeModule, setActiveModule] = useState<Module>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const { tenant, loading: tenantLoading } = useMiTenant(user?.id);
  const { productos, loading: productosLoading, crearProducto, actualizarProducto, eliminarProducto } = useProductos(tenant?.id);
  const { pedidos, loading: pedidosLoading, crearPedido, actualizarEstado } = usePedidosComercio(tenant?.id);

  const [productForm, setProductForm] = useState({ nombre: "", precio: "", stock: "" });
  const [productError, setProductError] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [pedidoForm, setPedidoForm] = useState({ cliente_nombre: "", telefono: "", direccion_entrega: "", total: "" });
  const [pedidoError, setPedidoError] = useState<string | null>(null);
  const [savingPedido, setSavingPedido] = useState(false);
  const [notifs, setNotifs] = useState({ nuevo: true, entregado: true, stock: false });

  const comercioNombre = tenant?.nombre ?? user?.email?.split("@")[0] ?? "Comercio";

  const handleNavigate = (module: string) => {
    setActiveModule(module as Module);
    setMenuOpen(false);
  };

  const menuItems: MenuItem[] = [
    { icon: "home", label: "Inicio", onClick: () => handleNavigate("dashboard") },
    { icon: "shopping_bag", label: "Pedidos", onClick: () => handleNavigate("pedidos") },
    { icon: "inventory_2", label: "Productos", onClick: () => handleNavigate("productos") },
    { icon: "analytics", label: "Reportes", onClick: () => handleNavigate("reportes") },
    { icon: "settings", label: "Config", onClick: () => handleNavigate("config") },
  ];

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const precio = Number(productForm.precio);
    const stock = Number(productForm.stock);
    if (!productForm.nombre.trim() || !Number.isFinite(precio) || !Number.isFinite(stock)) {
      setProductError("Completa nombre, precio y stock");
      return;
    }
    setSavingProduct(true);
    setProductError(null);
    const { error } = await crearProducto({ nombre: productForm.nombre, precio, stock });
    setSavingProduct(false);
    if (error) {
      setProductError(error);
      return;
    }
    setProductForm({ nombre: "", precio: "", stock: "" });
  };

  const handleCreatePedido = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(pedidoForm.total);
    if (!pedidoForm.cliente_nombre.trim() || !Number.isFinite(total)) {
      setPedidoError("Completa cliente y total");
      return;
    }
    setSavingPedido(true);
    setPedidoError(null);
    const { error } = await crearPedido({
      cliente_nombre: pedidoForm.cliente_nombre,
      telefono: pedidoForm.telefono,
      direccion_entrega: pedidoForm.direccion_entrega,
      total,
      items: [],
    });
    setSavingPedido(false);
    if (error) {
      setPedidoError(error);
      return;
    }
    setPedidoForm({ cliente_nombre: "", telefono: "", direccion_entrega: "", total: "" });
  };

  const handleUpdateEstado = async (id: string, estado: PedidoComercioEstado) => {
    return actualizarEstado(id, estado);
  };

  const ventasTotales = pedidos.filter((p) => p.estado !== "cancelado").reduce((sum, p) => sum + Number(p.total), 0);
  const entregados = pedidos.filter((p) => p.estado === "entregado").length;

  const renderModule = () => {
    if (tenantLoading) {
      return <p className="px-4 py-8 text-center text-[12px] text-on-surface-variant">Cargando comercio...</p>;
    }

    if (!tenant) {
      return (
        <div className="px-4 py-10 text-center space-y-2">
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant">storefront</span>
          <p className="text-[13px] text-on-surface">No encontramos tu comercio</p>
          <p className="text-[11px] text-on-surface-variant">Cierra sesión y vuelve a registrarte.</p>
          <button onClick={signOut} className="px-4 py-2 rounded-xl bg-secondary text-on-secondary text-[12px] font-semibold">
            Cerrar sesión
          </button>
        </div>
      );
    }

    switch (activeModule) {
      case "dashboard":
        return (
          <div className="px-4 py-4 space-y-5 pb-24 lg:pb-4">
            <PedidosActivos pedidos={pedidos} loading={pedidosLoading} onUpdateEstado={handleUpdateEstado} />
            <ResumenHoy pedidos={pedidos} />
            <Cuadratura pedidos={pedidos} />
          </div>
        );
      case "pedidos":
        return (
          <div className="px-4 py-4 space-y-4 pb-24 lg:pb-4">
            <h2 className="text-[18px] text-on-surface font-semibold font-display">Todos los Pedidos</h2>
            <form onSubmit={handleCreatePedido} className="bg-surface-container rounded-xl p-4 space-y-3">
              <span className="text-[11px] font-mono text-on-surface-variant uppercase">Nuevo pedido</span>
              <input
                value={pedidoForm.cliente_nombre}
                onChange={(e) => setPedidoForm({ ...pedidoForm, cliente_nombre: e.target.value })}
                placeholder="Cliente"
                className="w-full bg-surface-container-high rounded-xl px-4 py-2.5 text-[13px] text-on-surface"
              />
              <input
                value={pedidoForm.telefono}
                onChange={(e) => setPedidoForm({ ...pedidoForm, telefono: e.target.value })}
                placeholder="Teléfono"
                className="w-full bg-surface-container-high rounded-xl px-4 py-2.5 text-[13px] text-on-surface"
              />
              <input
                value={pedidoForm.direccion_entrega}
                onChange={(e) => setPedidoForm({ ...pedidoForm, direccion_entrega: e.target.value })}
                placeholder="Dirección de entrega"
                className="w-full bg-surface-container-high rounded-xl px-4 py-2.5 text-[13px] text-on-surface"
              />
              <input
                value={pedidoForm.total}
                onChange={(e) => setPedidoForm({ ...pedidoForm, total: e.target.value })}
                placeholder="Total USD"
                inputMode="decimal"
                className="w-full bg-surface-container-high rounded-xl px-4 py-2.5 text-[13px] text-on-surface"
              />
              {pedidoError && <p className="text-[11px] text-error">{pedidoError}</p>}
              <button type="submit" disabled={savingPedido} className="w-full py-2.5 rounded-xl bg-secondary text-on-secondary text-[12px] font-bold disabled:opacity-60">
                {savingPedido ? "Guardando..." : "Crear pedido"}
              </button>
            </form>
            <PedidosActivos pedidos={pedidos} loading={pedidosLoading} expanded onUpdateEstado={handleUpdateEstado} />
          </div>
        );
      case "productos":
        return (
          <div className="px-4 py-4 space-y-4 pb-24 lg:pb-4">
            <h2 className="text-[18px] text-on-surface font-semibold font-display">Productos</h2>
            <form onSubmit={handleCreateProduct} className="bg-surface-container rounded-xl p-4 space-y-3">
              <input
                value={productForm.nombre}
                onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                placeholder="Nombre del producto"
                className="w-full bg-surface-container-high rounded-xl px-4 py-2.5 text-[13px] text-on-surface"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={productForm.precio}
                  onChange={(e) => setProductForm({ ...productForm, precio: e.target.value })}
                  placeholder="Precio USD"
                  inputMode="decimal"
                  className="w-full bg-surface-container-high rounded-xl px-4 py-2.5 text-[13px] text-on-surface"
                />
                <input
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  placeholder="Stock"
                  inputMode="numeric"
                  className="w-full bg-surface-container-high rounded-xl px-4 py-2.5 text-[13px] text-on-surface"
                />
              </div>
              {productError && <p className="text-[11px] text-error">{productError}</p>}
              <button type="submit" disabled={savingProduct} className="w-full py-2.5 rounded-xl bg-secondary text-on-secondary text-[12px] font-bold disabled:opacity-60">
                {savingProduct ? "Guardando..." : "Agregar producto"}
              </button>
            </form>

            {productosLoading && <p className="text-center text-[12px] text-on-surface-variant py-4">Cargando productos...</p>}
            {!productosLoading && productos.length === 0 && (
              <p className="text-center text-[12px] text-on-surface-variant py-4">No hay productos registrados</p>
            )}

            <div className="bg-surface-container rounded-xl p-4 space-y-3">
              {productos.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-outline-variant/30 last:border-0">
                  <div>
                    <span className="text-[13px] text-on-surface">{p.nombre}</span>
                    <span className="text-[11px] text-on-surface-variant block">Stock: {p.stock}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[14px] text-primary font-bold">${Number(p.precio).toFixed(2)}</span>
                    <button
                      onClick={() => { void actualizarProducto(p.id, { activo: !p.activo }); }}
                      className={`text-[10px] font-mono px-2 py-1 rounded-lg ${p.activo ? "bg-primary/10 text-primary" : "bg-surface-variant text-on-surface-variant"}`}
                    >
                      {p.activo ? "Activo" : "Inactivo"}
                    </button>
                    <button onClick={() => { void eliminarProducto(p.id); }} className="text-[10px] font-bold text-error">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "reportes":
        return (
          <div className="px-4 py-4 space-y-4 pb-24 lg:pb-4">
            <h2 className="text-[18px] text-on-surface font-semibold font-display">Reportes</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container rounded-xl p-4">
                <span className="text-[11px] text-on-surface-variant font-mono uppercase">Ventas</span>
                <p className="font-mono text-[20px] text-primary font-bold mt-1">${ventasTotales.toFixed(2)}</p>
              </div>
              <div className="bg-surface-container rounded-xl p-4">
                <span className="text-[11px] text-on-surface-variant font-mono uppercase">Entregados</span>
                <p className="font-mono text-[20px] text-primary font-bold mt-1">{entregados}</p>
              </div>
            </div>
            <div className="bg-surface-container rounded-xl p-4 space-y-2">
              <span className="text-[11px] text-on-surface-variant font-mono uppercase">Pedidos por estado</span>
              {(["pendiente", "preparando", "en_camino", "entregado", "cancelado"] as PedidoComercioEstado[]).map((estado) => {
                const count = pedidos.filter((p) => p.estado === estado).length;
                return (
                  <div key={estado} className="flex items-center justify-between py-1.5 text-[12px]">
                    <span className="text-on-surface capitalize">{estado.replace("_", " ")}</span>
                    <span className="font-mono text-on-surface-variant">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case "config":
        return (
          <div className="px-4 py-4 space-y-4 pb-24 lg:pb-4">
            <h2 className="text-[18px] text-on-surface font-semibold font-display">Configuracion</h2>
            <div className="bg-surface-container rounded-xl p-4 space-y-2">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase">Datos del comercio</span>
              <div className="flex justify-between text-[13px] text-on-surface"><span>Nombre</span><span>{tenant.nombre}</span></div>
              <div className="flex justify-between text-[13px] text-on-surface"><span>Email</span><span>{tenant.email ?? "—"}</span></div>
              <div className="flex justify-between text-[13px] text-on-surface"><span>Teléfono</span><span>{tenant.telefono ?? "—"}</span></div>
              <div className="flex justify-between text-[13px] text-on-surface"><span>Ciudad</span><span>{tenant.ciudad ?? "—"}</span></div>
              <div className="flex justify-between text-[13px] text-on-surface"><span>Estado</span><span>{tenant.suscripcion_activa ? "Activo" : "Pendiente"}</span></div>
            </div>
            <div className="bg-surface-container rounded-xl p-4 space-y-3">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase">Notificaciones</span>
              {[
                { key: "nuevo" as const, label: "Nuevo pedido" },
                { key: "entregado" as const, label: "Pedido entregado" },
                { key: "stock" as const, label: "Sin stock" },
              ].map((n) => (
                <div key={n.key} className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-on-surface">{n.label}</span>
                  <button
                    onClick={() => setNotifs((prev) => ({ ...prev, [n.key]: !prev[n.key] }))}
                    className={cn("w-10 h-6 rounded-full relative transition-colors", notifs[n.key] ? "bg-primary-container" : "bg-surface-variant")}
                  >
                    <div className={cn("absolute top-0.5 w-5 h-5 rounded-full transition-transform", notifs[n.key] ? "left-5 bg-on-primary" : "left-0.5 bg-outline")} />
                  </button>
                </div>
              ))}
              <div className="border-t border-outline-variant/30 pt-3">
                <button onClick={signOut} className="w-full py-3 rounded-xl bg-error/20 text-error text-[13px] font-semibold">
                  Cerrar sesion
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
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
                <span className="font-mono text-[10px] text-on-surface-variant truncate">{APP_URLS.comercio}/{tenant?.slug ?? "comercio"}</span>
              </div>
            </div>
            <button onClick={signOut} className="mt-2 w-full py-2 rounded-lg bg-secondary/20 text-secondary text-[11px] font-semibold">
              Cerrar sesion
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
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
            <button onClick={signOut} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[22px] text-on-surface">logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{renderModule()}</main>
      </div>

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

  return <ComercioApp />;
}
