# Flujos del Sistema — Drivip

Este documento describe **todos los flujos lógicos** de cada panel, desde el registro hasta el ciclo completo de una carrera, incluyendo los plugins premium.

---

## 🌐 FLUJO 1: Registro y suscripción de un conductor
[Conductor entra a drivip.app]
↓
[Click en "Afiliarme"]
↓
[Formulario de registro]

    Nombre / Marca (ej. "José Taxi")

    Slug deseado (ej. "josetaxi") → validar disponibilidad

    Tipo: conductor | linea

    Email

    Teléfono

    Contraseña
    ↓
    [Supabase Auth crea usuario]
    ↓
    [Se crea registro en tenants (suscripcion_activa=FALSE)]
    [Se crea registro en profiles (rol=conductor o linea)]
    ↓
    [Redirige a /pago]
    ↓
    [Selecciona método: Pago Móvil / Transferencia / Efectivo]
    ↓
    [Se muestra:

    Datos bancarios de Drivip

    Monto: $10

    Referencia a usar

    Botón "Enviar comprobante por WhatsApp"]
    ↓
    [El conductor envía captura por WhatsApp al maestro]
    ↓
    [Maestro entra al Panel Maestro]
    [Va a módulo "Suscripciones Pendientes"]
    [Ve el comprobante, verifica en su banco]
    ↓
    [Aprueba pago → suscripcion_activa=TRUE]
    [fecha_vencimiento = NOW() + 30 días]
    ↓
    [Notificación push al conductor: "¡Bienvenido a Drivip!"]
    ↓
    [Conductor accede a josetaxi.drivip.app]
    [Panel listo para configurar]

text


---

## 🎛 FLUJO 2: Panel Maestro (CRM/ERP del SaaS)

### 2.1 Estructura modular

Panel Maestro
├── 📊 Dashboard
│ ├── KPIs (tenants, MRR, carreras activas)
│ ├── Alertas (vencimientos, pagos pendientes)
│ └── Estado del sistema
├── 👥 Tenants
│ ├── Lista (conductores + líneas)
│ ├── Detalle por tenant
│ ├── Activar/Desactivar suscripción
│ └── Ver historial de carreras
├── 💰 Suscripciones
│ ├── Pendientes de verificar
│ ├── Historial de pagos
│ ├── Renovaciones próximas
│ └── Rechazos
├── 🔌 Plugins
│ ├── Catálogo de plugins
│ ├── Activar por tenant
│ ├── Configurar parámetros
│ └── Ver uso
├── 📢 Promociones
│ ├── Crear banner promocional
│ ├── Seleccionar destinatarios
│ └── Envío masivo (banners + push)
├── 🛠 Mantenimiento
│ ├── Respaldos manuales
│ ├── Restaurar respaldo
│ ├── Reparar datos huérfanos
│ └── Reindexar
├── 📊 Reportes
│ ├── Ingresos por período
│ ├── Carreras por tenant
│ ├── Crecimiento de usuarios
│ └── Exportar CSV/PDF
├── 📢 Comunicación
│ ├── Enviar push a conductores
│ ├── Enviar push a líneas
│ └── Enviar push a clientes (global)
└── 🆘 Soporte
├── Tickets abiertos
├── Chat con tenants
└── Base de conocimiento
text


### 2.2 Flujo de gestión de suscripciones

[Maestro entra a /panel-maestro]
↓
[Ve dashboard con alertas]
⚠️ 5 suscripciones vencen hoy
⚠️ 3 pagos pendientes de verificar
↓
[Click en "Suscripciones Pendientes"]
↓
[Lista de pagos con comprobante]

    José Taxi — $10 — Hace 2h

    Pedro Moto — $10 — Hace 5h
    ↓
    [Click en uno → Ver comprobante + datos]
    ↓
    [Verificar en banco]
    ↓
    ├── Aprobado → Activar suscripción (+30 días)
    │ ↓
    │ Notificación push al conductor
    │ ↓
    │ Se habilita panel
    │
    └── Rechazado → Motivo (opcional)
    ↓
    Notificación push al conductor
    ↓
    Panel sigue bloqueado

text


