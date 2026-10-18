# DRIVIP.APP — Panel del Chofer (Driver Dashboard)

## Documentación Completa de Funcionalidades

---

## 1. CONCEPTO DEL NEGOCIO

### 1.1 ¿Qué es el Panel del Chofer?

Cada chofer registrado en Drivip es un **operador de transporte independiente** que alquila la plataforma SaaS. Cuando un chofer paga su suscripción mensual ($10/mes plan base), recibe acceso a su **propia plataforma de transporte** con dominio personalizado:

```
drivip.app/{slug-del-chofer}
Ejemplo: drivip.app/juan-rides
```

El chofer **no es un empleado de Drivip**. Es un cliente que usa la tecnología para:
- Gestionar sus propios clientes/pasajeros
- Crear su red de aliados (otros choferes)
- Definir sus propios precios y tarifas
- Cobrar directamente a sus clientes
- Recibir carreras a través del mapa

### 1.2 Modelo de Revenue

| Concepto | Monto | Descripción |
|---|---|---|
| Plan Base | $35/mes | Acceso al panel + GPS + mapas + clientes |
| Plugin DISPATCH | +$45/mes | Central de despacho automático |
| Plugin REFERRALS | +$25/mes | Red de aliados + pasaje P2P + descuentos |
| Plugin DELIVERY | +$35/mes | Conexión con comercios para entregas |
| Plugin CUSTOM_DOMAIN | +$60/mes | Dominio propio (ej: taxijuan.com) |
| Descuento por referido | -$5/mes | Por cada chofer referido activo |

### 1.3 Canales de Comunicación

El sistema utiliza exclusivamente:

| Canal | Uso | Implementación |
|---|---|---|
| **Mapa** | Navegación, ubicación, tracking, despacho | Leaflet + OpenStreetMap |
| **Push Notifications** | Alertas de carreras, pagos, aliados | WebPush VAPID (FCM/Safari) |
| **WhatsApp** | Comunicación chofer-cliente, chofer-aliado | Links `wa.me/` directos |

**NO se usa:**
- Zelle (eliminado como método predeterminado)
- Llamadas telefónicas directas desde la app
- SMS
- Email como canal primario

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Multi-Tenancy

```
┌──────────────────────────────────────────────┐
│              SUPERADMIN (drivip.app)          │
│  Gestiona tenants, plugins, billing, infra   │
└──────────────────┬───────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
┌────────┐    ┌────────┐    ┌────────┐
│ Juan   │    │ Pedro  │    │ Carmen │
│ /juan  │    │ /pedro │    │ /carmen│
├────────┤    ├────────┤    ├────────┤
│ Clientes│   │ Clientes│   │ Clientes│
│ Aliados │   │ Aliados │   │ Aliados │
│ Precios │   │ Precios │   │ Precios │
│ Pagos   │   │ Pagos   │   │ Pagos   │
│ Carreras│   │ Carreras│   │ Carreras│
└────────┘    └────────┘    └────────┘
```

Cada chofer tiene:
- **Datos aislados**: Sus clientes, aliados, precios, pagos no se mezclan con otros
- **Configuración independiente**: Decide qué plugins activar
- **Dominio propio**: `drivip.app/{su-slug}`
- **Autonomía total**: Gestiona todo desde su panel

### 2.2 Flujo de Registro

```
1. Chofer visita drivip.app/registro
2. Completa: Nombre, Cédula, Email, Teléfono, Ciudad
3. Selecciona: Tipo de vehículo (auto/moto), Datos del vehículo
4. Elige plan: Básico ($35) / Con DISPATCH ($80) / Full ($105)
5. Realiza pago (Pago Móvil / Transferencia)
6. SuperAdmin verifica y activa la cuenta
7. Chofer recibe Push Notificación: "Tu cuenta está activa"
8. Redirige a: drivip.app/{su-slug}/panel
```

---

## 3. MÓDULOS DEL PANEL

### 3.1 MAPA (Módulo Central)

**Todos los módulos se conectan al mapa.** El mapa es el eje central de la experiencia.

#### 3.1.1 Mapa Principal

| Elemento | Descripción |
|---|---|
| **Ubicación actual** | Marcador con avatar del chofer, rotación según heading GPS |
| **Zona de cobertura** | Círculo de radio configurable (1-10km) alrededor del chofer |
| **Aliados cercanos** | Marcadores de aliados online dentro de la zona |
| **Solicitudes pendientes** | Marcadores de carreras pendientes de aceptar |
| **Dirección actual** | Texto legible: "Av. Libertador, Caracas" (reverse geocoding Nominatim) |

#### 3.1.2 Funciones del Mapa

