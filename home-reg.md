# Plan de Implementación: Home + Registro Drivip

## Resumen Ejecutivo

Se modificarán **3 archivos principales** y se creará **1 migración SQL** para rediseñar el flujo de registro de Drivip.

| # | Archivo | Cambio |
|---|---|---|
| 1 | `apps/home/src/App.tsx` | Simplificar a solo hero + 2 CTAs + footer |
| 2 | `apps/cliente/src/App.tsx` | Landing: beneficios + install + registro → panel cliente |
| 3 | `apps/conductor/src/App.tsx` | Landing: beneficios + install + planes + registro + pago → panel conductor (espera) |
| 4 | `database/migrations/` | Agregar campos `apellido`, `cedula` + Storage bucket |

---

## Flujo General de Registro

```
HOME
  ├── "Soy Cliente" → Landing Cliente
  │     ├── Beneficios
  │     ├── Cómo instalar (PWA)
  │     ├── Formulario Registro
  │     │     → Crea cuenta Supabase Auth
  │     │     → Crea perfil en tabla profiles (rol: cliente)
  │     │     → Genera ID único
  │     │     → REDIRECT a panel cliente (logueado)
  │     └── Login (si ya tiene cuenta)
  │
  └── "Soy Conductor" → Landing Conductor
        ├── Beneficios
        ├── Cómo instalar (PWA)
        ├── Planes ($10 / $20)
        ├── Formulario Registro
        │     → Crea cuenta Supabase Auth
        │     → Crea tenant en tabla tenants (suscripcion_activa: false)
        │     → Genera ID único
        │     → Genera slug personalizado (ej: "josetaxi.drivip.app")
        │     → Genera QR y enlace personal
        │     → REDIRECT a pantalla "Esperando validación"
        │     → Muestra datos de Pago Móvil
        │     → Botón "Enviar comprobante por WhatsApp"
        │
        └── ADMIN valida pago
              → suscripcion_activa = true
              → conductor puede usar el panel
```

---

## FASE 1: Home Page (`apps/home/src/App.tsx`)

**Objetivo:** Página mínima con dos CTAs claros. Sin beneficios, sin planes, sin estadísticas.

### Secciones a ELIMINAR:
- Stats (50K+, 2500+, 15+)
- Beneficios (6 cards genéricas)
- Cómo funciona (3 pasos)
- Conductores activos (5 cards mock)
- Planes (3 planes)
- CTA final

### Estructura final de la Home:
```
NAVBAR
  ├── Logo Drivip
  └── Botones: "Soy Cliente" | "Soy Conductor"

HERO
  ├── Badge
  ├── Título (H1)
  ├── Subtítulo (P)
  └── 2 CTAs

FOOTER
  ├── Logo
  ├── Links (Términos, Privacidad, Contacto)
  └── Copyright
```

### Contenido del Hero:

| Elemento | Texto |
|---|---|
| Badge | "Para conductores independientes en Venezuela" |
| H1 | "Tu propia app para fidelizar a tus clientes" |
| P | "Drivip le da a cada conductor su aplicación web personalizada. Tú decides tus tarifas, tu disponibilidad y cómo cobrar. Pagas solo una mensualidad fija." |
| CTA primario | **"Soy Conductor — Quiero mi app"** → `/conductor` |
| CTA secundario | **"Soy Cliente — Busco conductor"** → `/cliente` |

### Navbar:

| Elemento | Texto |
|---|---|
| Links (ocultos en mobile) | Beneficios → `#beneficios` (anchor scrolling a landing) |
| Botón izquierdo | "Soy Cliente" → `/cliente` |
| Botón derecho | "Soy Conductor" → `/conductor` |

**Nota:** Los links de navbar se pueden simplificar ya que la home es mínima. Opcionalmente se pueden quitar los anchors y dejar solo los dos CTAs.

### Footer:
- Sin cambios significativos. Mantener logo, links y copyright.

---

## FASE 2: Landing Cliente (`apps/cliente/src/App.tsx`)

**Objetivo:** Beneficios + cómo instalar + registro completo + redirect al panel.

### 2.1 Navbar (actualizar)

| Elemento | Texto |
|---|---|
| Links | Inicio, Beneficios, Cómo Instalar, Iniciar Sesión, Registrarse |
| Botón | "Soy Conductor" → `/conductor` |

### 2.2 Hero (reescibir)

