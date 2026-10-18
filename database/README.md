# Database — Drivip

Estructura organizada de la base de datos del proyecto, documentando cada operacion SQL que el frontend realiza.

## Estructura

```
database/
├── README.md                                    ← Este archivo
├── schema/
│   └── 000_base_tables.sql                     ← CREATE TABLE de todas las tablas
├── migrations/
│   ├── 2026-09-17_tenant_saaS_fields.sql        ← Campos vehiculo/pausa/modulos + tablas banners/notif
│   └── 2026-09-18_registro_fields.sql           ← Campo apellido en profiles + cedula en tenants
├── operations/
│   ├── 01_auth.sql                             ← signIn, signUp, signOut, getSession
│   ├── 02_tenants.sql                          ← SELECT, UPDATE (plan, pausado, vehiculo, suscripcion)
│   ├── 03_profiles.sql                         ← INSERT, SELECT, UPDATE
│   ├── 04_carreras.sql                         ← SELECT, INSERT, UPDATE, Realtime
│   ├── 05_ubicaciones.sql                      ← SELECT, INSERT, Realtime
│   ├── 06_red_cliente.sql                      ← SELECT, INSERT, DELETE
│   ├── 07_plugins_activos.sql                  ← SELECT, UPSERT
│   ├── 08_suscripciones.sql                    ← SELECT, UPDATE (verificar)
│   ├── 09_tenant_banners.sql                   ← SELECT, INSERT, UPDATE, DELETE
│   ├── 10_tenant_notificaciones.sql            ← SELECT, INSERT, DELETE
│   └── 11_clientes.sql                         ← SELECT, DELETE (superadmin)
└── rls/
    ├── 000_rls_policies.sql                    ← Policias RLS por tabla (tenant isolation)
    └── 001_superadmin_bypass.sql               ← Policies de superadmin (acceso global)
```

## Tablas del Proyecto

| # | Tabla | Descripcion | CREATE TABLE |
|---|-------|-------------|--------------|
| 1 | `tenants` | Conductores / lineas | `schema/000_base_tables.sql` |
| 2 | `profiles` | Perfiles de usuario (auth) | `schema/000_base_tables.sql` |
| 3 | `carreras` | Viajes / carreras | `schema/000_base_tables.sql` |
| 4 | `ubicaciones` | Posiciones GPS | `schema/000_base_tables.sql` |
| 5 | `red_cliente` | Circulo de conductores del cliente | `schema/000_base_tables.sql` |
| 6 | `clientes` | Registros de cliente por tenant | `schema/000_base_tables.sql` |
| 7 | `plugins_activos` | Plugins habilitados por tenant | `schema/000_base_tables.sql` |
| 8 | `suscripciones` | Pagos de suscripcion | `schema/000_base_tables.sql` |
| 9 | `tenant_banners` | Banners promocionales | `schema/000_base_tables.sql` |
| 10 | `tenant_notificaciones` | Notificaciones | `schema/000_base_tables.sql` |
| 11 | `audit_log` | Registro de auditoria | `schema/000_base_tables.sql` |

## Operaciones por Modulo

### Modulo Auth (`operations/01_auth.sql`)
| Operacion | Fuente | SQL |
|-----------|--------|-----|
| signIn | `useAuth.ts:57` | `supabase.auth.signInWithPassword()` |
| signUp | `useAuth.ts:67` | `supabase.auth.signUp()` |
| signOut | `useAuth.ts:76` | `supabase.auth.signOut()` |
| getSession | `useAuth.ts:28` | `supabase.auth.getSession()` |
| onAuthStateChange | `AuthProvider.tsx` | `supabase.auth.onAuthStateChange()` |

