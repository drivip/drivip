# Drivip — Sistema de Movilidad Individual Multi-Tenant

## Propósito

Drivip es una plataforma SaaS multi-tenant que digitaliza la operación de moto taxis, taxis y líneas de taxis en Venezuela. A diferencia de modelos colectivos como Uber o Didi, Drivip opera bajo un modelo de suscripción individual: cada conductor o línea de taxis paga un plan mensual para tener su propia PWA personalizada, su panel de control y su red de clientes.

## ¿Qué problema resuelve?

1. **Falta de presencia digital:** El conductor de moto taxi o taxi no tiene una herramienta propia para recibir carreras, gestionar clientes y cobrar de forma organizada.
2. **Competencia desleal de plataformas colectivas:** Los modelos colectivos cobran comisiones altas y no permiten al conductor tener control sobre su marca, sus tarifas ni sus clientes.
3. **Gestión manual y desorganizada:** Las líneas de taxis manejan su flota con cuadernos, llamadas y mensajes de WhatsApp. Drivip les da un panel profesional para gestionar afiliados, cobrar porcentajes y ver reportes.
4. **Sin herramientas de pago adaptadas a Venezuela:** Sin Stripe ni APIs bancarias masivas, Drivip implementa un flujo de pago manual (captura de pantalla + confirmación) con camino a automatización vía Wayu Pay.

## ¿Para quién es?

| Segmento | Necesidad |
|----------|-----------|
| **Moto taxistas individuales** | Tener su propia PWA, recibir carreras, cobrar, gestionar clientes |
| **Taxistas individuales** | Digitalizar su operación sin comisiones de terceros |
| **Líneas de taxis** | Gestionar flota, afiliados, porcentajes y reportes consolidados |
| **Clientes finales** | Pedir carrera desde la PWA del conductor, pagar en efectivo o Pago Móvil, calificar |

## Propuesta de valor

- **Individual, no colectivo:** El conductor es dueño de su marca y sus clientes.
- **Suscripción simple:** Plan básico de $10/mes con panel completo.
- **PWA instalable:** El cliente agrega el icono del conductor a su móvil.
- **QR personal:** Cada conductor comparte su subdominio (`josetaxi.drivip.app`) y su QR.
- **Mapas estilo Uber/Didi:** Seguimiento en tiempo real con MapLibre GL JS + GraphHopper.
- **Plugins Premium:** Zonas de cobro y aliados B2B.
- **Panel Maestro CRM/ERP:** Control total del SaaS desde un solo lugar.

 PWA del Conductor (individual y personalizada)

    Vive en josetaxi.drivip.app

    Es solo para el conductor y su línea

    Es su panel de control, su marca, sus tarifas, su historial

    El cliente no instala esto nunca

2. PWA del Cliente (unificada, una sola)

    Vive en app.drivip.app (o drivip.app/cliente)

    Es una sola app para todos los clientes

    Dentro tiene una sección llamada "Mis Conductores" (o "Mi Círculo", "Mi Red")

    El cliente agrega conductores escaneando su QR o abriendo su link

    Cada conductor agregado aparece como una tarjeta dentro de la app, no como un icono aparte

    El cliente pide carrera seleccionando a quién de su red quiere llamar

Cómo funciona el flujo completo
text

1. José Taxi se suscribe a Drivip ($10)
   → Obtiene su subdominio: josetaxi.drivip.app
   → Obtiene su QR personal

2. José comparte su QR con sus clientes
   → El QR NO apunta a josetaxi.drivip.app
   → El QR apunta a: app.drivip.app/add/josetaxi

3. El cliente escanea el QR
   → Se abre Drivip (app unificada)
   → Si no la tiene: botón "Agregar a pantalla de inicio" (UNA sola vez)
   → José queda agregado automáticamente a "Mis Conductores"
   → El cliente ve: "José Taxi agregado ✓"

4. El cliente abre Drivip cuando quiere una carrera
   → Ve sus conductores disponibles (José, Pedro, Línea A, etc.)
   → Elige a quién pedir (o pide al primero disponible de su red)
   → Solo ESE conductor recibe la notificación

5. José recibe la carrera en SU panel (josetaxi.drivip.app)
   → La gestiona, la completa, cobra
   → Su marca sigue siendo José Taxi en todo momento

   La diferenciación real vs Uber/Ridery
Uber / Ridery	Drivip
Conductor aleatorio	Conductor de confianza que TÚ elegiste
Comisión por viaje (20-30%)	Suscripción fija ($10/mes), 0% comisión
Marca única (Uber)	Marca del conductor visible
No puedes "seguir" a un conductor	Puedes tener tu círculo de conductores favoritos
La plataforma es dueña de los clientes	El conductor es dueño de sus clientes
Cliente no elige	Cliente elige a quién llamar
Líneas de taxis

Una línea SÍ puede tener su propia PWA de cliente si quiere (plugin premium). Porque es una empresa con muchos conductores y su marca es fuerte. Pero la PWA general de Drivip también puede mostrar la línea completa como "opción" dentro de "Mis Conductores".
Cliente sin app instalada

Si alguien recibe el QR y no quiere instalar nada, puede usar la versión web (app.drivip.app/add/josetaxi) directamente desde el navegador. Pide su carrera sin instalar. La PWA es una mejora, no un requisito.
Conductor sin clientes propios

Si un conductor nuevo no tiene clientes, puede aparecer en una sección de "Descubrir conductores cercanos" dentro de la app unificada. Eso sí, como opt-in, no como Uber. La idea es que sea un directorio, no una asignación automática.