| Función | Acción |
|---|---|
| **Centrar en mí** | Recentrar mapa en posición GPS actual |
| **Zoom +/-** | Acercar/alejar mapa |
| **Satélite/Vista** | Cambiar entre vista de mapa y vista aérea |
| **Mostrar aliados** | Toggle para mostrar/ocultar marcadores de aliados |
| **Zona de cobertura** | Toggle para mostrar/ocultar círculo de radio |
| **Navegar** | Abrir Google Maps/Waze con destino seleccionado |

#### 3.1.3 Tracking GPS

- **Frecuencia**: Actualización cada 5 segundos cuando está ONLINE
- **Precisión**: Uso de `enableHighAccuracy: true`
- **Batería**: Cuando el chofer está OFFLINE, se desactiva el tracking
- **Background**: El navegador mantiene la ubicación incluso con la pestaña en segundo plano

---

### 3.2 DASHBOARD PRINCIPAL

**Vista:** Resumen de la operación del día

| Sección | Datos | Formato |
|---|---|---|
| **Saludo** | "Buenos días, {nombre}" | Según hora del día |
| **Estado** | ONLINE / OFFLINE | Toggle grande con glow |
| **Ganancias Hoy** | $2,450 Bs | Con delta vs ayer (+15%) |
| **Carreras Hoy** | 12 completadas | Barra de progreso hacia meta |
| **Calificación** | 4.8 ★ | Tendencia (↑↓) |
| **Tiempo Activo** | 6.5 hrs | Desde que se puso online |
| **Carreras Pendientes** | 2 solicitudes | Badge pulsante |

**Acciones rápidas:**
- Toggle ONLINE/OFFLINE (el botón más grande del dashboard)
- "Ver mapa completo"
- "Última carrera: Completada hace 12 min"

**Notificaciones Push:**
- Nueva solicitud de carrera → Push + sonido
- Pago recibido → Push
- Aliado aceptó pasaje → Push
- Recordatorio de pago mensual → Push + WhatsApp

---

### 3.3 MIS CLIENTES

**Vista:** Agenda de pasajeros del chofer

#### 3.3.1 Lista de Clientes

| Columna | Descripción |
|---|---|
| **Avatar** | Iniciales del cliente |
| **Nombre** | Nombre completo |
| **Teléfono** | Para contacto vía WhatsApp |
| **Dirección habitual** | Desde dónde suele solicitar |
| **Carreras totales** | Número de viajes completados |
| **Última carrera** | Fecha del último servicio |
| **Calificación** | ★ que el chofer le dio al cliente |
| **Acciones** | Ver historial, contactar, editar |

#### 3.3.2 Agregar Cliente

| Campo | Tipo | Requerido |
|---|---|---|
| Nombre | Texto | Sí |
| Teléfono | Teléfono (+58) | Sí |
| Dirección habitual | Texto + Mapa | No |
| Notas | Textarea | No |
| Calificación inicial | Estrellas 1-5 | No |

#### 3.3.3 Ficha del Cliente

- **Perfil completo**: Datos, historial, calificación
- **Historial de carreras**: Lista de todos los viajes con este cliente
- **Total facturado**: Suma de todas las carreras con este cliente
- **Contactar**: Botón WhatsApp directo
- **Editar**: Modificar datos del cliente
- **Eliminar**: Dar de baja (con confirmación)

#### 3.3.4 Búsqueda y Filtros

- **Búsqueda**: Por nombre, teléfono
- **Filtros**: Todos / Frecuentes (top 5) / Sin calificar / Con deuda
- **Ordenar**: Por nombre / por carreras / por última visita

---

### 3.4 MIS ALIADOS (Plugin REFERRALS)

**Vista:** Red de choferes aliados del chofer

#### 3.4.1 Lista de Aliados

| Columna | Descripción |
|---|---|
| **Avatar** | Iniciales del aliado |
| **Nombre** | Nombre del chofer aliado |
| **Calificación** | ★ del aliado |
| **Vehículo** | Modelo y año |
| **Distancia** | Km de distancia actual |
| **Comisión** | % acordado para pasajes |
| **Estado** | ONLINE / OFFLINE / OCUPADO |
| **Carreras pasadas** | Total de pasajes este mes |
| **Ganancia generada** | $ que me ha dado por pasajes |

#### 3.4.2 Agregar Aliado

**Flujo:**
1. Buscar por nombre, código de referido, o teléfono
2. Ver perfil del aliado potencial
3. Proponer comisión (%): Slider 5%-30% o input manual
4. Enviar solicitud de alianza
5. El aliado recibe Push Notificación
6. Si acepta → Aliado agregado a mi red

