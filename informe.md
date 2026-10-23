# Informe de implementación - Drivip

Fecha: 2026-10-22
Estado: Fase 0, Fase 1 (excepto el cierre del INSERT directo), Fase 2, Fase 3 y la mayor parte de Fase 4 aplicadas y compiladas.

## 0. Estado de ejecución (2026-10-22)

Migraciones aplicadas en Supabase (`myvhzoaktrpuntbrfwux`):

- `2026-11-04_seguridad_multitenant.sql`
- `2026-11-05_ubicaciones_tiempo_real.sql`
- `2026-11-06_integridad_carreras.sql`
- `2026-11-07_verificar_suscripcion.sql`
- `2026-11-08_indices_reservas_y_acl.sql`
- `2026-11-09_reservas_realtime.sql`
- `2026-11-10_superadmin_stats.sql`

Aplicadas recientemente:

- `2026-11-11_endurecer_acl_funciones.sql` (aplicada): ACL endurecida.
- `2026-11-12_centro_comunicacion_admin.sql` (aplicada): centro de comunicacion y avisos.
- `2026-11-13_programa_referidos_socios.sql` (aplicada): referidos, socios y comisiones.
- `2026-11-14_config_referidos_admin.sql` (aplicada): RPC y permisos para editar la configuracion del programa desde superadmin.

Pendiente de aplicar:

- `2026-11-05b_cerrar_ubicaciones_directas.sql`, solo después de desplegar la PWA del conductor que usa `reportar_ubicacion`. Producción sigue sirviendo el bundle anterior (`index-DeZf5jt1.js`), por lo que cerrar el INSERT directo ahora rompería el reporte GPS de las PWA instaladas.

Cambios adicionales ya desplegados:

- Edge Function `send-push` desplegada con soporte para `reserva_id` y validación de participación en reservas.
- `pnpm build` ejecutado correctamente en los 4 apps.
- `pnpm lint` no ejecuta tareas porque los paquetes no tienen script `lint` configurado.
- Pruebas SQL ejecutadas contra Supabase: bloqueo de `tenant_id` en perfiles, bloqueo de precio/transición en carreras, precio de delivery calculado en servidor, RLS de ubicaciones (solo última posición visible), y transiciones de reservas cliente/conductor.
- MRR del superadmin calculado desde la última suscripción verificada de cada tenant activo.
- Reservas publicadas en Realtime; el conductor ve y gestiona reservas desde el menú.
- `get_superadmin_stats` entrega conteos exactos y MRR; el dashboard ya no depende de listas completas para las métricas.
- Pendientes funcionales: geolocalización centralizada en cliente y umbral de ruta en `MapPickerModal` si se confirma que genera tráfico excesivo.
- Pendiente operativo: desplegar el frontend en Cloudflare Pages. No hay `CLOUDFLARE_API_TOKEN` configurado en este entorno.

## 1. Resumen ejecutivo

Drivip está funcional en los tres paneles, pero antes de optimizar hay que corregir fallos de aislamiento multi-tenant que permiten a un usuario autenticado acceder a datos de otro conductor.

Orden recomendado:

1. Fase 0: cerrar vulnerabilidades de RLS, carreras, GPS y precios.
2. Fase 1: cambiar el reporte de ubicaciones a un RPC con throttle y agregar retención.
3. Fase 2: reducir llamadas a OSRM, geocoding y animaciones de mapa.
4. Fase 3: bajar consultas y suscripciones realtime innecesarias.
5. Fase 4: completar flujos funcionales y conexión admin-conductor.

Cada fase debe desplegarse con su migración SQL y su cambio de frontend en el mismo lote.

## 2. Hallazgos verificados

### 2.1 Críticos de seguridad

| ID | Hallazgo | Evidencia | Impacto |
|---|---|---|---|
| S1 | Cualquier usuario puede cambiar su propio `profiles.tenant_id` y `profiles.rol` | `database/rls/000_rls_policies.sql:53` (`profiles_update_own` solo valida `id = auth.uid()`) | Un cliente puede apuntar a un tenant ajeno y obtener acceso de conductor a carreras, GPS, clientes, mensajes, cupones y configuración. |
| S2 | `public.tenant_id()` usa `profiles.tenant_id` como respaldo | `database/migrations/2026-10-21_link_tenant_profile.sql:60` | Convierte S1 en escalada directa de privilegios entre tenants. |
| S3 | El cliente puede insertar y actualizar carreras directamente | `database/migrations/2026-10-22_flujo_carrera_cliente.sql:52-70` | Puede alterar precio, estado, `tenant_id` o `conductor_id` sin pasar por las RPC. |
| S4 | El cliente puede leer todo el historial GPS de cualquier conductor de su red | policy `ubicaciones_cliente_red` en `2026-10-22_flujo_carrera_cliente.sql` | Expone recorridos históricos, no solo la posición actual. |
| S5 | Delivery confía en el precio enviado por el cliente | `database/migrations/2026-10-26_servicios_cliente.sql` (`crear_solicitud_servicio`) | Se puede solicitar un delivery por debajo de la tarifa o por $0. |
| S6 | `push_subscriptions` no valida que `tenant_id` pertenezca al usuario | `database/migrations/2026-10-19_push_subscriptions.sql` | Un usuario puede registrar una suscripción con el tenant de otro y recibir notificaciones ajenas. |

