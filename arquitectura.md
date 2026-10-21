
---

# Arquitectura del Sistema Drivip

## Visión general

Drivip es un SaaS multi-tenant con **modelo de doble PWA**. Existe una **PWA del cliente unificada** (una sola app para todos los clientes) y **PWAs individuales de conductores/líneas** (una por cada tenant suscrito). El frontend se despliega en Cloudflare Workers, el backend y la base de datos viven en Supabase, y los mapas/routing se resuelven con MapLibre GL JS + GraphHopper.

## Modelo de doble PWA

### PWA del Cliente (única y unificada)
- **URL:** `app.drivip.app`
- **Instalaciones:** 1 sola por cliente
- **Función:** El cliente pide carreras a los conductores que agregó a su red
- **Sección clave:** "Mis Conductores" (red personal del cliente)
- **Ningún cliente instala la PWA de un conductor individual**

### PWA del Conductor / Línea (individual por tenant)
- **URL:** `[slug].drivip.app` (ej. `josetaxi.drivip.app`)
- **Instalaciones:** 1 por conductor/línea
- **Función:** Panel de control, gestión de carreras, tarifas, clientes, mapa
- **Es de uso interno, no para clientes finales**

### Flujo de descubrimiento
 CLOUDFLARE WORKERS (Edge) │
│ ┌──────────────────┐ ┌──────────────────┐ ┌───────────────┐ │
│ │ app.drivip.app │ │ *.drivip.app │ │ drivip.app │ │
│ │ (Cliente PWA) │ │ (Paneles Tenant) │ │ (Home) │ │
│ └────────┬─────────┘ └────────┬─────────┘ └───────┬───────┘ │
└───────────┼─────────────────────┼────────────────────┼──────────┘
│ │ │
▼ ▼ ▼
┌─────────────────────────────────────────────────────────────────┐
│ SUPABASE (Backend) │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐ │
│ │ Auth │ │ Postgres │ │ Realtime │ │ Edge Functions │ │
│ │ (JWT) │ │ (RLS) │ │(WebSocket)│ │ (Webhooks) │ │
│ └──────────┘ └──────────┘ └──────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────────┐
│ SERVICIOS EXTERNOS │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│ │ GraphHopper │ │ MapLibre GL │ │ Wayu Pay (fase 2) │ │
│ │ (Routing) │ │ (Mapas) │ │ (Pagos Venezuela) │ │
│ └──────────────┘ └──────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
text


## Sitemap y rutas

### Dominio principal: `drivip.app`
| Ruta | Descripción | Público |
|------|-------------|---------|
| `/` | Home — Afiliación, precios, registro | Público |
| `/registro` | Formulario de registro de conductor/línea | Público |
| `/pago` | Flujo de pago manual ($10) | Conductores |
| `/panel-maestro` | Panel Maestro (CRM/ERP) | Solo admin |
| `/docs` | Documentación | Público |

### PWA del Cliente: `app.drivip.app`
| Ruta | Descripción |
|------|-------------|
| `/` | Home del cliente — Mis Conductores + solicitar carrera |
| `/add/[slug]` | Agregar conductor a mi red (destino del QR) |
| `/mis-conductores` | Lista de conductores agregados |
| `/carrera/[id]` | Seguimiento de carrera activa |
| `/historial` | Historial de carreras |
| `/perfil` | Perfil y configuración del cliente |

### PWA del Conductor / Línea: `[slug].drivip.app`
| Ruta | Descripción |
|------|-------------|
| `/` | Panel del conductor (disponibilidad + carreras) |
| `/mapa` | Mapa en vivo con seguimiento |
| `/clientes` | Clientes propios del conductor |
| `/tarifas` | Configuración de precios |
| `/historial` | Historial de carreras |
| `/pagos` | Métodos de pago y suscripción |
| `/linea` | Panel de línea de taxis (solo si tipo=linea) |

## Modelo de datos (resumen)

### Tablas principales
- `tenants` (conductores y líneas)
- `profiles` (usuarios: maestro, conductor, cliente)
- `carreras` (viajes)
- `ubicaciones` (seguimiento en tiempo real)
- `clientes` (base de clientes del conductor)
- `red_cliente` (**NUEVA**: relación cliente ↔ conductor agregado)
- `plugins_activos` (plugins premium por tenant)
- `zonas` (plugin cobro por zona)
- `suscripciones` (historial de pagos)
- `audit_log` (auditoría)

## RLS (Row Level Security)

Todas las tablas tienen RLS habilitado. El aislamiento se basa en `tenant_id` extraído del JWT.

```sql
-- Función helper
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID;
$$;

-- Ejemplo de política para carreras
ALTER TABLE carreras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_carreras"
ON carreras
FOR ALL
USING (tenant_id = auth.tenant_id())
WITH CHECK (tenant_id = auth.tenant_id());

Cloudflare Workers — Enrutamiento
typescript

// src/worker.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const host = new URL(request.url).hostname;

    // Dominio principal: Home
    if (host === 'drivip.app' || host === 'www.drivip.app') {
      return env.ASSETS_HOME.fetch(request);
    }

    // PWA del cliente unificada
    if (host === 'app.drivip.app') {
      return env.ASSETS_CLIENTE.fetch(request);
    }

    // PWA de conductor/línea (wildcard)
    const slug = host.split('.')[0];
    const tenant = await getTenantBySlug(env, slug);
    if (!tenant) {
      return new Response('Conductor no encontrado', { status: 404 });
    }

    const newRequest = new Request(request);
    newRequest.headers.set('X-Tenant-Id', tenant.id);
    newRequest.headers.set('X-Tenant-Slug', slug);
    newRequest.headers.set('X-Tenant-Tipo', tenant.tipo);

    return env.ASSETS_TENANT.fetch(newRequest);
  }
};

Nota crítica: Se despliegan tres assets estáticos diferentes en Cloudflare:

    drivip.app → Home / landing / panel maestro

    app.drivip.app → PWA del cliente

    *.drivip.app → PWA del conductor/línea (multitenant)

Flujo de datos en tiempo real
text

Conductor (geolocation)
    → Supabase Realtime (tabla ubicaciones)
    → Cliente suscrito (solo si están en su red)
    → MapLibre actualiza marcador
    → GraphHopper recalcula ruta si es necesario

Plugins Premium (modulares)

Cada plugin es un módulo independiente:
typescript

const pluginRegistry: Record<string, PluginModule> = {
  zonas: {
    nombre: 'Cobro por Zona',
    icono: 'Map',
    componentes: { panelConductor: ZonasPanel },
    tablas: ['zonas'],
  },
  red_avanzada: {
    nombre: 'Red de Clientes Avanzada',
    icono: 'Users',
    componentes: { panelConductor: RedAvanzadaPanel },
    tablas: ['red_cliente'],
  },
};

Seguridad

    RLS en todas las tablas: Sin excepción.

    JWT con tenant_id y rol: Inyectado en app_metadata al autenticar.

    Service Role Key nunca en frontend.

    Validación de webhooks: Wayu Pay usa HMAC-SHA256.

    Rate limiting: En Cloudflare Workers.

    CORS estricto: Solo dominios Drivip.

    Capturas de pago: Bucket privado de Supabase Storage.