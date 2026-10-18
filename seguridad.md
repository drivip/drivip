Seguridad

    RLS en todas las tablas: Sin excepción.

    JWT con tenant_id: Inyectado en app_metadata al autenticar.

    Service Role Key nunca en frontend: Solo en Edge Functions.

    Validación de webhooks: Wayu Pay usa HMAC-SHA256.

    Rate limiting: En Cloudflare Workers para prevenir abuso.

    CORS estricto: Solo dominios de Drivip.

    Capturas de pago: Almacenadas en Supabase Storage con acceso restringido.

text


---

## 📄 4. `seguridad.md`

```markdown
# Seguridad — Drivip

## Principios fundamentales

1. **Zero Trust:** Ningún componente confía en otro por defecto.
2. **Defensa en profundidad:** RLS + validación + cifrado + monitoreo.
3. **Mínimo privilegio:** Cada usuario y servicio tiene solo los permisos necesarios.
4. **Aislamiento multi-tenant:** Los datos de un conductor jamás son visibles para otro.

## Row Level Security (RLS)

### Configuración base

```sql
-- Habilitar RLS en TODAS las tablas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carreras ENABLE ROW LEVEL SECURITY;
ALTER TABLE ubicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugins_activos ENABLE ROW LEVEL SECURITY;

-- Función helper para obtener tenant_id del JWT
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID;
$$;

-- Política para tenants: solo ver el propio
CREATE POLICY "tenant_select_own"
ON tenants FOR SELECT
USING (id = auth.tenant_id());

-- Política para carreras: aislamiento total
CREATE POLICY "carreras_tenant_isolation"
ON carreras FOR ALL
USING (tenant_id = auth.tenant_id())
WITH CHECK (tenant_id = auth.tenant_id());

Roles y permisos
Rol	Acceso
maestro	Todas las tablas (bypass RLS con service role)
conductor	Solo su tenant, sus carreras, sus clientes
linea	Su tenant, sus afiliados, carreras de la línea
cliente	Solo sus carreras y su perfil
comercio	Solo sus pedidos y cuentas (plugin delivery)
Autenticación

    Supabase Auth con JWT firmado.

    tenant_id inyectado en app_metadata al momento del registro/login.

    Refresh tokens con rotación automática.

    Sesiones expiran en 7 días (configurable).

    2FA opcional para panel maestro.

Protección anti-spam
Rate limiting en Cloudflare Workers
typescript

// Middleware de rate limiting
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(ip: string, max: number = 60, windowMs: number = 60000): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(ip) || [];
  const recent = requests.filter(t => now - t < windowMs);
  
  if (recent.length >= max) return false;
  
  recent.push(now);
  rateLimiter.set(ip, recent);
  return true;
}

Validación de formularios

    Zod en frontend para validación inmediata.

    Edge Functions con validación server-side.

    Honeypot fields en formularios públicos (Home, registro).

    Turnstile (Cloudflare CAPTCHA) en formularios de registro.

Protección anti-malware

    Validación de archivos subidos: Solo imágenes JPEG/PNG < 5MB para capturas de pago.

    Escaneo con ClamAV en Edge Function antes de almacenar en Supabase Storage.

    Sanitización de inputs: Todas las entradas pasan por Zod.

    Content Security Policy (CSP): Estricta en Cloudflare Workers.

http

Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://*.supabase.co;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https://*.supabase.co https://*.tile.openstreetmap.org;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://graphhopper.com;
  font-src 'self' https://fonts.gstatic.com;

Cifrado

    En tránsito: TLS 1.3 obligatorio (Cloudflare).

    En reposo: Supabase cifra la base de datos con AES-256.

    Capturas de pago: Almacenadas en Supabase Storage con cifrado en reposo.

    Variables de entorno: Nunca en código, siempre en Cloudflare Workers Secrets o Supabase Edge Function Secrets.

Auditoría y monitoreo

    Supabase Logs: Todas las consultas quedan registradas.

    Cloudflare Analytics: Tráfico, ataques bloqueados, latencia.

    Alertas automáticas: Si un tenant intenta acceder a datos de otro, se bloquea y se notifica al maestro.

    Registro de auditoría: Tabla audit_log con todas las acciones sensibles.

sql

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    usuario_id UUID,
    accion TEXT NOT NULL,
    tabla TEXT,
    registro_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

Protección de pagos

    Capturas de pago: Almacenadas en bucket privado de Supabase Storage.

    Verificación manual: El maestro verifica cada pago antes de activar.