### 2.3 Flujo de activación de plugin

[Maestro entra a "Plugins"]
↓
[Selecciona plugin: "Zonas"]
↓
[Elige tenant: "José Taxi"]
↓
[Configura parámetros:

    Precio base por zona: $1.50

    Recargo por km: $0.50

    Zona máxima: 5km]
    ↓
    [Guardar → INSERT en plugins_activos]
    ↓
    [Notificación push a José: "Plugin Zonas activado"]
    ↓
    [Aparece en menú de José con icono naranja]

text


### 2.4 Flujo de envío de promociones

[Maestro va a "Promociones"]
↓
[Crea banner:

    Título: "¡Gana $5 por referir un conductor!"

    Texto: "Comparte tu QR y gana"

    Imagen (opcional)

    URL destino

    Fechas vigencia]
    ↓
    [Selecciona destinatarios:
    ☑ Todos los conductores
    ☐ Solo líneas
    ☐ Solo un tenant específico]
    ↓
    [Publicar → INSERT en tabla banners]
    ↓
    [Realtime envía banner a todos los paneles activos]
    ↓
    [Aparece en la parte superior del panel del conductor]

text


---

## 🚕 FLUJO 3: Panel del Conductor

### 3.1 Primer acceso (onboarding)

[Conductor recibe notificación: "Suscripción activada"]
↓
[Entra a josetaxi.drivip.app]
↓
[Onboarding wizard:
Paso 1: Subir foto de perfil
Paso 2: Configurar tarifas

    Tarifa base: $X

    Precio por km: $Y

    Precio por minuto: $Z
    Paso 3: Métodos de pago aceptados
    ☑ Efectivo
    ☑ Pago Móvil → ingresar datos bancarios
    ☑ Transferencia → ingresar datos bancarios
    Paso 4: Descargar QR para imprimir]
    ↓
    [Click en "Empezar a recibir carreras"]
    ↓
    [Activa "Disponible" → status=online]
    ↓
    [Empieza a enviar ubicación cada 10s a Supabase]

text


### 3.2 Ciclo completo de una carrera

[Conductor está DISPONIBLE]
↓
[Cliente de su red pide carrera]
↓
[Notificación push + banner en panel:
"🚗 Nueva carrera de María
Origen: Av. Principal
Destino: Centro Comercial
$2.50 — Efectivo"
[Aceptar] [Rechazar]]
↓
├── Rechaza → Cliente notificado "Conductor ocupado"
│
└── Acepta
↓
[Estado carrera: aceptada]
[Notificación push a cliente: "José aceptó"]
↓
[Se abre mapa con ruta GraphHopper hacia el cliente]
[Marcador del cliente visible]
↓
[Conductor llega al punto de origen]
[Click en "Llegué"]
↓
[Cliente notificado: "José llegó"]
↓
[Cliente sube al vehículo]
[Conductor click en "Iniciar viaje"]
↓
[Estado carrera: en_curso]
[Mapa muestra ruta hacia destino]
[Cliente ve el recorrido en vivo desde su app]
↓
[Conductor llega al destino]
[Click en "Completar viaje"]
↓
[Estado carrera: completada]
↓
[Se muestra resumen:

    Distancia real

    Duración real

    Precio final]
    ↓
    [Si el método es efectivo:
    → Conductor confirma "Recibí efectivo"]
    [Si es Pago Móvil:
    → Cliente sube captura
    → Conductor verifica y aprueba]
    ↓
    [Cliente califica al conductor (1-5 ⭐)]
    ↓
    [Conductor ve notificación: "María te calificó 5⭐"]
    ↓
    [Ingreso sumado al dashboard del día]
    ↓
    [Conductor vuelve a estado DISPONIBLE]

text


### 3.3 Compartir QR y crecer red de clientes

[Conductor va a "Compartir mi QR"]
↓
[Ve QR + link: app.drivip.app/add/josetaxi]
↓
[Opciones:

    Copiar link

    Compartir por WhatsApp (Web Share API)

    Descargar QR (PNG)

    Imprimir para pegar en vehículo (PDF)]
    ↓
    [Comparte link con cliente]
    ↓
    [Cliente escanea → abre app.drivip.app/add/josetaxi]
    ↓
    [Cliente agrega a José a su círculo]
    ↓
    [Notificación a José: "María te agregó a su círculo"]
    ↓
    [José ve +1 cliente en "Mi red"]