### Modulo Tenants (`operations/02_tenants.sql`)
| Operacion | Fuente | SQL |
|-----------|--------|-----|
| SELECT por slug | `useTenant.ts:26` | `SELECT * FROM tenants WHERE slug = $1` |
| SELECT todos | `useTenant.ts:53` | `SELECT * FROM tenants ORDER BY created_at DESC` |
| SELECT detalle | `useTenantDetail.ts:34` | 5 queries en paralelo |
| UPDATE pausado | `useTenantActions.ts:5` | `UPDATE tenants SET pausado=$1` |
| UPDATE plan | `useTenantActions.ts:13` | `UPDATE tenants SET plan=$1` |
| UPDATE modulos | `useTenantActions.ts:21` | `UPDATE tenants SET modulos_activos=$1` |
| UPDATE vehiculo | `useTenantActions.ts:29` | `UPDATE tenants SET vehiculo_*=$1` |
| UPDATE activo | `useTenantActions.ts:40` | `UPDATE tenants SET suscripcion_activa=$1` |
| UPDATE vencimiento | `useSuscripciones.ts:58` | `UPDATE tenants SET suscripcion_activa=true, fecha_vencimiento=$1` |

### Modulo Profiles (`operations/03_profiles.sql`)
| Operacion | Fuente | SQL |
|-----------|--------|-----|
| INSERT (registro) | `useAuth.ts:67` | `INSERT INTO profiles (id, nombre, apellido, ...)` |
| SELECT por id | `useAuth.ts:28` | `SELECT * FROM profiles WHERE id = $1` |
| UPDATE perfil | frontend | `UPDATE profiles SET nombre=$1, ...` |

### Modulo Carreras (`operations/04_carreras.sql`)
| Operacion | Fuente | SQL |
|-----------|--------|-----|
| SELECT por conductor | `useCarreras.ts:20` | `SELECT * FROM carreras WHERE conductor_id = $1` |
| SELECT por tenant | `useTenantDetail.ts:36` | `SELECT * FROM carreras WHERE tenant_id = $1 LIMIT 20` |
| INSERT | `useCarreras.ts:36` | `INSERT INTO carreras (...) VALUES (...)` |
| UPDATE estado | `useCarreras.ts:46` | `UPDATE carreras SET estado=$1 WHERE id=$2` |
| REALTIME conductor | `useCarreras.ts:70` | `supabase.channel('carreras').on('postgres_changes')` |
| REALTIME cliente | `useCarreraRealtime.ts:15` | `supabase.channel('carrera').on('postgres_changes')` |

### Modulo Ubicaciones (`operations/05_ubicaciones.sql`)
| Operacion | Fuente | SQL |
|-----------|--------|-----|
| SELECT por conductor | `useUbicaciones.ts:12` | `SELECT * FROM ubicaciones WHERE conductor_id=$1 LIMIT 50` |
| INSERT | `useUbicaciones.ts:37` | `INSERT INTO ubicaciones (...) VALUES (...)` |
| REALTIME | `useUbicaciones.ts:57` | `supabase.channel('ubicacion').on('postgres_changes')` |

### Modulo Red Cliente (`operations/06_red_cliente.sql`)
| Operacion | Fuente | SQL |
|-----------|--------|-----|
| SELECT por cliente | `useRedCliente.ts:12` | `SELECT * FROM red_cliente WHERE cliente_id=$1` |
| INSERT | `useRedCliente.ts:28` | `INSERT INTO red_cliente (...) VALUES (...)` |
| DELETE | `useRedCliente.ts:40` | `DELETE FROM red_cliente WHERE id=$1` |

### Modulo Plugins (`operations/07_plugins_activos.sql`)
| Operacion | Fuente | SQL |
|-----------|--------|-----|
| SELECT por tenant | `usePlugins.ts:12` | `SELECT * FROM plugins_activos WHERE tenant_id=$1` |
| UPSERT | `usePlugins.ts:27` | `INSERT ... ON CONFLICT DO UPDATE` |

### Modulo Suscripciones (`operations/08_suscripciones.sql`)
| Operacion | Fuente | SQL |
|-----------|--------|-----|
| SELECT todas | `useSuscripciones.ts:24` | `SELECT * FROM suscripciones ORDER BY created_at DESC` |
| UPDATE verificar | `useSuscripciones.ts:44` | `UPDATE suscripciones + UPDATE tenants` |

