
---

## 📄 7. `instalación.md`

```markdown
# Instalación y Despliegue — Drivip

## Requisitos previos

- Node.js 20+
- npm o pnpm
- Cuenta en Supabase (gratuita)
- Cuenta en Cloudflare (gratuita)
- Dominio `drivip.app` (o el que uses)
- Git

## Paso 1: Configurar Supabase

### 1.1 Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto.
2. Anota: `Project URL`, `anon key`, `service_role key`.
3. En **Authentication > Providers**, habilita Email/Password.
4. En **Authentication > Settings**, configura:
   - JWT expiry: 604800 (7 días)
   - Refresh token rotation: ON

### 1.2 Ejecutar migraciones SQL

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref TU_PROJECT_REF

# Aplicar migraciones
supabase db push
O pegar el SQL de database.md directamente en el SQL Editor de Supabase.
1.3 Configurar RLS

Verificar que todas las tablas tengan RLS habilitado:
sql

SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

1.4 Habilitar Realtime

En Database > Replication, habilitar las tablas:

    carreras

    ubicaciones

    pedidos

1.5 Crear buckets de Storage

En Storage, crear:

    comprobantes (privado)

    logos (público)

1.6 Configurar Custom Access Token Hook

En Authentication > Hooks, crear un hook que inyecte tenant_id y rol en el JWT:
sql

CREATE OR REPLACE FUNCTION auth.custom_access_token_hook(event JSONB)
RETURNS JSONB AS $$
DECLARE
    claims JSONB;
    user_tenant_id UUID;
    user_rol TEXT;
BEGIN
    -- Obtener tenant_id y rol del usuario
    SELECT tenant_id, rol INTO user_tenant_id, user_rol
    FROM public.profiles
    WHERE id = (event->>'user_id')::UUID;

    claims := event->'claims';

    IF user_tenant_id IS NOT NULL THEN
        claims := jsonb_set(claims, '{app_metadata, tenant_id}', to_jsonb(user_tenant_id));
    END IF;

    IF user_rol IS NOT NULL THEN
        claims := jsonb_set(claims, '{app_metadata, rol}', to_jsonb(user_rol));
    END IF;

    event := jsonb_set(event, '{claims}', claims);
    RETURN event;
END;
$$ LANGUAGE plpgsql STABLE;

Paso 2: Configurar Cloudflare Workers
2.1 Instalar Wrangler
bash

npm install -g wrangler
wrangler login

2.2 Configurar DNS wildcard

En el dashboard de Cloudflare:

    Ve a DNS > Records.

    Añade un registro A:

        Name: @

        Content: 192.0.2.0 (placeholder, Workers intercepta)

        Proxy: ON (naranja)

    Añade un registro CNAME:

        Name: *

        Content: drivip.app

        Proxy: ON (naranja)

2.3 Crear el Worker
bash

mkdir drivip-router && cd drivip-router
npm init -y
npm install wrangler --save-dev

wrangler.toml:
toml

name = "drivip-router"
main = "src/worker.ts"
compatibility_date = "2025-01-01"

[vars]
SUPABASE_URL = "https://tu-proyecto.supabase.co"

[[routes]]
pattern = "*.drivip.app/*"
zone_name = "drivip.app"

[env.production]
routes = [
  { pattern = "*.drivip.app/*", zone_name = "drivip.app" }
]

src/worker.ts:
typescript

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const host = url.hostname;

    // Dominio principal: servir Home
    if (host === 'drivip.app' || host === 'www.drivip.app') {
      return env.ASSETS.fetch(request);
    }

    // Subdominio: extraer slug
    const slug = host.split('.')[0];

    // Buscar tenant
    const tenant = await getTenantBySlug(env, slug);
    if (!tenant) {
      return new Response('Conductor no encontrado', { status: 404 });
    }

    // Inyectar headers
    const newRequest = new Request(request);
    newRequest.headers.set('X-Tenant-Id', tenant.id);
    newRequest.headers.set('X-Tenant-Slug', slug);
    newRequest.headers.set('X-Tenant-Nombre', tenant.nombre);

    return env.ASSETS.fetch(newRequest);
  }
};

async function getTenantBySlug(env: Env, slug: string) {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/tenants?slug=eq.${slug}&select=id,slug,nombre,tipo`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  const data = await res.json();
  return data[0] || null;
}

2.4 Desplegar Worker
bash

wrangler deploy --env production

Paso 3: Configurar Frontend (React PWA)
3.1 Crear proyecto
bash

npm create vite@latest drivip-app -- --template react-ts
cd drivip-app
npm install

3.2 Instalar dependencias
bash

npm install @supabase/supabase-js maplibre-gl react-map-gl zustand @tanstack/react-query react-router-dom react-hook-form zod lucide-react qrcode.react date-fns recharts wayu-js-sdk
npm install -D vite-plugin-pwa workbox-window

3.3 Configurar Vite PWA

vite.config.ts:
typescript

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Drivip',
        short_name: 'Drivip',
        description: 'Tu taxi, tu marca, tu app',
        theme_color: '#6B21A8',
        background_color: '#0E1733',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
});

3.4 Configurar Supabase Client

src/lib/supabase.ts:
typescript

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

3.5 Configurar variables de entorno

.env.local:
env

VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_GRAPH_HOPPER_KEY=tu_graphhopper_key
VITE_APP_URL=https://drivip.app

3.6 Desplegar en Cloudflare Workers
bash

npm run build
wrangler pages deploy dist --project-name=drivip-app

Paso 4: Notificaciones Push
4.1 Generar claves VAPID
bash

npx web-push generate-vapid-keys

Guardar Public Key y Private Key.
4.2 Configurar Service Worker

public/sw-push.js:
javascript

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Drivip', {
      body: data.body || 'Nueva notificación',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.url || '/',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});

4.3 Enviar notificaciones desde Supabase Edge Function
typescript

// supabase/functions/send-push/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import webpush from 'https://esm.sh/web-push@3.6.6';

serve(async (req) => {
  const { subscription, title, body, url } = await req.json();
  
  await webpush.sendNotification(
    subscription,
    JSON.stringify({ title, body, url }),
    {
      vapidDetails: {
        subject: 'mailto:soporte@drivip.app',
        publicKey: Deno.env.get('VAPID_PUBLIC_KEY')!,
        privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!,
      },
    }
  );

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});