text


### 3.4 Gestión de tarifas

[Conductor va a "Tarifas"]
↓
[Ve formulario:

    Tarifa base: $____

    Precio por km: $____

    Precio por minuto: $____

    Recargo nocturno (opcional): +X%

    Recargo por zona (si tiene plugin): configurar

    Descuento a clientes frecuentes (opcional)]
    ↓
    [Guardar → UPDATE en tabla config_tarifas]
    ↓
    [Se aplica a las nuevas carreras inmediatamente]

text


---

## 🏢 FLUJO 4: Panel de Línea de Taxis

### 4.1 Estructura

Panel de Línea
├── 📊 Dashboard
│ ├── Conductores activos
│ ├── Carreras del día
│ ├── Ingresos brutos
│ └── Mi comisión
├── 👥 Mi Flota
│ ├── Lista de conductores afiliados
│ ├── Agregar conductor
│ ├── Generar link de afiliación
│ ├── Activar/Desactivar conductor
│ └── Ver estadísticas por conductor
├── 🚗 Carreras
│ ├── Carreras activas en la línea
│ ├── Asignar carrera a conductor
│ └── Historial
├── 💰 Comisiones
│ ├── Configurar % por carrera
│ ├── Cuadratura diaria
│ ├── Cuadratura semanal
│ └── Historial de cobros
├── 📊 Reportes
│ ├── Ranking de conductores
│ ├── Zonas más solicitadas
│ └── Horas pico
└── 📢 Comunicación
├── Enviar mensaje a toda la flota
└── Chat con conductor específico
text


### 4.2 Flujo de agregar conductor a la línea

[Dueño de línea va a "Mi Flota"]
↓
[Click en "Agregar conductor"]
↓
[Formulario:

    Nombre

    Teléfono

    Tipo de vehículo

    % comisión (o usa el global)]
    ↓
    [Guardar → genera link único:
    lineacentral.drivip.app/afiliar/[token]]
    ↓
    [Envía link por WhatsApp al conductor]
    ↓
    [Conductor abre link → ve info de la línea]
    [Se registra (o inicia sesión si ya tiene cuenta)]
    ↓
    [Se crea relación linea_conductores]
    ↓
    [Conductor recibe sub-PWA personalizado dentro de la línea]
    ↓
    [Aparece en el panel de la línea como "activo"]

text


### 4.3 Flujo de cobro de comisión

[Cada carrera completada por conductor de la línea]
↓
[Se registra:

    precio_total: $5.00

    comision_linea: $0.50 (10%)

    pago_conductor: $4.50]
    ↓
    [Diariamente se genera corte automático]
    ↓
    [Línea ve en "Comisiones":
    Hoy:

    Pedro: 5 carreras, $25 bruto, $2.50 comisión

    Luis: 4 carreras, $20 bruto, $2.00 comisión
    Total comisión: $4.50]
    ↓
    [Opciones de cobro:

    Manual (conductor paga en efectivo)

    Descuento automático de saldo

    Cuadratura semanal]
    ↓
    [Al cerrar semana → se marca como "cobrado"]

text


---

## 👤 FLUJO 5: PWA del Cliente

### 5.1 Primera vez (viene de QR del conductor)

[Cliente escanea QR de José]
↓
[Abre app.drivip.app/add/josetaxi]
↓
[Carga instantánea (no requiere registro para ver)]
↓
[Ve:
┌──────────────────────┐
│ José Taxi │
│ ⭐ 4.9 • Moto │
│ [ Foto ] │
│ │
│ Apodo (opcional): │
│ [___________] │
│ │
│ [ Agregar a mi círculo ]│
└──────────────────────┘]
↓
[Click en "Agregar"]
↓
├── No tiene cuenta → formulario rápido:
│ - Nombre
│ - Teléfono
│ - Contraseña (o SMS OTP)
│ ↓
│ Se crea usuario (rol=cliente)
│ ↓
│ Se ejecuta agregar_conductor_a_red()
│ ↓
│ José queda agregado ✅
│
└── Ya tiene cuenta → login rápido
↓
José queda agregado ✅
↓
[Pantalla final:
"✅ José está en tu círculo
Descarga la app para pedir más rápido"
[ Agregar a pantalla de inicio ]]
↓
[Se registra la PWA]
↓
[Cliente ve icono Drivip en su móvil]
text