### 2.2 Riesgos funcionales

- El viaje activo del cliente se pierde al recargar: `apps/cliente/src/App.tsx:552` y `:870`; no hay restauración desde `misCarreras`.
- El conductor tampoco restaura `carreraActiva` al recargar: `apps/conductor/src/pages/DriverApp.tsx:81`.
- Las reservas se guardan, pero no existe flujo de aceptación/rechazo por parte del conductor.
- `calificar_carrera` permite calificar varias veces la misma carrera.
- `quoteCarrera` (conductor) permite cambiar el precio de cualquier carrera, no solo compras/deliveries pendientes.
- No se valida que el conductor esté activo o no pausado al crear una carrera.
- El panel superadmin no valida rol en la UI: `apps/superadmin/src/App.tsx:352` solo verifica sesión. La RLS protege los datos, pero la interfaz se muestra a cualquier usuario autenticado.
- Aprobar una suscripción no notifica al conductor ni refresca el dashboard: `packages/supabase/src/useSuscripciones.ts:44`.
- El dashboard usa métricas fijas o parciales: `mrr = tenantsActivos * 10` y "Planes Activos = 3" en `apps/superadmin/src/components/AdminDashboard.tsx`.

### 2.3 Consumo excesivo de recursos

- GPS: `apps/conductor/src/pages/DriverApp.tsx:200-221` inserta una fila por cada tick de `watchPosition` mientras el conductor está online, sin intervalo mínimo ni distancia mínima.
- `useUbicaciones` descarga 50 filas que el conductor no usa: `packages/supabase/src/useUbicaciones.ts:13`.
- Rutas OSRM: `apps/cliente/src/components/passenger/LiveTripTracker.tsx:208-266` recalcula ruta 500/700 ms después de cada actualización GPS.
- `packages/maps/src/MapLibreView.tsx` ejecuta `flyTo` en el efecto de `center` y otra vez en el efecto de `carPosition`; con actualizaciones frecuentes se duplican animaciones.
- `apps/conductor/src/components/driver/DriverMapView.tsx` hace geocoding inverso en cada fix GPS.
- `packages/supabase/src/useConversaciones.ts` se suscribe a todos los `mensajes_directos` sin filtro y recarga la lista completa por RPC en cada mensaje.
- Consultas sin límite: `useCarreras`, `useMisCarreras`, `useTenants`, `useClientes` y `useSuscripciones` descargan tablas completas.

## 3. Fase 0 - Seguridad multitenant

### Objetivo

Impedir cualquier acceso o escritura cruzada entre tenants y cerrar las vías de manipulación de precios y estados.

### 3.1 Migración propuesta

Archivo: `database/migrations/2026-11-04_seguridad_multitenant.sql`

#### A. Proteger columnas sensibles de `profiles`

```sql
CREATE OR REPLACE FUNCTION public.proteger_campos_perfil()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- auth.uid() NULL = service role / SQL directo (migraciones, soporte)
    IF auth.uid() IS NOT NULL AND NOT public.is_superadmin() THEN
        IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
            RAISE EXCEPTION 'tenant_id_inmutable';
        END IF;
        IF NEW.rol IS DISTINCT FROM OLD.rol THEN
            RAISE EXCEPTION 'rol_inmutable';
        END IF;
        IF NEW.activo IS DISTINCT FROM OLD.activo THEN
            RAISE EXCEPTION 'activo_inmutable';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_proteger ON public.profiles;
CREATE TRIGGER trg_profiles_proteger
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_perfil();
```

Notas:

- El superadmin y el service role pueden seguir gestionando casos de soporte.
- Los campos editables por el usuario quedan limitados a nombre, apellido, teléfono, avatar, estado y ciudad.
- No cambiar `public.tenant_id()`: el respaldo a `profiles.tenant_id` sigue siendo necesario para los conductores.

#### B. Eliminar escrituras directas del cliente sobre `carreras`

El cliente usa RPC para crear, cancelar y calificar. No hay escrituras directas en `apps/cliente`.

```sql
DROP POLICY IF EXISTS "carreras_cliente_insert" ON public.carreras;
DROP POLICY IF EXISTS "carreras_cliente_update" ON public.carreras;
```

Se conserva:

- `carreras_cliente_select` para que el cliente vea sus carreras.
- `carreras_tenant_isolation` para el conductor.

#### C. Validar y tarifar carreras en el servidor

Trigger único para inserciones:

