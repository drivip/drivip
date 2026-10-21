import { useEffect, useMemo, useState } from "react";
import type { Cliente, Cupon as CuponDb } from "@drivip/types";
import {
  enviarMensajeDirectoAConductor,
  useClientesTenant,
  useCuponesConductor,
} from "@drivip/supabase";
import { useScrollLock } from "../hooks/useScrollLock";
import { MOCK_CLIENTES_TENANT } from "../mockData/driverMockData";

type TipoCupon = "porcentaje" | "monto";
type ModoEnvio = "todos" | "seleccionados";

interface Cupon {
  id: string;
  codigo: string;
  tipo: TipoCupon;
  valor: number;
  activo: boolean;
  created_at: string;
  valido_hasta?: string | null;
  envios?: Record<string, string>;
  enviosCount?: number;
  canjeados?: number;
}

interface CouponsManagerProps {
  tenantId?: string | null;
  demo?: boolean;
  conductorNombre?: string | null;
  onNavigateMessages?: () => void;
}

function storageKey(tenantId?: string | null) {
  return `drivip:cupones:${tenantId ?? "demo"}`;
}

function leerCupones(tenantId?: string | null): Cupon[] {
  try {
    const raw = localStorage.getItem(storageKey(tenantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapearCuponDb(cupon: CuponDb): Cupon {
  return {
    id: cupon.id,
    codigo: cupon.codigo,
    tipo: cupon.tipo,
    valor: Number(cupon.valor),
    activo: cupon.activo,
    created_at: cupon.created_at,
    valido_hasta: cupon.valido_hasta,
    enviosCount: Number(cupon.envios ?? 0),
    canjeados: Number(cupon.canjeados ?? 0),
  };
}

function descripcionBeneficio(cupon: Pick<Cupon, "tipo" | "valor">) {
  return cupon.tipo === "porcentaje"
    ? `${cupon.valor}% de descuento`
    : `$${cupon.valor.toFixed(2)} de descuento`;
}

function claveCliente(cliente: Cliente) {
  return cliente.profile_id ?? cliente.id;
}

function telefonoWhatsApp(telefono?: string | null) {
  const digitos = (telefono ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  if (digitos.startsWith("58")) return digitos;
  if (digitos.startsWith("0")) return `58${digitos.slice(1)}`;
  return digitos;
}

function construirMensaje(
  plantilla: string,
  cliente: Cliente,
  cupon: Cupon
) {
  const primerNombre = cliente.nombre.trim().split(/\s+/)[0] || "cliente";
  return plantilla
    .replaceAll("{nombre}", primerNombre)
    .replaceAll("{codigo}", cupon.codigo)
    .replaceAll("{descuento}", descripcionBeneficio(cupon));
}

export default function CouponsManager({
  tenantId,
  demo = false,
  conductorNombre,
  onNavigateMessages,
}: CouponsManagerProps) {
  const [cuponesDemo, setCuponesDemo] = useState<Cupon[]>(() => leerCupones(tenantId));
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState<TipoCupon>("porcentaje");
  const [valor, setValor] = useState("10");
  const [error, setError] = useState<string | null>(null);

  const [cuponEnvio, setCuponEnvio] = useState<Cupon | null>(null);
  const [modoEnvio, setModoEnvio] = useState<ModoEnvio>("todos");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [plantilla, setPlantilla] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [resultados, setResultados] = useState<
    Record<string, { ok: boolean; detalle: string }>
  >({});
  const [copiado, setCopiado] = useState(false);

  const { clientes: clientesReales, loading: loadingClientes } =
    useClientesTenant(demo ? null : tenantId);
  const clientes = demo ? MOCK_CLIENTES_TENANT : clientesReales;

  const {
    cupones: cuponesDb,
    loading: loadingCupones,
    crearCupon: crearCuponDb,
    actualizarCupon,
    eliminarCupon,
    enviarCupon,
  } = useCuponesConductor(demo ? null : tenantId);

  const cupones = useMemo<Cupon[]>(() => {
    if (demo) return cuponesDemo;
    return cuponesDb.map(mapearCuponDb);
  }, [demo, cuponesDemo, cuponesDb]);

  useScrollLock(Boolean(cuponEnvio));

  useEffect(() => {
    setCuponesDemo(leerCupones(tenantId));
  }, [tenantId]);

  useEffect(() => {
    localStorage.setItem(storageKey(tenantId), JSON.stringify(cuponesDemo));
  }, [cuponesDemo, tenantId]);

  const activos = cupones.filter((cupon) => cupon.activo).length;
  const totalEnvios = cupones.reduce((total, cupon) => {
    if (typeof cupon.enviosCount === "number") return total + cupon.enviosCount;
    return total + Object.keys(cupon.envios ?? {}).length;
  }, 0);

  const destinatarios = useMemo(() => {
    if (modoEnvio === "todos") return clientes;
    return clientes.filter((cliente) => seleccionados.has(claveCliente(cliente)));
  }, [clientes, modoEnvio, seleccionados]);

  const agregar = async () => {
    const limpio = codigo.trim().toUpperCase().replace(/\s+/g, "");
    const numero = parseFloat(valor);

    if (!limpio) {
      setError("Escribe un código para el cupón.");
      return;
    }
    if (cupones.some((cupon) => cupon.codigo === limpio)) {
      setError("Ese código ya existe.");
      return;
    }
    if (!Number.isFinite(numero) || numero <= 0) {
      setError("El valor debe ser mayor a cero.");
      return;
    }
    if (tipo === "porcentaje" && numero > 100) {
      setError("El porcentaje no puede superar 100%.");
      return;
    }

    if (demo) {
      setCuponesDemo((prev) => [
        {
          id: crypto.randomUUID(),
          codigo: limpio,
          tipo,
          valor: numero,
          activo: true,
          created_at: new Date().toISOString(),
          envios: {},
        },
        ...prev,
      ]);
    } else {
      const resultado = await crearCuponDb({
        codigo: limpio,
        tipo,
        valor: numero,
      });
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo crear el cupón.");
        return;
      }
    }

    setCodigo("");
    setValor(tipo === "porcentaje" ? "10" : "1");
    setError(null);
  };

  const alternar = async (cupon: Cupon) => {
    if (demo) {
      setCuponesDemo((prev) =>
        prev.map((item) =>
          item.id === cupon.id ? { ...item, activo: !item.activo } : item
        )
      );
      return;
    }

    const resultado = await actualizarCupon(cupon.id, { activo: !cupon.activo });
    if (!resultado.ok) setError(resultado.error ?? "No se pudo actualizar el cupón.");
  };

  const eliminar = async (id: string) => {
    if (demo) {
      setCuponesDemo((prev) => prev.filter((cupon) => cupon.id !== id));
      return;
    }

    const resultado = await eliminarCupon(id);
    if (!resultado.ok) setError(resultado.error ?? "No se pudo eliminar el cupón.");
  };

  const abrirEnvio = (cupon: Cupon) => {
    setCuponEnvio(cupon);
    setModoEnvio("todos");
    setSeleccionados(new Set());
    setResultados({});
    setErrorEnvio(null);
    setCopiado(false);
    setPlantilla(
      `Hola {nombre}, soy ${
        conductorNombre?.trim() || "tu conductor"
      }. Tengo un cupón para ti: *{codigo}* con {descuento}. Úsalo en tu próximo servicio conmigo.`
    );
  };

  const cerrarEnvio = () => {
    setCuponEnvio(null);
    setEnviando(false);
    setResultados({});
    setErrorEnvio(null);
  };

  const alternarCliente = (clave: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(clave)) next.delete(clave);
      else next.add(clave);
      return next;
    });
  };

  const seleccionarTodos = () => {
    setSeleccionados(new Set(clientes.map(claveCliente)));
  };

  const enviarEnApp = async () => {
    if (!cuponEnvio) return;
    if (destinatarios.length === 0) {
      setErrorEnvio("Selecciona al menos un cliente para enviar el cupón.");
      return;
    }

    setEnviando(true);
    setErrorEnvio(null);
    setResultados({});

    let asignados = 0;

    if (!demo) {
      const envio = await enviarCupon(
        cuponEnvio.id,
        destinatarios.map(claveCliente)
      );
      if (!envio.ok) {
        setEnviando(false);
        setErrorEnvio(envio.error ?? "No se pudo enviar el cupón.");
        return;
      }
      asignados = envio.count ?? 0;
    }

    const nuevosResultados: Record<string, { ok: boolean; detalle: string }> = {};
    const nuevosEnvios: Record<string, string> = {};

    for (const cliente of destinatarios) {
      const clave = claveCliente(cliente);

      if (demo) {
        nuevosResultados[clave] = { ok: true, detalle: "Enviado (demo)" };
        nuevosEnvios[clave] = new Date().toISOString();
        continue;
      }

      const mensaje = construirMensaje(plantilla, cliente, cuponEnvio);
      const resultado = await enviarMensajeDirectoAConductor(clave, mensaje);

      nuevosResultados[clave] = {
        ok: resultado.ok,
        detalle: resultado.ok
          ? "Enviado al chat"
          : "Cupón disponible en su app",
      };
      if (resultado.ok) nuevosEnvios[clave] = new Date().toISOString();
    }

    const enviados = Object.keys(nuevosEnvios).length;
    if (demo && enviados > 0) {
      setCuponesDemo((prev) =>
        prev.map((cupon) =>
          cupon.id === cuponEnvio.id
            ? { ...cupon, envios: { ...(cupon.envios ?? {}), ...nuevosEnvios } }
            : cupon
        )
      );
    }

    setResultados(nuevosResultados);
    setEnviando(false);

    if (!demo && asignados === 0) {
      setErrorEnvio(
        "El cupón ya estaba asignado a esos clientes. Está disponible en su panel."
      );
    }
  };

  const copiarMensaje = async (cliente: Cliente) => {
    if (!cuponEnvio) return;
    const mensaje = construirMensaje(plantilla, cliente, cuponEnvio);
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      setErrorEnvio("No se pudo copiar el mensaje.");
    }
  };

  return (
    <div className="space-y-4 px-4 py-4 lg:px-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">Cupones y descuentos</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Crea códigos promocionales y envíalos a todos tus clientes o a uno en
            particular.
          </p>
        </div>
        <span className="rounded-full bg-purple-100 px-3 py-1.5 text-[10px] font-black text-purple-700">
          {activos} activos
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-md shadow-slate-200/40">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Cupones creados
          </p>
          <p className="mt-0.5 text-lg font-black text-slate-900">{cupones.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-md shadow-slate-200/40">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Envíos realizados
          </p>
          <p className="mt-0.5 text-lg font-black text-slate-900">{totalEnvios}</p>
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/60">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Código
          </label>
          <input
            value={codigo}
            onChange={(event) => setCodigo(event.target.value.toUpperCase())}
            placeholder="Ej: CLIENTE10"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-slate-900 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-500/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tipo
            </label>
            <div className="mt-1 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setTipo("porcentaje")}
                className={`rounded-lg py-1.5 text-[10px] font-black transition ${
                  tipo === "porcentaje"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => setTipo("monto")}
                className={`rounded-lg py-1.5 text-[10px] font-black transition ${
                  tipo === "monto"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                $
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Valor
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={valor}
              onChange={(event) => setValor(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-black text-slate-900 outline-none focus:border-purple-400"
            />
          </div>
        </div>

        {error && <p className="text-[11px] font-semibold text-rose-600">{error}</p>}

        <button
          type="button"
          onClick={() => void agregar()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-600 py-3 text-xs font-black text-white shadow-lg shadow-purple-600/25 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Crear cupón
        </button>
      </div>

      {!demo && loadingCupones && cupones.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-3xl border border-slate-100 bg-white p-6 text-xs font-semibold text-slate-400 shadow-xl shadow-slate-200/60">
          <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
          Cargando cupones...
        </div>
      ) : cupones.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
          <span className="material-symbols-outlined text-[36px] text-slate-300">
            confirmation_number
          </span>
          <p className="text-xs font-semibold text-slate-400">
            Todavía no tienes cupones creados.
          </p>
          <p className="text-[10px] text-slate-400">
            Crea uno y envíalo a tus clientes frecuentes.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {cupones.map((cupon) => {
            const envios =
              cupon.enviosCount ?? Object.keys(cupon.envios ?? {}).length;
            const canjeados = cupon.canjeados ?? 0;
            return (
              <div
                key={cupon.id}
                className="rounded-2xl border border-slate-100 bg-white p-3 shadow-md shadow-slate-200/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                    <span className="material-symbols-outlined text-[19px]">
                      confirmation_number
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black tracking-wide text-slate-900">
                      {cupon.codigo}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500">
                      {descripcionBeneficio(cupon)}
                      {envios > 0 ? ` · ${envios} enviado${envios === 1 ? "" : "s"}` : ""}
                      {canjeados > 0 ? ` · ${canjeados} canjeado${canjeados === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void alternar(cupon)}
                    className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
                      cupon.activo
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {cupon.activo ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void eliminar(cupon.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-500 active:scale-95"
                    aria-label={`Eliminar cupón ${cupon.codigo}`}
                  >
                    <span className="material-symbols-outlined text-[17px]">delete</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => abrirEnvio(cupon)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-[11px] font-black text-white active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[17px]">send</span>
                  Enviar a mis clientes
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-3">
        <span className="material-symbols-outlined mt-0.5 text-[17px] text-blue-600">
          info
        </span>
        <p className="text-[10px] leading-snug text-blue-700">
          Los cupones se guardan en este dispositivo. Puedes enviarlos por el chat
          de la app o compartirlos por WhatsApp con cada cliente.
        </p>
      </div>

      {cuponEnvio && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={cerrarEnvio}
          />

          <div className="relative flex h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-[#f1f4f8] shadow-2xl sm:h-[88dvh] sm:rounded-3xl">
            <div className="flex items-center gap-3 border-b border-slate-200/70 bg-white px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <span className="material-symbols-outlined text-[20px]">send</span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-black text-slate-900">
                  Enviar cupón {cuponEnvio.codigo}
                </h2>
                <p className="truncate text-[10px] font-semibold text-slate-500">
                  {descripcionBeneficio(cuponEnvio)}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarEnvio}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-95"
                aria-label="Cerrar envío de cupón"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  ¿A quién se lo envías?
                </p>
                <div className="mt-1 grid grid-cols-2 rounded-xl bg-slate-200/70 p-1">
                  <button
                    type="button"
                    onClick={() => setModoEnvio("todos")}
                    className={`rounded-lg py-2 text-[11px] font-black transition ${
                      modoEnvio === "todos"
                        ? "bg-white text-purple-700 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    Todos ({clientes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoEnvio("seleccionados")}
                    className={`rounded-lg py-2 text-[11px] font-black transition ${
                      modoEnvio === "seleccionados"
                        ? "bg-white text-purple-700 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    Elegir clientes
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Mensaje
                  </p>
                  <span className="text-[9px] font-semibold text-slate-400">
                    {"{nombre}"} {"{codigo}"} {"{descuento}"}
                  </span>
                </div>
                <textarea
                  value={plantilla}
                  onChange={(event) => setPlantilla(event.target.value.slice(0, 500))}
                  rows={3}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-900 outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Clientes
                  </p>
                  {modoEnvio === "seleccionados" && clientes.length > 0 && (
                    <button
                      type="button"
                      onClick={seleccionarTodos}
                      className="text-[10px] font-black text-purple-700"
                    >
                      Seleccionar todos
                    </button>
                  )}
                </div>

                {loadingClientes && (
                  <p className="py-4 text-center text-[11px] font-semibold text-slate-400">
                    Cargando clientes...
                  </p>
                )}

                {!loadingClientes && clientes.length === 0 && (
                  <div className="mt-2 flex flex-col items-center gap-1 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center">
                    <span className="material-symbols-outlined text-[30px] text-slate-300">
                      group
                    </span>
                    <p className="text-[11px] font-semibold text-slate-500">
                      Todavía no tienes clientes registrados.
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Aparecerán cuando te soliciten un servicio.
                    </p>
                  </div>
                )}

                <div className="mt-2 space-y-2">
                  {clientes.map((cliente) => {
                    const clave = claveCliente(cliente);
                    const seleccionado =
                      modoEnvio === "todos" || seleccionados.has(clave);
                    const resultado = resultados[clave];
                    const tel = telefonoWhatsApp(cliente.telefono);

                    return (
                      <div
                        key={clave}
                        className={`flex items-center gap-2 rounded-2xl border p-2.5 ${
                          seleccionado
                            ? "border-purple-200 bg-white"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (modoEnvio === "seleccionados") alternarCliente(clave);
                          }}
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${
                            seleccionado
                              ? "border-purple-600 bg-purple-600 text-white"
                              : "border-slate-300 bg-white text-transparent"
                          }`}
                          aria-label={`Seleccionar ${cliente.nombre}`}
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            check
                          </span>
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-bold text-slate-900">
                            {cliente.nombre}
                          </p>
                          <p className="truncate text-[10px] text-slate-500">
                            {cliente.telefono ?? "Sin teléfono"}
                          </p>
                          {resultado && (
                            <p
                              className={`truncate text-[9px] font-bold ${
                                resultado.ok ? "text-emerald-600" : "text-rose-500"
                              }`}
                            >
                              {resultado.detalle}
                            </p>
                          )}
                        </div>

                        {tel && (
                          <a
                            href={`https://wa.me/${tel}?text=${encodeURIComponent(
                              construirMensaje(plantilla, cliente, cuponEnvio)
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white active:scale-95"
                            aria-label={`Enviar cupón por WhatsApp a ${cliente.nombre}`}
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              chat
                            </span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => void copiarMensaje(cliente)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-95"
                          aria-label={`Copiar mensaje para ${cliente.nombre}`}
                        >
                          <span className="material-symbols-outlined text-[17px]">
                            content_copy
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {errorEnvio && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-600">
                  {errorEnvio}
                </p>
              )}

              {copiado && (
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-semibold text-emerald-600">
                  Mensaje copiado. Pégalo en el chat que prefieras.
                </p>
              )}

              <p className="text-center text-[9px] font-medium text-slate-400">
                {modoEnvio === "todos"
                  ? `Se enviará a ${clientes.length} cliente${clientes.length === 1 ? "" : "s"}.`
                  : `Se enviará a ${destinatarios.length} cliente${destinatarios.length === 1 ? "" : "s"} seleccionado${destinatarios.length === 1 ? "" : "s"}.`}
              </p>
            </div>

            <div className="space-y-2 border-t border-slate-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => void enviarEnApp()}
                disabled={enviando || destinatarios.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-600 py-3 text-xs font-black text-white shadow-lg shadow-purple-600/25 active:scale-[0.98] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {enviando ? "sync" : "send"}
                </span>
                {enviando ? "Enviando..." : "Enviar por la app"}
              </button>

              {onNavigateMessages && (
                <button
                  type="button"
                  onClick={() => {
                    cerrarEnvio();
                    onNavigateMessages();
                  }}
                  className="w-full rounded-xl py-2 text-[11px] font-bold text-purple-700"
                >
                  Ver mis conversaciones
                </button>
              )}

              {demo && (
                <p className="text-center text-[9px] font-medium text-slate-400">
                  Modo demo: el envío por la app se simula en este dispositivo.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