| Elemento | Texto |
|---|---|
| H1 | "Guarda a tus conductores de confianza" |
| P | "Pide al que esté activo o cobre menos. Paga directo al conductor, como siempre." |
| CTA primario | "Registrarse Gratis" |
| CTA secundario | "Iniciar Sesión" |

### 2.3 Beneficios (nueva sección)

Sección con id="beneficios". Grid de 6 cards flotantes (mismo estilo `boxShadow` actual).

| # | Icono | Título | Descripción |
|---|---|---|---|
| 1 | `bookmark` | Guarda tus conductores | Ten a todos tus conductores favoritos en un solo panel. |
| 2 | `search` | Elige al mejor | Pide al que esté activo o cobre menos. Sin escribir a cinco taxistas. |
| 3 | `qr_code_scanner` | Escanea y listo | Abres el QR de tu conductor y se instala en tu teléfono. Sin tienda de apps. |
| 4 | `paid` | Paga directo | Efectivo, Pago Móvil, Zelle. El conductor recibe todo. |
| 5 | `history` | Historial | Ves cuánto has pagado, a quién y cuándo. |
| 6 | `event` | Reservas | Agenda un viaje para mañana o para la próxima semana. |

### 2.4 Cómo Instalar (nueva sección)

Sección con id="como-instalar". Dos cards flotantes lado a lado (`md:grid-cols-2`).

**Card Android:**
- Icono: `android` con gradiente verde
- Título: "En Android (Chrome)"
- Pasos numerados:
  1. Abre el link de Drivip en Chrome
  2. Toca el menú de tres puntos en la esquina superior derecha
  3. Selecciona "Agregar a pantalla de inicio" o "Instalar app"
  4. Confirma. El ícono de Drivip aparecerá en tu pantalla

**Card iPhone:**
- Icono: `phone_iphone` con gradiente azul
- Título: "En iPhone (Safari)"
- Pasos numerados:
  1. Abre el link de Drivip en Safari
  2. Toca el botón de compartir (el cuadrito con la flecha hacia arriba)
  3. Selecciona "Agregar a pantalla de inicio"
  4. Toca "Agregar". El ícono quedará en tu pantalla como cualquier otra app

**Nota al pie de ambas cards:**
"Una vez instalada, la app se abre en su propia ventana, sin barra de navegador, con su propio ícono. Se ve y se siente como una app nativa."

### 2.5 Formulario de Registro

**Campos del formulario:**

| # | Campo | Tipo | Requerido | Notas |
|---|---|---|---|---|
| 1 | Nombre | text | Sí | |
| 2 | Apellido | text | Sí | **NUEVO** (antes era "nombre completo") |
| 3 | Email | email | Sí | |
| 4 | Teléfono | tel | Sí | Placeholder: "+58 412 1234567" |
| 5 | Ciudad | select | Sí | Caracas, Maracaibo, Valencia, Barquisimeto, Maracay, Mérida |
| 6 | Contraseña | password | Sí | Mínimo 6 caracteres |
| 7 | Código de referido | text | No | **NUEVO** — "¿Te refirió un conductor? Ingresa su código aquí" |

**Flujo post-registro:**

```
1. signUp() con email + password → Supabase Auth
2. INSERT en profiles:
   - id: auth.user.id
   - nombre: valor del campo
   - apellido: valor del campo
   - telefono: valor del campo
   - rol: "cliente"
   - activo: true
3. Redirigir al panel del cliente (PassengerApp)
```

**El cliente queda logueado y puede:**
- Ver conductores cercanos
- Solicitar servicio
- Guardar conductores favoritos
- Ver historial

### 2.6 Login (sin cambios significativos)

Mantiene: email + contraseña. Si ya tiene cuenta, va directo al panel.

---

## FASE 3: Landing Conductor (`apps/conductor/src/App.tsx`)

**Objetivo:** Beneficios + cómo instalar + planes + registro + pago + redirect a panel en espera.

### 3.1 Navbar (actualizar)

| Elemento | Texto |
|---|---|
| Links | Inicio, Beneficios, Cómo Instalar, Planes, Iniciar Sesión, Registrarse |
| Botón | "Soy Cliente" → `/cliente` |

### 3.2 Hero (reescibir)

| Elemento | Texto |
|---|---|
| H1 | "Tu propia app para fidelizar a tus clientes" |
| P | "Tú decides tus tarifas, tu disponibilidad y cómo cobrar. Pagas solo una mensualidad fija, desde $10 al mes." |
| CTA primario | "Quiero mi app" |
| CTA secundario | "Iniciar Sesión" |