### 5.2 Pedir una carrera (cliente recurrente)

[Cliente abre app Drivip]
↓
[Ve "Mis Conductores" ordenados por:

    Favoritos

    Disponibles primero

    Más usados]
    ↓
    [Selecciona a José (🟢 disponible)]
    ↓
    [Se abre pantalla de pedir carrera]
    ↓
    [Selecciona origen (default: ubicación actual)]
    [Selecciona destino en mapa o búsqueda]
    ↓
    [GraphHopper calcula:

    Distancia: 3.2 km

    Duración: 12 min

    Precio: $2.50 (según tarifas de José)]
    ↓
    [Selecciona método de pago:

    Efectivo

    Pago Móvil (se mostrarán datos de José)

    Transferencia]
    ↓
    [Click en "Confirmar carrera"]
    ↓
    [INSERT en carreras (tenant_id=José, cliente_id=María)]
    ↓
    [Notificación push a José]
    ↓
    [Cliente ve: "Esperando confirmación de José..."]
    ↓
    ├── José acepta
    │ ↓
    │ Cliente ve mapa con ubicación de José
    │ ↓
    │ Cliente ve ETA en tiempo real
    │
    └── José rechaza (o timeout 60s)
    ↓
    Cliente ve: "José está ocupado"
    [ Buscar otro conductor de mi círculo ]

text


### 5.3 Durante la carrera

[Carrera aceptada]
↓
[Cliente ve:

    Mapa con ubicación de José en vivo

    ETA actualizado cada 5s

    Datos del conductor

    Botón "Llamar" (tel:)

    Botón "Chat" (opcional)]
    ↓
    [José llega]
    ↓
    [Cliente recibe push: "José llegó"]
    ↓
    [Sube al vehículo]
    ↓
    [José inicia viaje]
    ↓
    [Cliente ve:

    Ruta recorrida

    Ruta restante

    ETA al destino]
    ↓
    [Llegan al destino]
    ↓
    [Cliente ve:

    Precio final: $2.50

    Método de pago: Efectivo

    [ Pagar al llegar ]]
    ↓
    ├── Efectivo → entrega físicamente
    │
    └── Pago Móvil → ve datos de José:

        Banco, teléfono, cédula
        [ Copiar datos ]
        [ Subir captura de pago ]
        ↓
        José recibe notificación de comprobante
        José aprueba → cliente ve "✅ Pago confirmado"
        ↓
        [Cliente califica:
        ⭐⭐⭐⭐⭐
        Comentario (opcional)
        [ Enviar ]]
        ↓
        [Carrera finalizada]

text


### 5.4 Menú y módulos del cliente

Menú cliente:
├── 🏠 Inicio (Mis Conductores)
├── 👥 Mi Círculo (gestionar red)
│ ├── Ver todos los agregados
│ ├── Reordenar (favoritos)
│ ├── Poner apodos
│ ├── Eliminar conductor
│ └── [ ➕ Agregar otro por QR ]
├── 📜 Historial de carreras
│ ├── Filtros (fecha, conductor)
│ ├── Repetir carrera
│ └── Ver calificación
├── 💳 Métodos de pago guardados
├── 🔔 Notificaciones
└── ⚙️ Configuración
├── Datos personales
├── Ubicación default
└── Cerrar sesión
text


---

## 🔌 FLUJO 6: Sistema de Plugins (arquitectura lógica)

### 6.1 Registro de un plugin

[Desarrollador de Drivip crea módulo]
↓
[1. Frontend: componente React]
[2. Backend: tablas SQL + RLS]
[3. Registro en pluginRegistry.ts]
[4. Ruta en panel maestro para activar]
[5. Documentación en docs/plugins/]
↓
[Plugin disponible en catálogo del Panel Maestro]
text