**Datos del aliado potencial:**
- Nombre, calificación, vehículo, distancia
- Ratings de otros choferes que lo conocen
- Disponibilidad actual

#### 3.4.3 Pasaje de Carreras (Flujo Completo)

**Cuando el chofer está OCUPADO y recibe una nueva solicitud:**

```
PASO 1: Notificación de nueva carrera
┌──────────────────────────────────────────┐
│  🚕 NUEVA SOLICITUD                      │
│  Pasajero: María González                 │
│  Desde: Av. Libertador, Caracas           │
│  Hasta: CC Plaza Mayor                    │
│  Tarifa estimada: $350 Bs                 │
│                                           │
│  ⚠️ Estás ocupado en otra carrera         │
│                                           │
│  [ Rechazar ]    [ Pasar a Aliado ]       │
└──────────────────────────────────────────┘

PASO 2: Seleccionar aliado y comisión
┌──────────────────────────────────────────┐
│  PASAR CARRERA A ALIADO                   │
│                                           │
│  Aliados disponibles (3):                 │
│  ┌────────────────────────────────────┐  │
│  │ ★ Pedro R. — 2.3 km — Toyota 2020 │  │
│  │ Comisión: 10% → Tú: $35 Bs        │  │
│  │                         [ Seleccionar ]│
│  ├────────────────────────────────────┤  │
│  │ ★ Luis M. — 3.1 km — Hyundai 2019 │  │
│  │ Comisión: 10% → Tú: $35 Bs        │  │
│  │                         [ Seleccionar ]│
│  └────────────────────────────────────┘  │
│                                           │
│  Comisión personalizada: [___]%           │
│                                           │
│  Preview: María paga $350 Bs             │
│           Tú recibes: $35 Bs (10%)        │
│           Aliado recibe: $315 Bs          │
│                                           │
│  [ Enviar oferta ]                        │
└──────────────────────────────────────────┘

PASO 3: El aliado recibe la oferta
┌──────────────────────────────────────────┐
│  📩 OFERTA DE CARRERA DE Juan P.          │
│                                           │
│  Carrera: Av. Libertador → CC Plaza Mayor │
│  Tarifa: $350 Bs                          │
│  Tu ganancia: $315 Bs (90%)               │
│  Comisión para Juan: $35 Bs (10%)         │
│                                           │
│  [ Rechazar ]    [ Aceptar Carrera ]       │
└──────────────────────────────────────────┘

PASO 4: Confirmación
- Si acepta: La carrera se transfiere al aliado
- Ambos reciben Push Notificación
- El pasajero recibe notificación del cambio
- Se registra en el historial de pasajes
```

#### 3.4.4 Historial de Pasajes

| Columna | Descripción |
|---|---|
| Fecha | "Hoy, 2:30 PM" |
| Pasajero | Nombre del cliente |
| Destino | Dirección de llegada |
| Tarifa total | $350 Bs |
| Mi comisión | +$35 Bs (10%) |
| Aliado | Pedro Ramírez |
| Estado | ACEPTADA / RECHAZADA / CANCELADA |

**Métricas del mes:**
- Total pasajes: 12
- Ingreso por pasajes: $1,680 Bs
- Promedio por pasaje: $140 Bs
- Aliado más activo: Pedro Ramírez (8 pasajes)

---

### 3.5 MIS PRECIOS

**Vista:** Configuración de tarifas del chofer

#### 3.5.1 Tarifas por Tipo de Servicio

| Servicio | Tarifa Base | Por km | Mínimo | Descripción |
|---|---|---|---|---|
| **Taxi (Auto)** | $150 Bs | $25 Bs/km | $200 Bs | Servicio estándar en sedan |
| **Moto Express** | $100 Bs | $15 Bs/km | $120 Bs | Servicio rápido en motocicleta |
| **Premium** | $250 Bs | $35 Bs/km | $400 Bs | Auto premium, servicio VIP |
| **Aeropuerto** | $500 Bs | $30 Bs/km | $600 Bs | Traslado aeropuerto |
| **Paquete** | $80 Bs | $10 Bs/km | $100 Bs | Envío de paquetes |

#### 3.5.2 Recargos y Descuentos

| Concepto | Valor | Configuración |
|---|---|---|
| **Nocturno** | +20% | Después de las 10:00 PM |
| **Horario pico** | +15% | 7-9 AM y 5-7 PM |
| **Lluvia** | +10% | Activación manual del chofer |
| **Largo alcance** | -5% | Carreras > 15km |
| **Cliente frecuente** | -10% | Clientes con > 20 carreras |

#### 3.5.3 Zonas Especiales