### 3.3 Beneficios (nueva sección)

Grid de 6 cards flotantes.

| # | Icono | Título | Descripción |
|---|---|---|---|
| 1 | `phone_iphone` | Tu app personal | Recibes tu enlace y tu QR. Tus clientes te piden directo, sin buscarte en mil chats. |
| 2 | `tune` | Tú pones las tarifas | Por kilómetro, por zona, por hora, a crédito o por reserva. Tú pones las reglas. |
| 3 | `account_balance_wallet` | Cobra directo | Efectivo, Pago Móvil, Zelle, lo que tú decidas. Drivip nunca toca tu dinero. |
| 4 | `qr_code_2` | Tu QR y enlace | Comparte tu QR con tus clientes fijos. Se instalan tu app en el teléfono. |
| 5 | `savings` | Sin comisiones | Pagas solo tu mensualidad. Sin comisiones por viaje, sin retenciones. |
| 6 | `install_mobile` | Sin tienda de apps | Es una PWA. Se instala desde el navegador, ocupa muy poco espacio. |

### 3.4 Cómo Instalar (nueva sección)

Mismas instrucciones PWA que la app cliente (2 cards: Android + iPhone). Mismo contenido, misma estructura.

### 3.5 Planes (reescritos)

**Solo 2 planes:**

#### Plan Estándar — $10/mes
- App personal con QR y enlace
- Control de disponibilidad (activo/inactivo)
- Métodos de pago configurables (Efectivo, Pago Móvil, Zelle)
- Historial de servicios
- Soporte por email

#### Plan Profesional — $20/mes (Más Popular)
- Todo del Estándar
- Tarifas avanzadas (por KM, por zona fija, por hora)
- Reservas de clientes agendadas
- Badge verificado
- Soporte prioritario por WhatsApp

**Nota debajo del grid:**
"Sin comisiones por viaje. Sin retenciones. Pagas tu mensualidad y listo."

### 3.6 Formulario de Registro

**Campos del formulario:**