```sql
CREATE OR REPLACE FUNCTION public.preparar_carrera_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_straight_km double precision;
    v_modo text;
    v_base numeric;
    v_por_km numeric;
    v_tiene_zonas boolean;
BEGIN
    -- 1. El cliente no puede pedir a un conductor pausado o inactivo.
    IF NEW.cliente_id IS NOT NULL AND NEW.cliente_id = auth.uid() THEN
        IF EXISTS (
            SELECT 1 FROM public.tenants t
            WHERE t.id = NEW.tenant_id
              AND (t.pausado OR NOT t.suscripcion_activa)
        ) THEN
            RAISE EXCEPTION 'conductor_no_disponible';
        END IF;

        -- 2. Distancia mínima coherente (haversine) para viaje/delivery.
        IF NEW.tipo_servicio IN ('viaje', 'delivery')
           AND NEW.origen_lat IS NOT NULL AND NEW.origen_lng IS NOT NULL
           AND NEW.destino_lat IS NOT NULL AND NEW.destino_lng IS NOT NULL THEN
            v_straight_km := 6371 * 2 * asin(sqrt(
                power(sin(radians(NEW.destino_lat - NEW.origen_lat) / 2), 2)
                + cos(radians(NEW.origen_lat)) * cos(radians(NEW.destino_lat))
                * power(sin(radians(NEW.destino_lng - NEW.origen_lng) / 2), 2)
            ));
            IF COALESCE(NEW.distancia_km, 0) < v_straight_km * 0.95 THEN
                RAISE EXCEPTION 'distancia_invalida';
            END IF;
        END IF;
    END IF;

    -- 3. Delivery: el precio se calcula en servidor, no se acepta el del cliente.
    IF NEW.tipo_servicio = 'delivery' THEN
        SELECT tarifa_modo, tarifa_base, tarifa_por_km
        INTO v_modo, v_base, v_por_km
        FROM public.tenants
        WHERE id = NEW.tenant_id;

        IF v_modo = 'km' THEN
            NEW.precio := ROUND(
                GREATEST(v_base + v_por_km * GREATEST(COALESCE(NEW.distancia_km, 0), 0), 0)::numeric,
                2
            )::double precision;
        ELSIF v_modo = 'zona' THEN
            SELECT EXISTS (
                SELECT 1 FROM public.zonas z WHERE z.tenant_id = NEW.tenant_id
            ) INTO v_tiene_zonas;

            IF v_tiene_zonas THEN
                IF NOT EXISTS (
                    SELECT 1 FROM public.zonas z
                    WHERE z.tenant_id = NEW.tenant_id
                      AND ROUND(z.precio, 2) = ROUND(COALESCE(NEW.precio, 0)::numeric, 2)
                ) THEN
                    RAISE EXCEPTION 'precio_no_corresponde_a_zona';
                END IF;
            ELSE
                -- Si el conductor está en modo zona pero no configuró zonas,
                -- se usa la tarifa por km para no permitir precios arbitrarios.
                NEW.precio := ROUND(
                    GREATEST(v_base + v_por_km * GREATEST(COALESCE(NEW.distancia_km, 0), 0), 0)::numeric,
                    2
                )::double precision;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_carreras_preparar ON public.carreras;
CREATE TRIGGER trg_carreras_preparar
BEFORE INSERT ON public.carreras
FOR EACH ROW EXECUTE FUNCTION public.preparar_carrera_insert();
```

Notas:

- No se toca el precio de `viaje` en el trigger: `crear_carrera_cliente` ya lo calcula y aplica cupón. Un trigger que lo sobrescriba borraría el descuento.
- `compra` mantiene precio 0 hasta que el conductor cotiza.
- La validación de distancia usa línea recta al 95 %. Evita el caso extremo de `distancia_km = 0`; la distancia real de ruta sigue siendo calculada por OSRM en el cliente. Si se quiere endurecer al 100 %, la solución completa es calcular la ruta en una Edge Function o en el servidor.

#### D. Limitar el historial GPS visible para el cliente

Se necesita un helper `SECURITY DEFINER` para evitar recursión de RLS al consultar la misma tabla:

```sql
CREATE OR REPLACE FUNCTION public.es_ultima_ubicacion(p_conductor_id uuid, p_ubicacion_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT p_ubicacion_id = (
        SELECT u.id
        FROM public.ubicaciones u
        WHERE u.conductor_id = p_conductor_id
        ORDER BY u.timestamp DESC, u.id DESC
        LIMIT 1
    );
$$;

GRANT EXECUTE ON FUNCTION public.es_ultima_ubicacion(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "ubicaciones_cliente_red" ON public.ubicaciones;
CREATE POLICY "ubicaciones_cliente_red"
ON public.ubicaciones FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.red_cliente rc
        WHERE rc.cliente_id = auth.uid()
          AND rc.conductor_tenant_id = ubicaciones.conductor_id
    )
    AND (
        -- Solo la última posición cuando el conductor no está en viaje.
        public.es_ultima_ubicacion(ubicaciones.conductor_id, ubicaciones.id)
        -- Durante un viaje activo se permite el tramo reciente para seguimiento.
        OR (
            ubicaciones.timestamp > now() - interval '2 hours'
            AND EXISTS (
                SELECT 1 FROM public.carreras c
                WHERE c.cliente_id = auth.uid()
                  AND c.tenant_id = ubicaciones.conductor_id
                  AND c.estado IN ('aceptada', 'en_curso')
            )
        )
    )
);
```

#### E. Vincular push subscriptions al tenant real

```sql
DROP POLICY IF EXISTS "push_subs_insert_own" ON public.push_subscriptions;
CREATE POLICY "push_subs_insert_own"
ON public.push_subscriptions FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR tenant_id = public.tenant_id())
);

DROP POLICY IF EXISTS "push_subs_update_own" ON public.push_subscriptions;
CREATE POLICY "push_subs_update_own"
ON public.push_subscriptions FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR tenant_id = public.tenant_id())
);
```

Los clientes seguirán registrando `tenant_id = NULL`; los conductores, su propio tenant.

### 3.2 Criterios de aceptación Fase 0