| Zona | Tarifa fija | Configuración |
|---|---|---|
| **Centro Caracas** | $200 Bs | Radio 3km desde Plaza Bolívar |
| **Aeropuerto Maiquetía** | $600 Bs | Zona definida por coordenadas |
| **Zona Industrial** | $180 Bs | Catia, La Yaguara |
| **Playa/Valencia** | $250 Bs | Zona turística |

#### 3.5.4 Configuración General

- **Moneda**: Bolívares (Bs) / Dólares ($)
- **Propina sugerida**: Toggle ON/OFF + % sugerido (5%, 10%, 15%)
- **Redondeo**: Hacia arriba / Exacto
- **Currency**: Rates actualizados desde API (futuro)

---

### 3.6 MIS PAGOS

**Vista:** Gestión de cobros y finanzas

#### 3.6.1 Métodos de Pago Aceptados

| Método | Estado | Datos |
|---|---|---|
| **Efectivo** | ✅ Siempre activo | "Cobro en efectivo" |
| **Pago Móvil** | Configurable | Teléfono + Cédula + Banco |
| **Transferencia** | Configurable | Banco + Cuenta + Titular |

**NO incluido:**
- ~~Zelle~~ (eliminado como método predeterminado)
- ~~PayPal~~ (no disponible en Venezuela)
- ~~Tarjeta de crédito/débito~~ (futuro)

#### 3.6.2 Datos de Cobro (Pago Móvil)

| Campo | Ejemplo |
|---|---|
| Teléfono | 0414-555-7283 |
| Cédula | V-22194830 |
| Banco | Banco de Venezuela |
| Nombre | Alejandro Silva |

#### 3.6.3 Dashboard Financiero

| Métrica | Valor | Período |
|---|---|---|
| **Ingreso Hoy** | $2,450 Bs | Hoy |
| **Ingreso Semanal** | $16,800 Bs | Últimos 7 días |
| **Ingreso Mensual** | $68,200 Bs | Mes actual |
| **Promedio por Carrera** | $204 Bs | Mes actual |
| **Carreras Totales** | 156 | Mes actual |
| **Pendiente por Cobrar** | $350 Bs | 2 carreras |

#### 3.6.4 Historial de Cobros

| Fecha | Cliente | Método | Monto | Estado |
|---|---|---|---|---|
| Hoy, 10:30 AM | María G. | Efectivo | $350 Bs | Cobrado |
| Hoy, 11:15 AM | Pedro L. | Pago Móvil | $280 Bs | Cobrado |
| Hoy, 12:00 PM | Ana M. | Pendiente | $420 Bs | Por cobrar |

**Filtros:** Hoy / Semana / Mes / Todo / Por método de pago

#### 3.6.5 Cuota Mensual Drivip

| Concepto | Monto |
|---|---|
| Plan Base | $35.00 |
| Plugin DISPATCH | +$45.00 |
| Plugin REFERRALS | +$25.00 |
| **Subtotal** | $105.00 |
| Descuento por referidos (3 activos) | -$15.00 |
| **Total a pagar** | $90.00 |
| **Próximo vencimiento** | 15 de Noviembre |
| **Estado** | AL DÍA ✅ |

---

### 3.7 CARRERAS (Plugin DISPATCH)

**Vista:** Recepción y gestión de carreras en tiempo real

#### 3.7.1 Estados de Carrera

```
DISPONIBLE → SOLICITADA → ACEPTADA → EN CAMINO → EN CURSO → COMPLETADA
                                    ↘ RECHAZADA
                                    ↘ PASADA A ALIADO
                   ↘ CANCELADA POR CLIENTE
                              ↘ CANCELADA POR CHOFER
```

#### 3.7.2 Solicitud de Carrera Entrante

```
┌──────────────────────────────────────────┐
│  🚕 NUEVA SOLICITUD                      │
│                                           │
│  Pasajero: María González                 │
│  Rating: ★★★★★ (4.9)                     │
│                                           │
│  Desde: Av. Libertador, Edif. 23          │
│  Hasta: CC Plaza Mayor, Nivel 2           │
│                                           │
│  Distancia: 2.3 km                        │
│  Tiempo estimado: 8 min                   │
│  Tarifa: $350 Bs                          │
│                                           │
│  ┌─────────────────────────────────┐      │
│  │         [ MAPA MINI ]           │      │
│  │   Origen (verde) → Destino (rojo)│     │
│  └─────────────────────────────────┘      │
│                                           │
│  [ Rechazar ]    [ Aceptar Carrera ]      │
│                                           │
│  ⏱️ Tiempo para aceptar: 15s             │
└──────────────────────────────────────────┘
```

#### 3.7.3 Carrera Activa

