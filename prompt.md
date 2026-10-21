# Prompt Técnico — Implementación de Drivip con IA

## Rol del agente

Actúa como un **arquitecto de software senior especializado en SaaS multi-tenant, PWA y aplicaciones de movilidad**. Debes implementar el sistema Drivip de forma completa, segura y lista para producción.

## Stack tecnológico obligatorio

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| PWA | `vite-plugin-pwa` + Workbox + Web Push API |
| Backend/DB | Supabase (Auth, PostgreSQL, RLS, Realtime, Edge Functions) |
| Hosting | Cloudflare Workers (wildcard subdomains) + Static Assets |
| Mapas | MapLibre GL JS + GraphHopper (self-hosted o Cloud API) |
| Routing | GraphHopper Directions API / OSRM |
| Pagos | Flujo manual (captura + WhatsApp) + Wayu Pay SDK (fase 2) |
| Notificaciones | Web Push API + Supabase Realtime |
| Estado | Zustand o TanStack Query |
| Formularios | React Hook Form + Zod |
| UI | Radix UI + Tailwind + Lucide Icons |

## Librerías específicas

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "@supabase/supabase-js": "^2.45.0",
    "maplibre-gl": "^4.7.0",
    "react-map-gl": "^7.1.7",
    "@alisdev/fe-kit-map": "latest",
    "vehicle-path-tracker": "latest",
    "graphhopper-js": "latest",
    "workbox-window": "^7.1.0",
    "vite-plugin-pwa": "^0.20.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.51.0",
    "react-hook-form": "^7.52.0",
    "zod": "^3.23.0",
    "wayu-js-sdk": "^1.1.0",
    "lucide-react": "^0.427.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "date-fns": "^3.6.0",
    "recharts": "^2.12.0",
    "qrcode.react": "^3.1.0"
  }
}
Requisitos funcionales por panel
1. Home (Plataforma de afiliación)

    Explicar el sistema, beneficios y precios.

    Formulario de registro de conductor/línea.

    Integración con flujo de pago manual ($10/mes).

    Al confirmar pago: crear tenant, generar subdominio, abrir panel.

2. Panel Maestro (CRM/ERP del SaaS)

    Gestión de tenants (conductores y líneas).

    Activar/desactivar suscripciones.

    Enviar promociones (banner) a paneles de conductores.

    Monitorización del sistema (tenants activos, carreras, ingresos).

    Alertas de vencimiento de suscripciones.

    Gestión de plugins premium.

    Respaldos, reparación y mantenimiento.

    Soporte técnico integrado.

3. Panel del Conductor

    Menú hamburguesa con modal y grid de iconos.

    Control de disponibilidad (online/offline).

    Recepción de carreras en tiempo real.

    Mapa con seguimiento en vivo (MapLibre + GraphHopper).

    Gestión de tarifas y precios.

    Historial de carreras y clientes.

    Configuración de métodos de pago.

    Notificaciones push.

4. Panel de Línea de Taxis

    Gestión de flota y afiliados.

    Creación de sub-links para cada conductor.

    Cobro de porcentaje por carrera.

    Reportes consolidados.

    Comunicación con conductores y clientes.

5. Panel de Clientes

    Solicitud de carrera con selección de origen/destino en mapa.

    Cálculo de distancia y tarifa.

    Selección de método de pago (efectivo, Pago Móvil).

    Calificación del conductor.

    Historial de carreras.

Reglas de negocio

    Aislamiento multi-tenant: Toda tabla debe tener tenant_id y políticas RLS activas.

    Subdominio único: Cada conductor tiene slug.drivip.app gestionado por Cloudflare Workers.

    Suscripción obligatoria: Sin suscripción activa, el panel del conductor queda bloqueado.

    Pago manual: El conductor sube captura, el maestro verifica y activa manualmente.

    Seguimiento en vivo: Las coordenadas del conductor se guardan en Supabase y se transmiten vía Realtime.

    Plugins modulares: Cada funcionalidad premium (zonas, aliados B2B, etc.) es un módulo activable desde el panel maestro.

Entregables

    Código fuente completo en React + TypeScript.

    Migraciones SQL para Supabase (tablas + RLS + funciones).

    Worker de Cloudflare para enrutamiento de subdominios.

    PWA configurada con manifest, service worker y push notifications.

    Documentación de despliegue y QA.