- Un cliente que intenta `UPDATE profiles SET tenant_id = '<otro>'` recibe `tenant_id_inmutable`.
- Un cliente no puede hacer `INSERT` ni `UPDATE` directo en `carreras`; las RPC siguen funcionando.
- Un cliente solo recibe la última ubicación del conductor, salvo durante un viaje activo.
- Un delivery con precio manipulado se guarda con la tarifa del servidor.
- No se puede crear una carrera para un conductor pausado o con suscripción inactiva.
- Los flujos actuales de crear, aceptar, completar, cancelar y calificar siguen funcionando.

## 4. Fase 1 - Ubicaciones en tiempo real y retención

### Objetivo

Reducir escrituras y tamaño de base de datos sin perder seguimiento en vivo.

### 4.1 Migración propuesta

Archivo: `database/migrations/2026-11-05_ubicaciones_tiempo_real.sql`

#### A. Tabla de posición actual

```sql
CREATE TABLE IF NOT EXISTS public.conductor_ubicacion_actual (
    conductor_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    carrera_id uuid REFERENCES public.carreras(id) ON DELETE SET NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    velocidad double precision,
    direccion double precision,
    timestamp timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ubicacion_actual_tenant
    ON public.conductor_ubicacion_actual(tenant_id);

ALTER TABLE public.conductor_ubicacion_actual ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ubicacion_actual_conductor_select" ON public.conductor_ubicacion_actual;
CREATE POLICY "ubicacion_actual_conductor_select"
ON public.conductor_ubicacion_actual FOR SELECT
TO authenticated
USING (
    conductor_id = public.tenant_id()
    OR EXISTS (
        SELECT 1 FROM public.red_cliente rc
        WHERE rc.cliente_id = auth.uid()
          AND rc.conductor_tenant_id = conductor_ubicacion_actual.conductor_id
    )
    OR public.is_superadmin()
);
```

No se crean policies de INSERT/UPDATE/DELETE: la tabla solo se escribe mediante RPC `SECURITY DEFINER`.

#### B. RPC de reporte con throttle en servidor

```sql
CREATE OR REPLACE FUNCTION public.haversine_km(
    p_lat1 double precision, p_lng1 double precision,
    p_lat2 double precision, p_lng2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT 6371 * 2 * asin(sqrt(
        power(sin(radians(p_lat2 - p_lat1) / 2), 2)
        + cos(radians(p_lat1)) * cos(radians(p_lat2))
        * power(sin(radians(p_lng2 - p_lng1) / 2), 2)
    ));
$$;

CREATE OR REPLACE FUNCTION public.reportar_ubicacion(
    p_lat double precision,
    p_lng double precision,
    p_velocidad double precision DEFAULT NULL,
    p_direccion double precision DEFAULT NULL,
    p_carrera_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant uuid := public.tenant_id();
    v_last record;
    v_dist double precision;
    v_carrera uuid := p_carrera_id;
BEGIN
    IF v_tenant IS NULL THEN
        RAISE EXCEPTION 'no_autorizado';
    END IF;

    IF p_lat IS NULL OR p_lng IS NULL
       OR p_lat < -90 OR p_lat > 90
       OR p_lng < -180 OR p_lng > 180 THEN
        RAISE EXCEPTION 'ubicacion_invalida';
    END IF;

    -- Solo se asocia una carrera propia y activa.
    IF v_carrera IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.carreras c
        WHERE c.id = v_carrera
          AND c.tenant_id = v_tenant
          AND c.estado IN ('aceptada', 'en_curso')
    ) THEN
        v_carrera := NULL;
    END IF;

    SELECT lat, lng, timestamp
    INTO v_last
    FROM public.ubicaciones
    WHERE conductor_id = v_tenant
    ORDER BY timestamp DESC
    LIMIT 1;

    v_dist := CASE
        WHEN v_last IS NULL THEN NULL
        ELSE public.haversine_km(v_last.lat, v_last.lng, p_lat, p_lng)
    END;

    -- Historial: mínimo 12 segundos o 40 metros.
    IF v_last IS NULL
       OR now() - v_last.timestamp >= interval '12 seconds'
       OR COALESCE(v_dist, 0) >= 0.04 THEN
        INSERT INTO public.ubicaciones (
            conductor_id, tenant_id, carrera_id, lat, lng,
            velocidad, direccion, timestamp
        ) VALUES (
            v_tenant, v_tenant, v_carrera, p_lat, p_lng,
            p_velocidad, p_direccion, now()
        );
    END IF;

    -- Posición actual: una sola fila por conductor, se actualiza en cada reporte.
    INSERT INTO public.conductor_ubicacion_actual (
        conductor_id, tenant_id, carrera_id, lat, lng,
        velocidad, direccion, timestamp
    ) VALUES (
        v_tenant, v_tenant, v_carrera, p_lat, p_lng,
        p_velocidad, p_direccion, now()
    )
    ON CONFLICT (conductor_id) DO UPDATE
    SET tenant_id = EXCLUDED.tenant_id,
        carrera_id = EXCLUDED.carrera_id,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        velocidad = EXCLUDED.velocidad,
        direccion = EXCLUDED.direccion,
        timestamp = EXCLUDED.timestamp;

    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.reportar_ubicacion(double precision, double precision, double precision, double precision, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reportar_ubicacion(double precision, double precision, double precision, double precision, uuid) TO authenticated;
```

#### C. Realtime y retención