**Panel de navegación:**
```
┌──────────────────────────────────────────┐
│  🚗 CARRERA EN CURSO                     │
│                                           │
│  Pasajero: María González                 │
│  Teléfono: +58 414-555-1234              │
│  [ WhatsApp ]  [ Llamar ]                │
│                                           │
│  ┌─────────────────────────────────┐      │
│  │       [ MAPA FULLSCREEN ]       │      │
│  │    Ruta trazada en violeta      │      │
│  │    Mi posición → Destino        │      │
│  └─────────────────────────────────┘      │
│                                           │
│  Destino: CC Plaza Mayor, Nivel 2         │
│  Distancia restante: 2.3 km               │
│  Tiempo estimado: 8 min                   │
│                                           │
│  Tarifa acumulada: $180 Bs                │
│                                           │
│  [ Finalizar Carrera ]                    │
└──────────────────────────────────────────┘
```

#### 3.7.4 Resumen Post-Carrera

```
┌──────────────────────────────────────────┐
│  ✅ CARRERA COMPLETADA                    │
│                                           │
│  Pasajero: María González                 │
│  Duración: 23 minutos                     │
│  Distancia: 5.2 km                        │
│                                           │
│  Tarifa: $350 Bs                          │
│  Propina: +$35 Bs (10%)                   │
│  Total: $385 Bs                           │
│                                           │
│  Método de pago: Efectivo                 │
│                                           │
│  Calificar pasajero: ★ ★ ★ ★ ★            │
│                                           │
│  [ Marcar como Cobrado ]                  │
└──────────────────────────────────────────┘
```

---

### 3.8 HISTORIAL

**Vista:** Registro completo de carreras

#### 3.8.1 Lista de Carreras

| Columna | Descripción |
|---|---|
| Fecha/Hora | "Hoy, 10:30 AM" |
| Pasajero | Nombre del cliente |
| Origen → Destino | Direcciones completas |
| Duración | "23 min" |
| Distancia | "5.2 km" |
| Tarifa | "$350 Bs" |
| Estado | COMPLETADA / CANCELADA |
| Método de pago | Efectivo / Pago Móvil |
| Calificación | ★ que le di al pasajero |

#### 3.8.2 Filtros

- **Período**: Hoy / Ayer / Esta semana / Este mes / Todo
- **Estado**: Todas / Completadas / Canceladas
- **Método de pago**: Todos / Efectivo / Pago Móvil / Transferencia
- **Búsqueda**: Por nombre de pasajero

#### 3.8.3 Estadísticas del Historial

| Métrica | Valor |
|---|---|
| Total carreras | 156 |
| Completadas | 148 |
| Canceladas | 8 |
| Ingreso total | $48,200 Bs |
| Promedio por carrera | $326 Bs |
| Calificación promedio | 4.8 ★ |
| Tiempo promedio | 18 min |

---

### 3.9 MI PERFIL

**Vista:** Datos personales y configuración de cuenta

#### 3.9.1 Datos Personales

| Campo | Valor | Editable |
|---|---|---|
| Nombre completo | Alejandro Silva | Sí |
| Cédula | V-22194830 | No (verificado) |
| Email | alejandro.silva@gmail.com | Sí |
| Teléfono | +58 414-555-7283 | Sí |
| Ciudad | Caracas | Sí |
| Dirección | Av. Libertador, Edif. 45 | Sí |

#### 3.9.2 Mi Vehículo

| Campo | Valor | Editable |
|---|---|---|
| Tipo | Auto / Moto | Sí |
| Placa | AA123BC | Sí (requiere verificación) |
| Modelo | Chevrolet Aveo | Sí |
| Año | 2018 | Sí |
| Color | Blanco | Sí |
| Foto del vehículo | [Subir foto] | Sí |

#### 3.9.3 Mi Página

| Campo | Valor |
|---|---|
| URL | drivip.app/silva-rides |
| Botón copiar | [Copiar enlace] |
| Compartir | [WhatsApp] [Compartir] |

#### 3.9.4 Foto de Perfil

- Subir foto desde galería o cámara
- Recorte automático circular
- La foto se muestra en el mapa para los pasajeros

---

### 3.10 MI PLAN

**Vista:** Estado de la suscripción y plugins

#### 3.10.1 Plan Actual

| Campo | Valor |
|---|---|
| Plan | Premium (Base + DISPATCH + REFERRALS) |
| Precio | $105.00/mes |
| Descuento referidos | -$15.00 (3 choferes referidos) |
| **Total** | **$90.00/mes** |
| Estado | AL DÍA ✅ |
| Próximo pago | 15 de Noviembre |
| Método de pago | Pago Móvil |

#### 3.10.2 Plugins Activos

