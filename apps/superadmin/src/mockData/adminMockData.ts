export const MOCK_TENANTS = [
  { id: "t1", nombre: "Carlos Mendoza", slug: "carlos-mendoza", email: "carlos@email.com", type: "conductor" as const, suscripcion_activa: true, plan: "enterprise", created_at: "2026-01-15", color_primario: "#7c3aed", color_secundario: "#a855f7", telefono: "+584121234567", logo_url: null, fecha_vencimiento: "2027-01-15", updated_at: "2026-09-15" },
  { id: "t2", nombre: "Maria Rodriguez", slug: "maria-rodriguez", email: "maria@email.com", type: "conductor" as const, suscripcion_activa: true, plan: "premium", created_at: "2026-03-20", color_primario: "#2563eb", color_secundario: "#3b82f6", telefono: "+584127654321", logo_url: null, fecha_vencimiento: "2026-12-20", updated_at: "2026-09-10" },
  { id: "t3", nombre: "Moto Delivery Valencia", slug: "moto-valencia", email: "admin@moto.com", type: "conductor" as const, suscripcion_activa: false, plan: "basico", created_at: "2026-06-10", color_primario: "#059669", color_secundario: "#10b981", telefono: "+584129876543", logo_url: null, fecha_vencimiento: null, updated_at: "2026-08-01" },
  { id: "t4", nombre: "Pedro Sanchez", slug: "pedro-sanchez", email: "pedro@email.com", type: "conductor" as const, suscripcion_activa: true, plan: "enterprise", created_at: "2026-08-01", color_primario: "#dc2626", color_secundario: "#ef4444", telefono: "+584123456789", logo_url: null, fecha_vencimiento: "2027-08-01", updated_at: "2026-09-12" },
  { id: "t5", nombre: "Rapido Libertador", slug: "rapido-lp", email: "admin@rapido.com", type: "conductor" as const, suscripcion_activa: true, plan: "premium", created_at: "2026-09-01", color_primario: "#d97706", color_secundario: "#f59e0b", telefono: "+584124567890", logo_url: null, fecha_vencimiento: "2026-12-01", updated_at: "2026-09-14" },
];

export const MOCK_CARRERAS_ADMIN = [
  { id: "c1", tenant_id: "t1", conductor_id: "tc1", cliente_id: "u1", estado: "completada" as const, origen_lat: 10.4806, origen_lng: -66.9036, origen_direccion: "Av. Libertador, Caracas", destino_lat: 10.4920, destino_lng: -66.8850, destino_direccion: "Centro Comercial Tolon", distancia_km: 3.2, duracion_min: 12, precio: 5.50, metodo_pago: "efectivo" as const, comprobante_url: null, calificacion: 5, comentario_calificacion: null, created_at: new Date().toISOString(), aceptada_at: null, completada_at: null, cancelada_at: null },
  { id: "c2", tenant_id: "t1", conductor_id: "tc1", cliente_id: "u2", estado: "completada" as const, origen_lat: 10.4850, origen_lng: -66.8950, origen_direccion: "Plaza Venezuela", destino_lat: 10.4980, destino_lng: -66.8800, destino_direccion: "Altamira", distancia_km: 4.1, duracion_min: 18, precio: 3.25, metodo_pago: "pago_movil" as const, comprobante_url: null, calificacion: 4, comentario_calificacion: null, created_at: new Date().toISOString(), aceptada_at: null, completada_at: null, cancelada_at: null },
  { id: "c3", tenant_id: "t2", conductor_id: "tc2", cliente_id: "u3", estado: "pendiente" as const, origen_lat: 10.4750, origen_lng: -66.9100, origen_direccion: "Los Palos Grandes", destino_lat: 10.4900, destino_lng: -66.8700, destino_direccion: "Las Mercedes", distancia_km: 5.0, duracion_min: 20, precio: 8.00, metodo_pago: "efectivo" as const, comprobante_url: null, calificacion: null, comentario_calificacion: null, created_at: new Date().toISOString(), aceptada_at: null, completada_at: null, cancelada_at: null },
  { id: "c4", tenant_id: "t2", conductor_id: "tc2", cliente_id: "u4", estado: "completada" as const, origen_lat: 10.4700, origen_lng: -66.9200, origen_direccion: "CC Sambil", destino_lat: 10.4880, destino_lng: -66.8750, destino_direccion: "Parque del Este", distancia_km: 6.3, duracion_min: 25, precio: 4.75, metodo_pago: "pago_movil" as const, comprobante_url: null, calificacion: 5, comentario_calificacion: null, created_at: new Date().toISOString(), aceptada_at: null, completada_at: null, cancelada_at: null },
  { id: "c5", tenant_id: "t4", conductor_id: "tc4", cliente_id: "u5", estado: "completada" as const, origen_lat: 10.4650, origen_lng: -66.9300, origen_direccion: "Barquisimeto Centro", destino_lat: 10.4820, destino_lng: -66.8600, destino_direccion: "Av. Lara", distancia_km: 7.8, duracion_min: 30, precio: 6.00, metodo_pago: "efectivo" as const, comprobante_url: null, calificacion: 4, comentario_calificacion: null, created_at: new Date().toISOString(), aceptada_at: null, completada_at: null, cancelada_at: null },
];