```sql
ALTER TABLE public.conductor_ubicacion_actual REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'conductor_ubicacion_actual'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conductor_ubicacion_actual;
    END IF;
END $$;

-- Requiere la extensión pg_cron habilitada en Supabase.
-- Si no está disponible, programar la misma limpieza con una Edge Function cron.
SELECT cron.schedule(
    'drivip_purgar_ubicaciones',
    '0 4 * * *',
    $$DELETE FROM public.ubicaciones WHERE timestamp < now() - interval '30 days';$$
);
```

Retención sugerida: 30 días de historial. Las posiciones actuales viven en `conductor_ubicacion_actual` y no se purgan.

#### D. Cerrar escrituras directas sobre `ubicaciones` (después de desplegar frontend)

```sql
DROP POLICY IF EXISTS "ubicaciones_conductor_isolation" ON public.ubicaciones;
CREATE POLICY "ubicaciones_conductor_select"
ON public.ubicaciones FOR SELECT
TO authenticated
USING (conductor_id = public.tenant_id());
```

Esta parte debe aplicarse cuando la PWA del conductor ya use `reportar_ubicacion`. Si se aplica antes, el reporte antiguo (INSERT directo) deja de funcionar.

### 4.2 Cambios de frontend

- `packages/supabase/src/useUbicaciones.ts`
  - Separar `useUbicaciones` (historial, solo si se usa) de `useReportarUbicacion`.
  - `reportarUbicacion` llama `supabase.rpc("reportar_ubicacion", { p_lat, p_lng, p_velocidad, p_direccion, p_carrera_id })`.
  - Eliminar la descarga de 50 filas en el panel del conductor.
- `apps/conductor/src/pages/DriverApp.tsx`
  - Pasar `carreraActiva` como `p_carrera_id`.
  - Mantener el throttle del navegador en 5 segundos para no saturar la red; el servidor aplica 12 s / 40 m para historial.
- `packages/supabase/src/useUbicaciones.ts` (`useRealtimeUbicacionConductor`)
  - Suscribirse a `conductor_ubicacion_actual` filtrando `conductor_id=eq.<id>`.
- `apps/cliente/src/hooks/useConductorLocation.ts`
  - Consultar `conductor_ubicacion_actual` con `.eq("conductor_id", conductorId).maybeSingle()`.
- `packages/types` y `packages/supabase/src/index.ts`
  - Agregar el tipo de ubicación actual y exportar el nuevo hook.

### 4.3 Criterios de aceptación Fase 1

- Un conductor online genera como máximo una fila de historial cada 12 s o cada 40 m.
- La posición actual se actualiza en una sola fila por conductor.
- El cliente ve el vehículo moverse en vivo durante el viaje.
- El historial de `ubicaciones` no crece indefinidamente.

## 5. Fase 2 - Rutas, geocoding y mapas

### Objetivo

Reducir llamadas a OSRM, Nominatim/Photon y animaciones de mapa sin perder precisión visible.

### 5.1 Recálculo de ruta con umbral

Archivo: `apps/cliente/src/components/passenger/LiveTripTracker.tsx`

- Guardar la última ruta calculada en una ref: `{ lat, lng, at }`.
- Recalcular solo si:
  - el conductor se movió al menos 100-150 m, o
  - pasaron al menos 20-30 segundos.
- Entre recálculos, estimar distancia/ETA con `haversineKm` sobre la ruta actual.
- Abortar la petición anterior si llega una nueva actualización.
- No lanzar la petición si el viaje está completado o cancelado.

Aplicar el mismo patrón en:

- `apps/conductor/src/components/driver/DriverMapView.tsx` (ruta a recogida y ruta al destino).
- `apps/cliente/src/components/passenger/ServiceRequestModal.tsx` (ruta de delivery).
- `apps/cliente/src/components/passenger/MapPickerModal.tsx` (ruta al confirmar puntos, no en cada cambio de mapa).

### 5.2 Cámara del mapa

Archivo: `packages/maps/src/MapLibreView.tsx`

- Evitar dos `flyTo` por actualización. Opción recomendada:
  - El efecto de `carPosition` solo actualiza el marcador.
  - Un único efecto de cámara decide si mover el mapa.
- Mover la cámara solo si:
  - el desplazamiento es mayor a 10-15 m, o
  - se cambió de zoom.
- Usar `easeTo` con duración corta (200-300 ms) o `jumpTo` para saltos grandes.
- Respetar `userDraggingRef`: si el usuario movió el mapa, no recentrar automáticamente hasta que pulse "recentrar".

### 5.3 Geocoding inverso

Archivo: `apps/conductor/src/components/driver/DriverMapView.tsx`

- No llamar en cada fix GPS.
- Llamar solo si:
  - el usuario lo solicita, o
  - el conductor se movió más de 100 m y pasaron más de 30 segundos.
- Cachear la última dirección por coordenadas redondeadas a 4 decimales.
- Abortar o ignorar respuestas viejas.

### 5.4 Geolocalización centralizada

- Evitar múltiples `watchPosition` simultáneos en una misma pantalla.
- Opción: un `GeolocationProvider` en `apps/cliente` que entregue la posición a `MapView`, `MapPickerModal` y `LiveTripTracker` cuando corresponda.
- En el conductor, mantener un solo watcher en `DriverMapView` o en `DriverApp`, no ambos.

### 5.5 Criterios de aceptación Fase 2