| Plugin | Estado | Precio | Descripción |
|---|---|---|---|
| DISPATCH | ✅ ACTIVO | $45/mes | Despacho automático de carreras |
| REFERRALS | ✅ ACTIVO | $25/mes | Aliados + Referidos |
| DELIVERY | ❌ DESACTIVADO | $35/mes | Conexión con comercios |
| CUSTOM_DOMAIN | ❌ DESACTIVADO | $60/mes | Dominio propio |

**Acciones:**
- Activar plugin adicional
- Desactivar plugin (se pierde al final del mes)
- Cambiar plan

#### 3.10.3 Historial de Pagos

| Fecha | Concepto | Monto | Estado |
|---|---|---|---|
| 15 Oct 2025 | Mensualidad Octubre | $90.00 | PAGADO ✅ |
| 15 Sep 2025 | Mensualidad Septiembre | $90.00 | PAGADO ✅ |
| 15 Ago 2025 | Mensualidad Agosto | $95.00 | PAGADO ✅ |

---

### 3.11 REFERIDOS (Descuentos)

**Vista:** Sistema de referidos y descuentos

#### 3.11.1 Mi Código de Referido

| Campo | Valor |
|---|---|
| Código | `SILVA-2024` |
| Botón copiar | [Copiar código] |
| Compartir | [WhatsApp] [Compartir enlace] |
| Enlace directo | drivip.app/referir/SILVA-2024 |

#### 3.11.2 Mis Referidos

| Chofer | Fecha registro | Estado | Descuento generado |
|---|---|---|---|
| Pedro Ramírez | 15 Jul 2025 | ACTIVO ✅ | $5.00/mes |
| Luis Morales | 20 Ago 2025 | ACTIVO ✅ | $5.00/mes |
| Carmen Herrera | 01 Sep 2025 | ACTIVO ✅ | $5.00/mes |

#### 3.11.3 Resumen de Descuentos

| Métrica | Valor |
|---|---|
| Referidos activos | 3 |
| Descuento por referido | $5.00/mes |
| **Descuento total** | **$15.00/mes** |
| Mi mensualidad original | $105.00 |
| Mi mensualidad con descuento | $90.00 |
| Ahorro anual | $180.00 |

#### 3.11.4 Lógica de Descuentos

- Cada chofer referido que se suscriba = **$5 de descuento** mensual
- El descuento se aplica automáticamente en la factura
- Si el referido cancela su suscripción, el descuento se pierde el próximo mes
- Máximo descuento: $105 (mensualidad gratis con 21 referidos)
- No hay límite de referidos

---

### 3.12 CONFIGURACIÓN

**Vista:** Settings generales del chofer

#### 3.12.1 Notificaciones

| Tipo | Push | WhatsApp | Estado |
|---|---|---|---|
| Nueva carrera | ✅ | ❌ | ON |
| Pago recibido | ✅ | ❌ | ON |
| Aliado aceptó pasaje | ✅ | ❌ | ON |
| Recordatorio pago mensual | ✅ | ✅ | ON |
| Promociones Drivip | ✅ | ❌ | OFF |
| Actualizaciones sistema | ✅ | ❌ | ON |

#### 3.12.2 Privacidad

| Opción | Estado | Descripción |
|---|---|---|
| Mostrar en mapa | ON | Otros choferes me ven online |
| Mostrar teléfono | OFF | Solo ven nombre, no teléfono |
| Mostrar calificación | ON | Pasajeros ven mis estrellas |
| Compartir ubicación aliados | ON | Aliados me ven en su mapa |

#### 3.12.3 Mapa

| Opción | Valor |
|---|---|
| Radio de cobertura | 3 km (slider 1-10) |
| Modo de mapa | Calle (default) |
| Auto-centrar | ON |
| Mostrar tráfico | OFF |

#### 3.12.4 Seguridad

| Opción | Descripción |
|---|---|
| Cambiar contraseña | Formulario actual |
| PIN de seguridad | 4 dígitos para acciones sensibles |
| cerrar sesión | Cerrar en todos los dispositivos |

---

## 4. NOTIFICACIONES PUSH

### 4.1 Tipos de Notificación

| Tipo | Trigger | Acción |
|---|---|---|
| **Nueva carrera** | Cliente solicita carrera | Abrir mapa con solicitud |
| **Carrera aceptada** | Aliado aceptó pasaje | Ver detalles |
| **Pago recibido** | Cliente confirma pago | Ver en Mis Pagos |
| **Recordatorio pago** | 3 días antes del vencimiento | Pagar ahora |
| **Aliado online** | Aliado se pone disponible | Actualizar mapa |
| **Calificación recibida** | Pasajero calificó | Ver en Dashboard |
| **Promoción** | Drivip lanza offer | Ver detalles |