### 6.2 Activación de un plugin a un tenant

[Maestro va a "Plugins"]
↓
[Selecciona plugin + tenant]
↓
[Verifica límites del plan del tenant]
↓
[Configura parámetros específicos]
↓
[INSERT en plugins_activos]
↓
[Se notifica al tenant]
↓
[El panel del conductor muestra el nuevo módulo]
[Si el plugin tiene coste extra → ajustar tarifa]
text


### 6.3 Desactivación

[Maestro desactiva plugin]
↓
[UPDATE plugins_activos SET activo=FALSE]
↓
[Los datos históricos se conservan pero la UI se oculta]
↓
[Notificación al tenant]
text


---

## 🔔 FLUJO 7: Notificaciones

### 7.1 Tipos de notificación

| Tipo | Destinatario | Trigger |
|------|-------------|---------|
| Nueva carrera | Conductor | Cliente solicita |
| Carrera aceptada | Cliente | Conductor acepta |
| Conductor llegó | Cliente | Conductor marca "llegué" |
| Carrera completada | Ambos | Conductor marca "completada" |
| Nueva calificación | Conductor | Cliente califica |
| Pago aprobado | Conductor | Maestro verifica |
| Suscripción vence pronto | Conductor | 3 días antes |
| Banner promocional | Conductor/Línea | Maestro envía |
| Nuevo cliente en red | Conductor | Cliente agrega a su círculo |

### 7.2 Flujo técnico de notificación

[Evento ocurre en backend]
↓
[Trigger en Postgres o Edge Function]
↓
[Se inserta en tabla notificaciones]
↓
[Supabase Realtime emite a usuarios suscritos]
↓
[Frontend recibe evento]
↓
├── Si app abierta:
│ → Banner in-app + sonido
│
└── Si app cerrada:
→ Web Push API (via Service Worker)
→ Notificación nativa del sistema
↓
[Al hacer click → abre ruta correspondiente]
text


---

## 📱 FLUJO 8: Ciclo de vida del cliente en Drivip

    DESCUBRIMIENTO
    Cliente ve QR pegado en el vehículo de José
    ↓

    PRIMER CONTACTO
    Escanea QR → app.drivip.app/add/josetaxi
    José se agrega a su círculo
    ↓

    INSTALACIÓN
    Agrega Drivip a pantalla de inicio (1 sola vez)
    ↓

    PRIMERA CARRERA
    Abre app → pide a José
    ↓

    REPETICIÓN
    Usa la app cada vez que necesita taxi
    ↓

    EXPANSIÓN DE RED
    Si otro conductor le gusta, agrega su QR
    El cliente acumula su propio círculo
    ↓

    FIDELIZACIÓN
    Ya no depende de Uber ni de llamar por teléfono
    Tiene SU red de confianza en una sola app

text


---

## 🔄 FLUJO 9: Ciclo de vida del conductor en Drivip

    AFILIACIÓN ($10/mes)
    Registro en drivip.app
    ↓

    ONBOARDING
    Configura tarifas, métodos de pago, foto
    ↓

    ACTIVACIÓN
    Descarga su QR, lo imprime, lo pega
    ↓

    CRECIMIENTO DE RED
    Cada cliente que escanea suma a su círculo
    ↓

    OPERACIÓN DIARIA
    Recibe carreras, cobra, califica
    ↓

    ESCALAMIENTO
    Activa plugins (Zonas, Aliados B2B)
    O se une/convierte en línea de taxis
    ↓

    RENOVACIÓN
    Paga $10 cada mes
    Si no paga → panel bloqueado
    ↓

    FIDELIZACIÓN
    Su base de clientes crece
    Se vuelve más rentable con el tiempo

text


---

## 🎯 FLUJO 10: Diferenciación vs Uber/Ridery