- Durante un viaje de 10 minutos, las llamadas a OSRM bajan de decenas por minuto a un máximo de 2-3 por minuto.
- El vehículo se sigue viendo fluido; la cámara no reinicia la animación en cada tick.
- El geocoding inverso no se ejecuta más de una vez cada 30 s ni con desplazamientos menores a 100 m.

## 6. Fase 3 - Realtime y consultas

### 6.1 Mensajes

Archivo: `packages/supabase/src/useConversaciones.ts`

Problema actual: se escucha `mensajes_directos` sin filtro y se recarga la lista completa por RPC en cada mensaje.

Cambio propuesto:

- Cliente: suscribirse a `conversaciones` con `filter: cliente_id=eq.<uid>`.
- Conductor: suscribirse a `conversaciones` con `filter: tenant_id=eq.<tenantId>`.
- El trigger `touch_conversacion` ya actualiza `conversaciones.updated_at` en cada mensaje, por lo que la lista se refresca solo cuando cambia una conversación propia.
- Mantener `useMensajesDirectos` por conversación abierta como está.
- Debounce de 250-300 ms para evitar ráfagas.

### 6.2 Límites y paginación

- `useCarreras`: `.limit(conductorId ? 100 : 200)`.
- `useMisCarreras`: `.limit(50)` y paginación por cursor si se necesita historial completo.
- `useTenants`: `.limit(200)` o paginación.
- `useSuscripciones`: consultar pendientes con `.eq("estado", "pendiente")` y el historial aparte con `.limit(100)`.
- `useClientes`: paginar perfiles (50 por página) y evitar `.in()` con todos los IDs; a futuro, una RPC de administración que haga los joins en servidor.
- Dashboard superadmin: usar consultas de conteo (`count: "exact"`, `head: true`) o una RPC `get_superadmin_stats` en lugar de descargar todas las carreras y clientes.

### 6.3 Índices adicionales

```sql
CREATE INDEX IF NOT EXISTS idx_carreras_tenant_created
    ON public.carreras(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_carreras_cliente_created
    ON public.carreras(cliente_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado_created
    ON public.suscripciones(estado, created_at DESC);
```

### 6.4 Criterios de aceptación Fase 3

- Enviar un mensaje no provoca una consulta de lista en todos los usuarios conectados; solo en los participantes.
- El panel del conductor carga un máximo de 100 carreras.
- El dashboard no descarga tablas completas para calcular contadores.

## 7. Fase 4 - Funcionalidad y conexión entre paneles

### 7.1 Restaurar viaje activo

- Cliente (`apps/cliente/src/App.tsx`):
  - Al cargar `misCarreras`, buscar la más reciente con estado `pendiente`, `aceptada` o `en_curso` y hacer `setActiveCarrera`.
  - No sobrescribir si el usuario ya inició otra solicitud.
- Conductor (`apps/conductor/src/pages/DriverApp.tsx`):
  - Al cargar `carreras`, si no hay `carreraActiva`, seleccionar la carrera `aceptada` o `en_curso` más reciente.
- Opcional: guardar el ID en `localStorage` para restaurar antes de que llegue la consulta.

### 7.2 Reservas

Implementar el flujo completo o retirar la función temporalmente:

- RPC `listar_reservas_conductor` con filtro por tenant.
- Acciones aceptar/rechazar/cancelar con validación de estado.
- Push al conductor al crear una reserva.
- Vista de reservas en el panel del conductor.

### 7.3 Integridad de estados y calificaciones

- RPC `actualizar_estado_carrera` para el conductor con transiciones permitidas:
  - `pendiente -> aceptada | cancelada`
  - `aceptada -> en_curso | cancelada`
  - `en_curso -> completada`
- RPC `cotizar_carrera` limitada a `tipo_servicio IN ('delivery', 'compra')`, estado `pendiente` y tenant propio.
- `calificar_carrera`:
  - Solo carreras `completada`.
  - Solo si `calificacion IS NULL` (una sola vez).
  - Recalcular promedio solo con carreras completadas.

### 7.4 Admin

- Validar rol al entrar: `supabase.rpc("is_superadmin")`; si es `false`, mostrar "sin acceso" y cerrar sesión.
- Aprobar suscripción con una RPC transaccional:
  - actualizar `suscripciones`,
  - actualizar `tenants`,
  - insertar notificación,
  - devolver el `tenant_id` para que el frontend envíe el push.
- Refrescar `tenants` y `suscripciones` después de aprobar, o suscribirse a cambios realtime.
- Métricas reales:
  - MRR según `plan` del tenant.
  - Cantidad de planes activos calculada, no fija en 3.
  - Carreras y clientes con conteos, no listas completas.

### 7.5 Criterios de aceptación Fase 4

- Recargar la PWA del cliente durante un viaje mantiene el seguimiento.
- Recargar la PWA del conductor mantiene la carrera activa.
- El conductor ve y puede gestionar reservas.
- Un viaje solo se puede calificar una vez y solo al completarse.
- El superadmin sin rol no accede al panel.
- Aprobar una suscripción activa al conductor y le llega una notificación.

## 8. Orden de ejecución y despliegue