### 4.2 Plantillas de Mensajes

**Nueva carrera:**
```
🚕 Nueva solicitud de María G.
Desde: Av. Libertador → CC Plaza Mayor
Tarifa: $350 Bs
Toca para ver en el mapa
```

**Recordatorio de pago:**
```
⏰ Tu suscripción vence en 3 días
Monto: $90.00/mes
Método: Pago Móvil
Toca para pagar
```

**Aliado aceptó pasaje:**
```
✅ Pedro R. aceptó la carrera
Pasajero: María G.
Destino: CC Plaza Mayor
Tu comisión: $35 Bs
```

---

## 5. CONTACTO Y SOPORTE

### 5.1 Soporte Técnico

| Canal | Contacto | Horario |
|---|---|---|
| **WhatsApp** | +58 412-555-DRIVIP | Lun-Sáb 8am-6pm |
| **Email** | soporte@drivip.app | 24/7 (respuesta en 24h) |
| **Chat en app** | Botón flotante | Lun-Sáb 8am-6pm |

### 5.2 Contactar a Drivip

Desde el panel:
- Botón flotante de WhatsApp en todas las vistas
- Link directo: `https://wa.me/584125553748?text=Hola Drivip, soy {nombre} ({slug})`

---

## 6. PLAN DE IMPLEMENTACIÓN

### 6.1 Estructura de Archivos

```
src/
├── app/
│   ├── chofer/
│   │   ├── layout.tsx                    # Layout del chofer
│   │   └── page.tsx                      # Dashboard principal
│   └── page.tsx                          # Entry point selector
│
├── components/
│   ├── chofer/
│   │   ├── ChoferDashboard.tsx           # Dashboard principal
│   │   ├── MisClientes.tsx               # Agenda de clientes
│   │   ├── ClienteDetail.tsx             # Ficha de cliente
│   │   ├── MisAliados.tsx                # Red de aliados
│   │   ├── PasajeCarrera.tsx             # Flujo de pasaje P2P
│   │   ├── MisPrecios.tsx                # Configuración de tarifas
│   │   ├── MisPagos.tsx                  # Gestión de cobros
│   │   ├── CarrerasMap.tsx               # Mapa de carreras
│   │   ├── SolicitudCarrera.tsx          # Card de solicitud
│   │   ├── CarreraActiva.tsx             # Vista durante carrera
│   │   ├── HistorialCarreras.tsx         # Lista de historial
│   │   ├── MiPerfil.tsx                  # Datos personales
│   │   ├── MiPlan.tsx                    # Suscripción
│   │   ├── Referidos.tsx                 # Sistema de referidos
│   │   └── Configuracion.tsx             # Settings
│   │
│   ├── map/
│   │   ├── MapView.tsx                   # Mapa principal (dynamic import)
│   │   ├── DriverMarker.tsx              # Marker del chofer
│   │   ├── PassengerMarker.tsx           # Marker del pasajero
│   │   ├── AllyMarker.tsx                # Marker de aliados
│   │   ├── RouteLine.tsx                 # Ruta trazada
│   │   ├── CoverageZone.tsx              # Radio de cobertura
│   │   └── MapControls.tsx               # Controles del mapa
│   │
│   └── ui/                               # Reusar todos los existentes
│
├── hooks/
│   ├── useGeolocation.ts                 # GPS watchPosition
│   ├── useGeocoding.ts                   # Dirección → coordenadas
│   └── useReverseGeocoding.ts            # Coordenadas → dirección
│
├── lib/
│   ├── routingService.ts                 # OSRM routing
│   ├── geoConstants.ts                   # Centros de mapa
│   └── mapUtils.ts                       # Utilidades geográficas
│
└── mockData/
    ├── choferData.ts                     # Datos del chofer
    ├── clientesData.ts                   # Clientes mock
    ├── aliadosData.ts                    # Aliados mock
    ├── carrerasData.ts                   # Carreras mock
    └── preciosData.ts                    # Tarifas mock
```

### 6.2 Dependencias

```bash
npm install leaflet react-leaflet leaflet-defaulticon-compatibility
npm install -D @types/leaflet
```

### 6.3 Orden de Implementación

| Fase | Archivos | Descripción |
|------|----------|-------------|
| 1 | `chofer.md` | Documentación completa |
| 2 | `mockData/*.ts` | Datos mock realistas |
| 3 | `hooks/*.ts` | GPS y geocoding |
| 4 | `lib/*.ts` | Utilidades de mapa |
| 5 | `components/map/*.tsx` | Componentes de mapa |
| 6 | `app/chofer/layout.tsx` | Layout del chofer |
| 7 | `components/chofer/*.tsx` | Todos los módulos |
| 8 | `app/chofer/page.tsx` | Página principal |
| 9 | `app/page.tsx` | Entry point |
| 10 | Testing | Build y responsive |

