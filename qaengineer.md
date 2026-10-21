
---

## 📄 8. `qaengineer.md`

```markdown
# QA Engineer — Drivip

## Estrategia de pruebas

Drivip es un SaaS multi-tenant con datos sensibles. El QA debe probar no solo que las funcionalidades funcionen, sino que **el aislamiento entre tenants sea absoluto** y que **el sistema resista condiciones adversas**.

## Checklist de pruebas

### 1. Pruebas de aislamiento multi-tenant

| # | Prueba | Resultado esperado |
|---|--------|-------------------|
| 1.1 | Crear dos tenants (A y B) con datos similares | Ambos se crean correctamente |
| 1.2 | Autenticarse como Tenant A y consultar carreras | Solo ve carreras de A |
| 1.3 | Intentar acceder a carrera de B por ID | Error 403 / No autorizado |
| 1.4 | Autenticarse como Tenant B y ver clientes | Solo ve clientes de B |
| 1.5 | Intentar modificar tenant_id de una carrera vía API | RLS bloquea el cambio |
| 1.6 | Consultar `ubicaciones` como Tenant A | Solo ve ubicaciones de sus conductores |
| 1.7 | Acceder a comprobante de pago de otro tenant | Storage bloquea el acceso |

### 2. Pruebas de autenticación y autorización

| # | Prueba | Resultado esperado |
|---|--------|-------------------|
| 2.1 | Registro de conductor | Crea usuario, perfil y tenant |
| 2.2 | Login con credenciales válidas | JWT con tenant_id y rol |
| 2.3 | Login con credenciales inválidas | Error 401 |
| 2.4 | Token expirado | Redirige a login |
| 2.5 | Rol `cliente` intenta acceder a panel maestro | Error 403 |
| 2.6 | Rol `conductor` intenta ver carreras de línea | No permitido |
| 2.7 | Refresh token | Genera nuevo JWT válido |

### 3. Pruebas de suscripción

| # | Prueba | Resultado esperado |
|---|--------|-------------------|
| 3.1 | Suscripción vencida | Panel bloqueado, mensaje de renovación |
| 3.2 | Pago manual: subir captura | Comprobante almacenado, maestro notificado |
| 3.3 | Maestro verifica pago | Suscripción activada, `fecha_vencimiento` actualizada |
| 3.4 | Maestro rechaza pago | Notificación al conductor, panel sigue bloqueado |
| 3.5 | Wayu Pay: pago completado | Webhook recibido, suscripción activada automáticamente |

### 4. Pruebas de carreras (flujo completo)

| # | Prueba | Resultado esperado |
|---|--------|-------------------|
| 4.1 | Cliente solicita carrera | Crea registro `pendiente`, notifica conductor |
| 4.2 | Conductor acepta | Estado `aceptada`, cliente notificado |
| 4.3 | Conductor inicia viaje | Estado `en_curso`, mapa en vivo |
| 4.4 | Conductor completa | Estado `completada`, cliente puede calificar |
| 4.5 | Cliente califica | Calificación guardada, conductor ve promedio |
| 4.6 | Cliente cancela antes de aceptar | Estado `cancelada` |
| 4.7 | Conductor rechaza | Vuelve a `pendiente` o se asigna a otro |

### 5. Pruebas de mapas y tiempo real

| # | Prueba | Resultado esperado |
|---|--------|-------------------|
| 5.1 | MapLibre carga en móvil | Mapa visible en < 3s |
| 5.2 | GraphHopper calcula ruta | Polyline dibujada correctamente |
| 5.3 | Ubicación del conductor se actualiza | Marcador se mueve en tiempo real |
| 5.4 | Cliente ve conductor en mapa | Posición actualizada cada 3-5s |
| 5.5 | Ruta recorrida se dibuja | Polyline gris acumulativa |
| 5.6 | Sin conexión | Mapa usa tiles en caché, muestra mensaje offline |

### 6. Pruebas de PWA

| # | Prueba | Resultado esperado |
|---|--------|-------------------|
| 6.1 | Instalar PWA en Android | Icono en pantalla de inicio |
| 6.2 | Instalar PWA en iOS | Funciona con "Agregar a inicio" |
| 6.3 | Abrir sin conexión | Muestra caché, funcionalidad básica |
| 6.4 | Notificación push | Llega con app cerrada |
| 6.5 | Click en notificación | Abre la ruta correcta |
| 6.6 | Actualización de service worker | Nueva versión se instala sin errores |

### 7. Pruebas de plugins premium

| # | Prueba | Resultado esperado |
|---|--------|-------------------|


### 8. Pruebas de seguridad

| # | Prueba | Resultado esperado |
|---|--------|-------------------|
| 8.1 | Inyección SQL en formulario | Zod + Supabase bloquea |
| 8.2 | XSS en nombre de cliente | Escapado correctamente |
| 8.3 | Rate limiting | 60 requests/min por IP, luego 429 |
| 8.4 | Subir archivo malicioso | ClamAV lo detecta y rechaza |
| 8.5 | Acceder a Edge Function sin autorización | Error 401 |
| 8.6 | CSP bloquea script externo | Consola muestra violación de CSP |

### 9. Pruebas de rendimiento

| # | Prueba | Resultado esperado |
|---|--------|-------------------|
| 9.1 | 100 carreras simultáneas | Sin degradación, < 2s por consulta |
| 9.2 | 50 conductores enviando ubicación | Realtime sin lag > 5s |
| 9.3 | Carga del panel maestro con 1000 tenants | < 3s, paginación funcional |
| 9.4 | Mapa con 200 marcadores | 60 FPS, sin bloqueo |
| 9.5 | Lighthouse PWA | Score > 90 en Performance |

### 10. Pruebas de recuperación

| # | Prueba | Resultado esperado |
|---|--------|-------------------|
| 10.1 | Fallo de Supabase | Worker muestra error amigable |
| 10.2 | Fallo de GraphHopper | Mapa muestra ruta en línea recta |
| 10.3 | Pérdida de conexión | Datos en caché, re-sync al volver |
| 10.4 | Respaldo y restauración | Datos íntegros tras restore |

## Herramientas recomendadas

| Herramienta | Uso |
|-------------|-----|
| **Playwright** | Pruebas E2E automatizadas |
| **Vitest** | Pruebas unitarias de componentes y funciones |
| **k6** | Pruebas de carga y estrés |
| **Lighthouse CI** | Auditoría de PWA y rendimiento |
| **OWASP ZAP** | Escaneo de vulnerabilidades |
| **Postman** | Pruebas de API y webhooks |

## Ejemplo de prueba E2E con Playwright

```typescript
// tests/e2e/carrera.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Flujo completo de carrera', () => {
  test('Cliente solicita y conductor completa carrera', async ({ browser }) => {
    // Contexto del conductor
    const conductorContext = await browser.newContext();
    const conductorPage = await conductorContext.newPage();
    await conductorPage.goto('https://josetaxi.drivip.app');
    // Login como conductor
    await conductorPage.fill('[name="email"]', 'conductor@test.com');
    await conductorPage.fill('[name="password"]', 'password123');
    await conductorPage.click('button[type="submit"]');
    // Esperar a que esté disponible
    await expect(conductorPage.locator('[data-testid="disponible"]')).toBeVisible();

    // Contexto del cliente
    const clienteContext = await browser.newContext();
    const clientePage = await clienteContext.newPage();
    await clientePage.goto('https://josetaxi.drivip.app/cliente');
    // Solicitar carrera
    await clientePage.click('[data-testid="solicitar-carrera"]');
    await clientePage.click('[data-testid="seleccionar-origen"]');
    await clientePage.click('[data-testid="mapa"]');
    await clientePage.click('[data-testid="confirmar-carrera"]');

    // Conductor recibe notificación
    await expect(conductorPage.locator('[data-testid="nueva-carrera"]')).toBeVisible();
    await conductorPage.click('[data-testid="aceptar-carrera"]');

    // Cliente ve que el conductor aceptó
    await expect(clientePage.locator('[data-testid="conductor-acepto"]')).toBeVisible();
  });
});