1. Crear y revisar la migración de Fase 0.
2. Ejecutarla en un entorno de staging con una copia de la base.
3. Desplegar el frontend de Fase 0 si hay cambios de llamadas (no debería haberlos).
4. Ejecutar pruebas de ataque SQL y pruebas manuales de los tres paneles.
5. Aplicar Fase 1 (tabla actual + RPC + realtime + retención).
6. Desplegar el frontend que usa `reportar_ubicacion`.
7. Aplicar la migración que cierra el INSERT directo en `ubicaciones`.
8. Aplicar Fase 2, 3 y 4 por lotes independientes.

Comandos de referencia:

```powershell
pnpm install
pnpm build
pnpm lint
```

Para base de datos:

```powershell
supabase link --project-ref <project-ref>
supabase db push
```

Alternativa: ejecutar los `.sql` en el SQL Editor de Supabase en orden.

## 9. Verificación de seguridad

Ejecutar como cliente autenticado (no como service role):

```sql
-- Debe fallar con tenant_id_inmutable
UPDATE public.profiles SET tenant_id = '<uuid-de-otro-tenant>' WHERE id = auth.uid();

-- Debe fallar por RLS (no hay policy de INSERT para clientes)
INSERT INTO public.carreras (tenant_id, cliente_id, origen_lat, origen_lng)
VALUES ('<uuid-tenant>', auth.uid(), 10.48, -66.90);

-- No debe modificar la carrera
UPDATE public.carreras SET precio = 0 WHERE cliente_id = auth.uid();

-- Solo debe devolver la última ubicación (o el tramo activo)
SELECT * FROM public.ubicaciones WHERE conductor_id = '<uuid-conductor>';

-- Debe fallar si el conductor está pausado o inactivo
SELECT public.crear_carrera_cliente(
    '<uuid-conductor>', 10.48, -66.90, 'Origen',
    10.49, -66.88, 'Destino', 3.0, 10, 1.00, 'efectivo', NULL
);
```

Pruebas funcionales:

- Cliente solicita viaje, conductor recibe push, acepta, llega, inicia y completa.
- Cliente ve movimiento en vivo y recibe estados.
- Chat cliente-conductor en ambos sentidos.
- Cliente cancela y califica.
- Admin pausa, reactiva, aprueba pago, envía notificación y banner.
- Recargar ambas PWA en medio de un viaje.

## 10. Archivos afectados

### Base de datos

- `database/migrations/2026-11-04_seguridad_multitenant.sql` (aplicada)
- `database/migrations/2026-11-05_ubicaciones_tiempo_real.sql` (aplicada)
- `database/migrations/2026-11-05b_cerrar_ubicaciones_directas.sql` (creada, pendiente de despliegue)
- `database/migrations/2026-11-06_integridad_carreras.sql` (aplicada)
- `database/migrations/2026-11-07_verificar_suscripcion.sql` (aplicada)
- `database/migrations/2026-11-08_indices_reservas_y_acl.sql` (aplicada; índices, policies y trigger de reservas, ACL de tarifas)
- `database/migrations/2026-11-09_reservas_realtime.sql` (aplicada; `reservas` en Realtime con `REPLICA IDENTITY FULL`)
- `database/migrations/2026-11-10_superadmin_stats.sql` (aplicada; RPC `get_superadmin_stats`)
- `supabase/functions/send-push/index.ts` (desplegada con soporte `reserva_id`)

### Frontend

- `packages/supabase/src/useUbicaciones.ts`
- `packages/supabase/src/useConversaciones.ts`
- `packages/supabase/src/useCarreras.ts`
- `packages/supabase/src/useConductorRed.ts`
- `packages/supabase/src/useTenant.ts`
- `packages/supabase/src/useSuscripciones.ts`
- `packages/supabase/src/useReservasCliente.ts`
- `packages/supabase/src/useReservasConductor.ts` (nuevo)
- `packages/supabase/src/useSuperadminStats.ts` (nuevo)
- `packages/supabase/src/notificacionesCarrera.ts`
- `packages/supabase/src/index.ts`
- `packages/types/src/` (tipos de ubicación actual y respuestas nuevas)
- `apps/conductor/src/components/Reservas.tsx` (nuevo)
- `apps/conductor/src/components/driver/DriverFullGridMenu.tsx`
- `packages/maps/src/MapLibreView.tsx`
- `apps/conductor/src/pages/DriverApp.tsx`
- `apps/conductor/src/components/driver/DriverMapView.tsx`
- `apps/cliente/src/App.tsx`
- `apps/cliente/src/hooks/useConductorLocation.ts`
- `apps/cliente/src/components/passenger/LiveTripTracker.tsx`
- `apps/cliente/src/components/passenger/ServiceRequestModal.tsx`
- `apps/cliente/src/components/passenger/MapPickerModal.tsx`
- `apps/superadmin/src/App.tsx`
- `apps/superadmin/src/components/AdminDashboard.tsx`

## 11. Decisiones y estado

1. Retención de ubicaciones: 30 días aplicado con `pg_cron`; ajustar según costo/necesidad.
2. Precio de viaje: se mantiene el precio calculado en cliente para viajes y se valida distancia en servidor; delivery se tarifa en servidor. Si se requiere precio 100 % servidor para viajes, hace falta una Edge Function de ruteo.
3. Reservas: flujo parcial implementado. El cliente crea/cancela; el conductor ve, confirma, rechaza o completa desde `Reservas`. Queda pendiente convertir una reserva confirmada en carrera al llegar la hora (requiere cron/Edge Function).
4. `get_tarifas_tenant`: restringido a `authenticated`; `anon` ya no puede ejecutarlo.
5. Purga: aplicada con `pg_cron` (`drivip_purgar_ubicaciones`, diaria 04:00).