---

## 7. FLUJO DE USUARIO COMPLETO

### 7.1 Registro

```
1. Drivip.app/registro
2. Formulario: Nombre, Cédula, Email, Teléfono, Ciudad
3. Seleccionar tipo: Auto / Moto
4. Datos del vehículo: Placa, Modelo, Año, Color
5. Elegir plan: Básico ($35) / Con DISPATCH ($80) / Full ($105)
6. Pagar: Pago Móvil / Transferencia
7. SuperAdmin verifica → Activa cuenta
8. Push: "¡Tu cuenta está activa! Bienvenido a Drivip"
9. Login → Panel del chofer
```

### 7.2 Día Normal de Operación

```
7:00 AM  → Login, ponerse ONLINE
7:05 AM  → Mapa muestra zona de cobertura
7:30 AM  → Push: "Nueva solicitud de María G."
7:31 AM  → Ver solicitud en mapa, aceptar
7:32 AM  → Navegar al pasajero (Google Maps)
7:40 AM  → Recoger pasajero, INICIAR CARRERA
7:55 AM  → Llegar a destino, FINALIZAR
7:56 AM  → Calificar pasajero, cobrar $350 Bs
8:00 AM  → Push: "Nueva solicitud de Pedro L."
           ... (repetir durante el día)
5:00 PM  → Ver resumen: 12 carreras, $2,450 Bs
5:30 PM  → Ponerse OFFLINE, cerrar journe
```

### 7.3 Flujo de Pasaje a Aliado

```
2:30 PM  → Estoy ocupado llevando a Ana M.
2:31 PM  → Push: "Nueva solicitud de Laura P."
2:32 PM  → No puedo tomarla → "Pasar a Aliado"
2:33 PM  → Ver aliados disponibles: Pedro (2km), Luis (3km)
2:34 PM  → Seleccionar Pedro, comisión 10%
2:35 PM  → Pedro recibe oferta, acepta
2:36 PM  → Confirmación: "Pedro tomará la carrera"
2:37 PM  → Mi comisión: $35 Bs registrada
```

### 7.4 Pago de Mensualidad

```
12 Nov   → Push: "Tu suscripción vence en 3 días"
12 Nov   → WhatsApp: "Hola Drivip, voy a pagar"
13 Nov   → Realizar Pago Móvil $90.00
13 Nov   → Subir comprobante en el panel
14 Nov   → SuperAdmin verifica → Confirma pago
14 Nov   → Push: "Pago confirmado. Gracias, Alejandro"
```

---

## 8. MÉTRICAS Y ANALYTICS

### 8.1 Dashboard del Chofer (KPIs diarios)

| KPI | Fórmula | Meta |
|---|---|---|
| Ganancia diaria | Suma de carreras del día | > $2,000 Bs |
| Carreras completadas | Conteo | > 10 |
| Calificación promedio | Promedio de estrellas | > 4.5 |
| Tiempo promedio por carrera | Duración promedio | < 25 min |
| Tasa de aceptación | Aceptadas / Recibidas | > 80% |
| Tasa de cancelación | Canceladas / Aceptadas | < 5% |

### 8.2 Métricas de Aliados

| KPI | Descripción |
|---|---|
| Aliados activos | Cuántos aliados están online |
| Pasajes realizados | Carreras pasadas este mes |
| Ingreso por pasajes | Comisiones cobradas |
| Aliado más activo | Quién más carreras tomó |

### 8.3 Métricas de Clientes

| KPI | Descripción |
|---|---|
| Total clientes | Agenda completa |
| Clientes activos | Con carrera en últimos 30 días |
| Cliente frecuente | Top 5 por número de carreras |
| Ingreso por cliente | Total facturado por cliente |

---

## 9. SEGURIDAD

### 9.1 Autenticación

- Login con email + contraseña
- Recordar sesión: 30 días
- Cerrar sesión remota desde el panel

### 9.2 Datos Sensibles

- Cédula/RIF: Solo visible para el SuperAdmin
- Teléfono del chofer: Configurable (público/privado)
- Datos de Pago Móvil: Cifrados en base de datos

### 9.3 Backup

- Datos respaldados diariamente
- Historial de carreras: Retención 12 meses
- Datos de clientes: Retención indefinida mientras la cuenta esté activa

---

*Documento generado: Septiembre 2025*
*Versión: 1.0.0*
*Drivip.app — Panel del Chofer*