export const MOCK_PENDIENTES = [
  { id: "p1", tenant_id: "t3", monto: 10, metodo_pago: "pago_movil" as const, referencia: "REF-001", moneda: "USD", comprobante_url: null, estado: "pendiente" as const, verificado_por: null, fecha_inicio: null, fecha_fin: null, created_at: "2026-09-10" },
  { id: "p2", tenant_id: "t5", monto: 10, metodo_pago: "transferencia" as const, referencia: "REF-002", moneda: "USD", comprobante_url: null, estado: "pendiente" as const, verificado_por: null, fecha_inicio: null, fecha_fin: null, created_at: "2026-09-09" },
];

export const MOCK_PLUGINS_ADMIN = [
  { id: "1", nombre: "GPS Tracking", icono: "location_on", descripcion: "Seguimiento en tiempo real", activo: true, tenantCount: 12 },
  { id: "2", nombre: "Pagos Moviles", icono: "account_balance", descripcion: "Integracion con pago movil", activo: true, tenantCount: 8 },
  { id: "3", nombre: "Multi-idioma", icono: "translate", descripcion: "Soporte para multiples idiomas", activo: false, tenantCount: 3 },
  { id: "4", nombre: "Analytics", icono: "analytics", descripcion: "Dashboard de analiticas avanzado", activo: true, tenantCount: 15 },
  { id: "5", nombre: "Notificaciones Push", icono: "notifications", descripcion: "Envio de notificaciones push", activo: true, tenantCount: 20 },
  { id: "6", nombre: "B2B Delivery", icono: "local_shipping", descripcion: "Logistica de entrega B2B", activo: false, tenantCount: 2 },
];

export const MOCK_BANNERS = [
  { id: "1", titulo: "Promocion Septiembre", descripcion: "20% de descuento en todos los viajes", activo: true, prioridad: "alta" },
  { id: "2", titulo: "Nuevo: B2B Delivery", descripcion: "Servicio de entrega para empresas", activo: true, prioridad: "normal" },
  { id: "3", titulo: "Mantenimiento Programado", descripcion: "Domingo 15 de Septiembre 2am-5am", activo: false, prioridad: "baja" },
];

export const MOCK_ORDERS_B2B = [
  { id: "B2B-001", empresa: "TechCorp CA", destino: "Centro de distribucion Caracas", estado: "en_curso" as const, conductor: "Jose Olivares" },
  { id: "B2B-002", empresa: "Distribuidora Delta", destino: "Almacen Los Ruices", estado: "pendiente" as const, conductor: null },
  { id: "B2B-003", empresa: "ImportacionesXYZ", destino: "CC Plaza Venezuela", estado: "completada" as const, conductor: "Pedro Ramirez" },
];

export const MOCK_SERVICES = [
  { nombre: "API Gateway", estado: "operational" as const, latencia: "45ms", uptime: "99.98%" },
  { nombre: "Base de Datos", estado: "operational" as const, latencia: "12ms", uptime: "99.99%" },
  { nombre: "Auth Service", estado: "operational" as const, latencia: "28ms", uptime: "99.97%" },
  { nombre: "GPS Service", estado: "degraded" as const, latencia: "120ms", uptime: "99.50%" },
  { nombre: "Push Notifications", estado: "operational" as const, latencia: "65ms", uptime: "99.95%" },
];

export const MOCK_API_KEYS = [
  { id: "1", nombre: "Produccion", key: "sk_prod_****3a4f", activo: true, ultimoUso: "2026-09-10" },
  { id: "2", nombre: "Testing", key: "sk_test_****8b2c", activo: true, ultimoUso: "2026-09-09" },
  { id: "3", nombre: "Legacy", key: "sk_old_****1d5e", activo: false, ultimoUso: "2026-08-15" },
];