| Situación | Uber/Ridery | Drivip |
|-----------|-------------|--------|
| Cliente pide taxi | Algoritmo asigna | Cliente ELIGE de su círculo |
| Conductor nuevo sin clientes | Recibe carreras del pool | Empieza desde 0, crece con QR |
| Marca visible | Uber siempre | José Taxi siempre |
| Comisión | 20-30% por viaje | 0% (solo $10/mes fijo) |
| Cliente cambia de ciudad | Funciona igual | Solo funciona con conductores agregados |
| Conductor deja la app | Pierde todo | Se lleva su red (los clientes lo siguen) |
| Contacto con cliente | Anónimo | Directo y personal |
| Fidelidad | Baja | Alta (relación personal) |

---

## 🚨 FLUJO 11: Manejo de errores y casos límite

### Conductor offline

[Cliente pide carrera a José]
↓
[José está offline (no ha activado disponibilidad)]
↓
[App del cliente muestra:
"José no está disponible ahora
Última vez: hace 2h
[ Notificar cuando esté disponible ]
[ Pedir a otro conductor ]"]
text


### Timeout de aceptación

[Cliente pide carrera]
↓
[José no responde en 60 segundos]
↓
[Sistema marca como "timeout"]
↓
[Cliente ve:
"José no respondió
[ Reintentar ] [ Buscar otro ]"]
↓
[La carrera queda en estado "pendiente_timeout"]
[Auditable en historial]
text


### Sin conexión

[Cliente pide carrera sin internet]
↓
[PWA usa service worker]
↓
[Muestra: "Sin conexión
Guardaremos tu solicitud y la enviaremos
cuando recuperes internet"
[ Guardar solicitud ]]
↓
[Al recuperar conexión → se envía automáticamente]
text


### Suscripción vencida

[Conductor intenta entrar a su panel]
↓
[Sistema detecta fecha_vencimiento < NOW()]
↓
[Redirige a pantalla de renovación:
"Tu suscripción venció
Renueva por $10 para seguir operando
[ Métodos de pago ]
[ Contactar soporte ]"]
↓
[No puede recibir carreras hasta renovar]
[PERO sus datos se conservan 90 días]
text


### Pago rechazado

[Maestro rechaza comprobante de pago]
↓
[Notificación push al conductor]
↓
[Motivo visible en su panel:
"El pago no se reflejó en el banco
[ Subir nuevo comprobante ]
[ Contactar soporte ]"]
↓
[Conductor puede reintentar ilimitadamente]
text


---

## 📊 FLUJO 12: Métricas y analítica

### Lo que ve el conductor
- Carreras del día / semana / mes
- Ingresos brutos
- Clientes nuevos en su círculo
- Calificación promedio
- Horas más rentables

### Lo que ve la línea
- Ranking de conductores
- Zonas más solicitadas
- Comisiones acumuladas
- Ticket promedio

### Lo que ve el maestro
- MRR (Monthly Recurring Revenue)
- Tenants activos / vencidos / nuevos
- Churn rate
- Carreras por día (global)
- Uso de plugins
- Distribución geográfica (mapa de calor)

---

## 🔐 FLUJO 13: Auditoría y seguridad

Cada acción sensible se registra:

[Acción: conductor modifica tarifa]
↓
[Trigger inserta en audit_log:

    usuario_id: UUID del conductor

    tenant_id: UUID del tenant

    accion: UPDATE

    tabla: config_tarifas

    datos_anteriores: {...}

    datos_nuevos: {...}

    ip: 190.x.x.x

    timestamp: NOW()]
    ↓
    [Visible en Panel Maestro > Auditoría (solo maestro)]

text


### Eventos auditados
- Login / logout
- Cambios de tarifa
- Aprobación / rechazo de pagos
- Activación / desactivación de plugins
- Eliminación de registros
- Accesos a datos de otros tenants (bloqueados)
- Envíos masivos de notificaciones

---

## ✅ RESUMEN DE FLUJOS POR ROL

| Rol | Flujo principal | Flujo secundario |
|-----|----------------|------------------|
| **Maestro** | Gestionar tenants y suscripciones | Activar plugins, enviar promociones |
| **Conductor** | Recibir y completar carreras | Crecer red de clientes vía QR |
| **Línea** | Gestionar flota y comisiones | Reportes consolidados |
| **Cliente** | Pedir carrera a su red | Expandir su círculo de confianza |