### Modulo Banners (`operations/09_tenant_banners.sql`)
| Operacion | Fuente | SQL |
|-----------|--------|-----|
| SELECT por tenant | `useTenantBanners.ts:18` | `SELECT * FROM tenant_banners WHERE tenant_id=$1` |
| INSERT | `useTenantBanners.ts:33` | `INSERT INTO tenant_banners (...) VALUES (...)` |
| UPDATE activo | `useTenantBanners.ts:46` | `UPDATE tenant_banners SET activo=$1 WHERE id=$2` |
| DELETE | `useTenantBanners.ts:58` | `DELETE FROM tenant_banners WHERE id=$1` |

### Modulo Notificaciones (`operations/10_tenant_notificaciones.sql`)
| Operacion | Fuente | SQL |
|-----------|--------|-----|
| SELECT por tenant | `useTenantNotificaciones.ts:18` | `SELECT * FROM tenant_notificaciones WHERE tenant_id=$1 LIMIT 50` |
| INSERT enviada | `useTenantNotificaciones.ts:34` | `INSERT INTO tenant_notificaciones (...) VALUES (...)` |
| DELETE | `useTenantNotificaciones.ts:47` | `DELETE FROM tenant_notificaciones WHERE id=$1``

### Modulo Clientes - Superadmin (`operations/11_clientes.sql`)
| Operacion | Fuente | SQL |
|-----------|--------|-----|
| SELECT todos | `useClientes.ts:38` | `SELECT * FROM clientes ORDER BY created_at DESC` |
| SELECT red por clientes | `useClientes.ts:52` | `SELECT * FROM red_cliente WHERE cliente_id = ANY($1)` |
| SELECT resolver tenants | `useClientes.ts:68` | `SELECT id, nombre, slug FROM tenants WHERE id = ANY($1)` |
| SELECT detalle | `useClientes.ts:129` | `SELECT * FROM clientes WHERE id = $1` |
| SELECT red del cliente | `useClientes.ts:143` | `SELECT * FROM red_cliente WHERE cliente_id = $1` |
| DELETE de red | `ClienteDetailPanel.tsx:31` | `DELETE FROM red_cliente WHERE id = $1` |
| SELECT resolver conductores | `useClientes.ts:165` | `SELECT id, nombre, slug FROM tenants WHERE id = ANY($1)` |

## Seguridad (RLS)

### Policies base (`rls/000_rls_policies.sql`)
- **Funcion helper**: `auth.tenant_id()` - obtiene tenant_id del JWT
- **Aislamiento multi-tenant**: Cada tenant solo ve sus datos
- **Policias**: tenants, profiles, carreras, ubicaciones, clientes, plugins_activos, red_cliente, suscripciones, tenant_banners, tenant_notificaciones, audit_log

### Policies superadmin (`rls/001_superadmin_bypass.sql`)
- **Funcion helper**: `auth.is_superadmin()` - verifica role='superadmin' en JWT
- **Acceso global**: Superadmin puede leer/escribir datos de cualquier tenant
- **Tablas con bypass**: clientes, red_cliente, tenants, suscripciones, carreras, profiles, ubicaciones, plugins_activos, tenant_banners, tenant_notificaciones, audit_log

### Configuracion superadmin
El usuario superadmin debe tener `role: 'superadmin'` en `app_metadata` del JWT:
```sql
UPDATE auth.users
SET app_metadata = jsonb_set(
    COALESCE(app_metadata, '{}'),
    '{role}',
    '"superadmin"'
)
WHERE email = 'kecho8a@gmail.com';
```

## Conteo Total de Operaciones

| Tipo | Cantidad |
|------|----------|
| SELECT | 21 |
| INSERT | 7 |
| UPDATE | 10 |
| DELETE | 4 |
| UPSERT | 1 |
| REALTIME | 3 |
| AUTH | 5 |
| **TOTAL** | **51** |
