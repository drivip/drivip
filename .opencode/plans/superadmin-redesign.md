# PLAN: Rediseño del Panel SuperAdmin - Cards Flotantes en Grid

## Estado: APROBADO - Pendiente de implementación

---

## Análisis Actual

### Estructura del SuperAdmin (apps/superadmin/)
- Framework: Vite + React 19 + TypeScript + Tailwind v4
- Archivo monolitico: Todo el dashboard esta en App.tsx (510 lineas)
- Componentes existentes: 8 componentes sueltos en components/, carpeta layout/ vacia
- Paleta: Tokens neumorphic de @drivip/ui (surface-container, error-container, etc.)
- Navegacion: Sidebar desktop + bottom nav mobile + HamburgerMenu slide-over

### Diseno de Referencia (Conductor/Cliente)
- DriverFullGridMenu.tsx: Grid 2 columnas, cards blancas rounded-2xl con neumorphic shadow, iconos con gradiente, label + descripcion
- DriverHeader.tsx: Header sticky con boton hamburguesa, marca central, avatar perfil
- GridMenuDrawer.tsx (cliente): Mismo patron de grid cards con gradientes
- Sombra neumorphic: boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff"

### Conexiones entre Paneles (Verificadas)
- Auth: useAuthContext() compartido en los 3 paneles
- Tenants: useTenants() en superadmin, useTenant(slug) en conductor
- Carreras: useCarreras() en superadmin (todas), useCarreras(conductorId) en conductor (filtradas)
- Suscripciones: useSuscripciones() en superadmin para verificar
- Plugins: usePlugins() compartido
- Paquete compartido: @drivip/supabase en los 3 paneles

---

## Plan: 6 Fases de Implementacion

### FASE 1: Nuevo layout base (components/layout/)
Archivos a crear:
- components/layout/AdminHeader.tsx - Header sticky estilo DriverHeader
- components/layout/AdminSidebar.tsx - Sidebar desktop (260px)
- components/layout/AdminBottomNav.tsx - Bottom nav mobile (5 items)
- components/layout/AdminAppShell.tsx - Shell contenedor

### FASE 2: Dashboard con KPIs flotantes
Archivo a crear:
- components/AdminDashboard.tsx - Hero card + KPIs grid + Alertas + Quick Actions

### FASE 3: Grid de modulos estilo DriverFullGridMenu
Archivo a crear:
- components/AdminGridMenu.tsx - Grid 2 columnas con 10 modulos admin

### FASE 4: Refactorizar componentes existentes
Archivos a modificar: TenantListTable, PluginCatalogGrid, BannerManager, DeliveryB2BControl, CredentialsManager, PanicButton, SystemHealthMonitor, DevOpsSection

### FASE 5: Refactorizar App.tsx (reducir de 510 a ~80 lineas)
Archivos a crear/modificar:
- components/LoginScreen.tsx - Login rediseñado
- App.tsx - Solo AuthProvider + AppContent + LoginScreen/AdminAppShell

### FASE 6: Crear mockData y hooks
Archivos a crear:
- mockData/adminMockData.ts - Datos mock centralizados
- hooks/useScrollLock.ts - Hook scroll lock

---

## Archivos Totales del Cambio (18 archivos)

CREAR:
- components/layout/AdminHeader.tsx
- components/layout/AdminSidebar.tsx
- components/layout/AdminBottomNav.tsx
- components/layout/AdminAppShell.tsx
- components/AdminGridMenu.tsx
- components/AdminDashboard.tsx
- components/LoginScreen.tsx
- mockData/adminMockData.ts
- hooks/useScrollLock.ts

MODIFICAR:
- App.tsx (reducir a ~80 lineas)
- TenantListTable.tsx
- PluginCatalogGrid.tsx
- BannerManager.tsx
- DeliveryB2BControl.tsx
- CredentialsManager.tsx
- PanicButton.tsx
- SystemHealthMonitor.tsx
- DevOpsSection.tsx

## Orden de Ejecucion
FASE 1 (layout) -> FASE 6 (mockData + hooks) -> FASE 2 (dashboard) -> FASE 3 (grid menu) -> FASE 5 (refactorizar App.tsx) -> FASE 4 (adaptar componentes)

## Lo que NO se toca
- @drivip/supabase - hooks compartidos intactos
- @drivip/ui - componentes compartidos intactos
- @drivip/types - tipos intactos
- apps/conductor/ - sin cambios
- apps/cliente/ - sin cambios
- Base de datos / Supabase - sin cambios