## 12. Manejo de credenciales

- No incluir claves en este documento ni en el repositorio.
- Para migraciones usar `supabase db query --linked -f <archivo>` con el proyecto enlazado y `SUPABASE_ACCESS_TOKEN` en el entorno. No usar `supabase db push` porque el historial remoto está vacío y las migraciones locales viven en `database/migrations`.
- La service role key omite RLS: usarla solo para migraciones, soporte y tareas administrativas.
- Para las Edge Functions, configurar `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` con `supabase secrets set` y nunca en `.env` del frontend.
- La `VITE_SUPABASE_ANON_KEY` es pública por diseño; no da acceso a datos protegidos por RLS.

## 13. Centro de comunicación Superadmin <-> Conductor

- Migración: `database/migrations/2026-11-12_centro_comunicacion_admin.sql` (aplicada).
- Tabla `admin_mensajes` con RLS por tenant y bypass de superadmin.
- RPC: `enviar_mensaje_admin`, `listar_mensajes_admin`, `listar_conversaciones_admin`, `marcar_mensajes_admin_leidos`, `generar_avisos_suscripcion`.
- Avisos automáticos: servicio activo, suscripción por vencer (7 días, recordatorio cada 20 h) y servicio inactivo.
- Cron diario `drivip_avisos_suscripcion` a las 13:00 si `pg_cron` está disponible.
- Conductor: nueva pestaña "Drivip" en el modal de perfil, acceso "Soporte Drivip" en el menú, fila fija en el centro de mensajes y aviso flotante para mensajes nuevos.
- Superadmin: módulo "Soporte" con bandeja por conductor, chat bidireccional, contador de no leídos, aviso flotante y push al conductor.
- `useTenantNotificaciones` ahora replica las notificaciones manuales del superadmin en el nuevo centro.

## 14. Programa de referidos y socios Drivip

- Migraci�n: `database/migrations/2026-11-13_programa_referidos_socios.sql` (aplicada).
- Reglas: 10 % de descuento por cada referido activo (m�ximo 100 %); a los 10 referidos activos la mensualidad es gratis y el conductor pasa a socio Drivip; desde socio gana 5 % de la mensualidad de cada referido activo mientras siga activo.
- Configuraci�n administrable en `config_referidos` (porcentajes y precios de plan).
- Datos nuevos: `tenants.socio_drivip`, `socio_desde`, `pago_movil_socio_*`; `referidos.activado_at`, `plan_referido`, `monto_mensual_referido`; tablas `comisiones_referido` y `pagos_referido`.
- RPC conductor: `registrar_referido`, `obtener_mis_referidos`, `calcular_cuenta_referidos`, `guardar_pago_movil_socio`.
- RPC superadmin: `listar_referidos_admin`, `listar_referidos_detalle_admin`, `pagar_comisiones_referido`, `generar_comisiones_mes_referidos`.
- Triggers: activaci�n/desactivaci�n de referidos al cambiar `suscripcion_activa` o `plan`, generaci�n de comisiones al verificar suscripciones y promoci�n a socio al llegar a la meta.
- Cron mensual `drivip_comisiones_referidos` (d�a 1, 13:00) si `pg_cron` existe.
- Conductor: nuevo panel de referidos con ID/link, progreso a socio, Pago M�vil, billetera de comisiones; tarjeta en Billetera y descuento en Mi Plan.
- Superadmin: m�dulo "Referidos" con alertas de pago, descuentos por conductor, detalle de referidos activos, registro de pagos y badge de pendientes en la barra lateral.
- Superadmin: editor de la configuracion del programa (descuento, meta, comision y precios de plan) mediante `actualizar_config_referidos`; la tabla queda solo lectura para `authenticated`.
- Registro: campo opcional "C�digo de referido" con prefijado autom�tico desde `?ref=`.
- Verificado contra Supabase: migracion aplicada; prueba transaccional de activacion, descuento del 10 %, promocion a socio y comision del 5 % correcta (rollback sin datos residuales).
- Verificado contra Supabase: autoreferido y codigo invalido rechazados; Pago Movil rechazado para no socios; pago de comisiones marca la comision como pagada, crea el pago y notifica al socio (rollback sin datos residuales).
- Seguridad: permisos por defecto de Supabase revocados; `anon` solo ejecuta `get_tasa_actual` y `get_tenant_by_slug`; RPCs internas y de administracion no ejecutables por `anon`/`authenticated`; `generar_avisos_suscripcion` exige superadmin cuando hay sesion.
- Verificado contra Supabase: `actualizar_config_referidos` actualiza los 6 valores con JWT superadmin, rechaza a un usuario sin `app_metadata.role=superadmin` y no deja escritura directa a `authenticated` (rollback sin cambios persistidos).
- Superadmin: `PlanManager` muestra precios desde `config_referidos` y conteos reales de conductores activos; el modal de cambio de plan en `TenantDetailPanel` y el monto sugerido de pago usan esos precios.
- Conductor: `MiPlan` usa `calcular_cuenta_referidos` y, como respaldo, los precios de `config_referidos`; ya no depende de precios fijos.
- Typecheck y build de `@drivip/superadmin`, `@drivip/conductor` y `@drivip/supabase` ejecutados sin errores tras la integracion.