| # | Campo | Tipo | Requerido | Notas |
|---|---|---|---|---|
| 1 | Nombre | text | Sí | |
| 2 | Apellido | text | Sí | **NUEVO** |
| 3 | Cédula | text | Sí | **NUEVO** — Placeholder: "V-12345678" |
| 4 | Email | email | Sí | |
| 5 | Teléfono | tel | Sí | Placeholder: "+58 412 1234567" |
| 6 | Ciudad | select | Sí | Caracas, Maracaibo, Valencia, Barquisimeto, Maracay, Mérida |
| 7 | Foto principal | file | Sí | **NUEVO** — "Puede ser una foto tuya o de tu vehículo" (accept: image/*) |
| 8 | Marca del vehículo | text | Sí | Toyota, Hyundai, Honda, etc. |
| 9 | Placa | text | Sí | Uppercase automático |
| 10 | Tipo de vehículo | botones | Sí | Carro / Moto / Camioneta |
| 11 | Plan | radio | Sí | **NUEVO** — Estándar ($10) / Profesional ($20) |
| 12 | Contraseña | password | Sí | Mínimo 6 caracteres |

**Flujo post-registro:**

```
1. signUp() con email + password → Supabase Auth
2. Subir foto a Supabase Storage → obtener URL
3. INSERT en profiles:
   - id: auth.user.id
   - nombre: valor del campo
   - apellido: valor del campo
   - telefono: valor del campo
   - rol: "conductor"
   - avatar_url: URL de la foto subida
   - activo: true
4. INSERT en tenants:
   - id: nuevo UUID
   - slug: nombre-formateado (ej: "josetaxi")
   - type: "conductor"
   - nombre: nombre + apellido
   - email: valor del campo
   - telefono: valor del campo
   - ciudad: valor del campo
   - cedula: valor del campo
   - vehiculo_tipo: "carro" | "moto" | "camioneta"
   - vehiculo_placa: valor del campo
   - vehiculo_modelo: valor del campo (marca)
   - logo_url: URL de la foto subida
   - plan: "estandar" | "profesional"
   - suscripcion_activa: false ← IMPORTANTE
   - color_primario: "#7C3AED" (default purple)
   - color_secundario: "#4F46E5" (default indigo)
5. Generar QR con el slug del tenant
6. Generar enlace personalizado: {slug}.drivip.app
7. Redirigir a pantalla "Esperando Validación"
```

### 3.7 Pantalla: Esperando Validación

**Esta pantalla se muestra DESPUÉS del registro, antes de entrar al panel.**

```
┌─────────────────────────────────────────┐
│                                         │
│        ⏳ Tu cuenta está pendiente      │
│           de validación                 │
│                                         │
│  Hemos recibido tu registro. Para       │
│  activar tu cuenta, realiza el pago     │
│  de tu plan y envíanos el comprobante   │
│  por WhatsApp.                          │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  DATOS DEL PAGO MÓVIL          │    │
│  │                                 │    │
│  │  Banco: 0102 (Banco de Venezuela)│   │
│  │  Teléfono: 0414-3420573        │    │
│  │  Cédula: V-15.190.703          │    │
│  │  Monto: $XX (según tu plan)    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [ Enviar comprobante por WhatsApp ]    │
│                                         │
│  Tu enlace personal:                    │
│  {slug}.drivip.app                      │
│                                         │
│  Tu código QR:                          │
│  [QR IMAGE]                             │
│                                         │
│  Te contactaremos en menos de 24 horas. │
│                                         │
│  [ Ir al panel de todos modos ]         │
│                                         │
└─────────────────────────────────────────┘
```

**Funcionalidades de esta pantalla:**

1. **Datos de Pago Móvil visibles:**
   - Banco: 0102 (Banco de Venezuela)
   - Teléfono: 0414-3420573
   - Cédula: V-15.190.703
   - Monto: Según el plan elegido ($10 o $20)

2. **Botón "Enviar comprobante por WhatsApp":**
   - Abre `https://wa.me/584124058904`
   - Mensaje prellenado:
     ```
     Hola, soy [nombre] [apellido]. Acabo de registrarme en Drivip como conductor con la cédula [cedula]. Quiero activar mi plan [Estándar/Profesional]. Adjunto el comprobante de Pago Móvil.
     ```

3. **QR y enlace personal:**
   - Se muestran aunque la cuenta no esté validada
   - El conductor puede compartir su QR desde ya

4. **Botón "Ir al panel de todos modos":**
   - Permite acceder al panel en modo limitado
   - El conductor puede ver su perfil, QR, configuración
   - NO puede recibir solicitudes de servicio hasta que se valide el pago

### 3.8 Panel del Conductor (estado "Espera por validación")

**Cuando `suscripcion_activa === false`:**

El conductor entra al panel pero con限制aciones:

| Funcionalidad | Estado |
|---|---|
| Ver perfil | ✅ Disponible |
| Ver QR y enlace | ✅ Disponible |
| Configurar precios | ✅ Disponible |
| Ver plan actual | ✅ Disponible (muestra "Pendiente") |
| Recibir solicitudes | ❌ Deshabilitado |
| Aceptar carreras | ❌ Deshabilitado |
| Ver historial | ⚠️ Solo las que ya tenía |

**Banner en el dashboard:**
```
⚠️ Tu cuenta está pendiente de validación. Realiza el pago de tu plan para comenzar a recibir solicitudes.
```

**Una vez que el admin valide el pago:**
- `suscripcion_activa` se pone en `true`
- Se crea registro en tabla `suscripciones` con `estado: "verificado"`
- El conductor puede recibir y aceptar solicitudes
- El banner desaparece

---

## FASE 4: Cambios en Base de Datos

### 4.1 Nueva migración SQL

**Archivo:** `database/migrations/2026-09-18_registro_fields.sql`

```sql
-- Migracion: Campos de registro y Storage
-- Fecha: 2026-09-18
-- Descripcion: Agrega campos apellido, cedula para formularios de registro

-- 1. Campo apellido en profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS apellido TEXT;

-- 2. Campo cedula en tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cedula TEXT;
```

### 4.2 Supabase Storage (para fotos de conductor)

**Configuración manual en Supabase Dashboard:**

1. Ir a Storage → New Bucket
2. Nombre: `driver-photos`
3. Público: Sí (para que las fotos sean visibles)
4. File size limit: 5MB
5. Allowed MIME types: `image/jpeg, image/png, image/webp`

**RLS Policies:**
```sql
-- Permitir upload a usuarios autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'driver-photos');

-- Permitir lectura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'driver-photos');
```

### 4.3 Función para generar slug (opcional)

```sql
-- Función para generar slug único desde el nombre
CREATE OR REPLACE FUNCTION generate_slug(nombre TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(
    regexp_replace(nombre, '[^a-zA-Z0-9\s]', '', 'g'),
    '\s+', '-', 'g'
  ));
END;
$$ LANGUAGE plpgsql;
```

---

## FASE 5: Actualización de Types

### 5.1 `packages/types/src/profile.ts`

```typescript
// Agregar campo
apellido: string | null;
```

### 5.2 `packages/types/src/tenant.ts`

```typescript
// Agregar campo
cedula: string | null;
```

---

## FASE 6: Lógica de Admin (Validación de Pago)

**Esta fase es para el panel de admin (`drivip-admin`).**

### 6.1 Vista de Conductores Pendientes

El admin ve una lista de conductores con `suscripcion_activa: false`:

| Conductor | Cédula | Plan | Teléfono | Fecha Registro | Acción |
|---|---|---|---|---|---|
| José García | V-15.190.703 | Profesional $20 | 0412-1234567 | 18/09/2026 | Validar |

### 6.2 Flujo de Validación

1. Admin hace click en "Validar"
2. Ve los datos del conductor y el plan seleccionado
3. Verifica el comprobante de pago (por WhatsApp o manualmente)
4. Hace click en "Confirmar Pago"
5. Se ejecuta:
   ```sql
   UPDATE tenants
   SET suscripcion_activa = true
   WHERE id = 'tenant-id';

   INSERT INTO suscripciones (tenant_id, monto, moneda, metodo_pago, estado, fecha_inicio, fecha_fin)
   VALUES ('tenant-id', 20, 'USD', 'pago_movil', 'verificado', NOW(), NOW() + INTERVAL '1 month');
   ```
6. El conductor recibe notificación de confirmación
7. El banner de "espera" desaparece del panel del conductor

### 6.3 Rechazo de Pago

Si el admin detecta un problema:
1. Hace click en "Rechazar"
2. Ingresa un motivo
3. Se ejecuta:
   ```sql
   UPDATE tenants
   SET suscripcion_activa = false,
       pausado = true,
       pausado_motivo = 'Pago no validado: [motivo]'
   WHERE id = 'tenant-id';
   ```
4. El conductor recibe notificación de rechazo con el motivo

---

## Resumen de Archivos a Modificar

| # | Archivo | Tipo de Cambio | Líneas Aprox |
|---|---|---|---|
| 1 | `apps/home/src/App.tsx` | Reescritura completa | ~100 (de 263) |
| 2 | `apps/cliente/src/App.tsx` | Agregar secciones + actualizar registro | +200 aprox |
| 3 | `apps/conductor/src/App.tsx` | Agregar secciones + actualizar registro + pantalla espera | +300 aprox |
| 4 | `packages/types/src/profile.ts` | Agregar campo `apellido` | +1 línea |
| 5 | `packages/types/src/tenant.ts` | Agregar campo `cedula` | +1 línea |
| 6 | `database/migrations/2026-09-18_registro_fields.sql` | Nuevo archivo | ~10 líneas |

---

## Orden de Ejecución

| Paso | Archivo | Dependencias |
|---|---|---|
| 1 | Migración SQL | Ninguna |
| 2 | Types (profile.ts, tenant.ts) | Ninguna |
| 3 | Home (`apps/home/src/App.tsx`) | Ninguna |
| 4 | Landing Cliente (`apps/cliente/src/App.tsx`) | Steps 1-2 |
| 5 | Landing Conductor (`apps/conductor/src/App.tsx`) | Steps 1-2 |
| 6 | Configurar Supabase Storage | Step 1 |

---

## Datos de Contacto

| Dato | Valor |
|---|---|
| Pago Móvil - Banco | 0102 (Banco de Venezuela) |
| Pago Móvil - Teléfono | 0414-3420573 |
| Pago Móvil - Cédula | V-15.190.703 |
| WhatsApp Validación | +58 412 405 8904 |

---

## Riesgo de Romper Diseño

| Sección | Riesgo | Mitigación |
|---|---|---|
| Home | **Bajo** | Solo se eliminan secciones, se mantiene navbar/footer |
| Landing Cliente | **Bajo** | Se agregan secciones con mismo patrón de cards flotantes |
| Landing Conductor | **Bajo** | Mismo patrón. Se reemplazan planes (3→2) pero mismo estilo |
| Upload foto | **Medio** | Requiere Supabase Storage. Si no está listo, usar campo URL temporal |
| Pantalla espera | **Bajo** | Componente nuevo, no afecta existentes |
| Base de datos | **Bajo** | Solo ADD COLUMN, no modifica datos existentes |
