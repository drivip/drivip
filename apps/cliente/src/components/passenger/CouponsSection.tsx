import { useMemo, useState } from "react";
import type { CuponCliente } from "@drivip/types";
import { useCuponesCliente } from "@drivip/supabase";
import { useScrollLock } from "../../hooks/useScrollLock";
import type { Driver } from "../../types/passenger";
import DriverRating from "./DriverRating";

interface CouponsSectionProps {
  drivers: Driver[];
  selectedDriverId: string | null;
  onSelect: (driver: Driver) => void;
}

const PALETTES = [
  "from-purple-600 to-indigo-700",
  "from-orange-500 to-rose-600",
  "from-emerald-500 to-teal-700",
  "from-blue-600 to-slate-900",
];

const ERRORES_CANJE: Record<string, string> = {
  cupon_no_disponible: "Este cupón ya no está disponible.",
  cupon_ya_usado: "Ya canjeaste este cupón.",
  cupon_vencido: "Este cupón venció.",
  cupon_inactivo: "El conductor desactivó este cupón.",
  no_autenticado: "Inicia sesión para canjear tus cupones.",
};

function beneficio(cupon: Pick<CuponCliente, "tipo" | "valor">) {
  return cupon.tipo === "porcentaje"
    ? `${cupon.valor}%`
    : `$${cupon.valor.toFixed(2)}`;
}

function descripcionBeneficio(cupon: Pick<CuponCliente, "tipo" | "valor">) {
  return cupon.tipo === "porcentaje"
    ? `${cupon.valor}% de descuento`
    : `$${cupon.valor.toFixed(2)} de descuento`;
}

function venceEl(cupon: CuponCliente) {
  if (!cupon.valido_hasta) return "Sin vencimiento";
  return `Vence ${new Date(cupon.valido_hasta).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
  })}`;
}

export default function CouponsSection({
  drivers,
  selectedDriverId,
  onSelect,
}: CouponsSectionProps) {
  const {
    disponibles,
    usados,
    loading,
    error,
    canjeando,
    canjearCupon,
  } = useCuponesCliente();

  const [cuponActivo, setCuponActivo] = useState<CuponCliente | null>(null);
  const [resultado, setResultado] = useState<{
    ok: boolean;
    mensaje: string;
    codigo?: string;
  } | null>(null);
  const [copiado, setCopiado] = useState(false);

  useScrollLock(Boolean(cuponActivo));

  const driversPorTenant = useMemo(() => {
    const map = new Map<string, Driver>();
    drivers.forEach((driver) => map.set(driver.id, driver));
    return map;
  }, [drivers]);

  const abrirCanje = (cupon: CuponCliente) => {
    setCuponActivo(cupon);
    setResultado(null);
    setCopiado(false);
  };

  const cerrarCanje = () => {
    setCuponActivo(null);
    setResultado(null);
    setCopiado(false);
  };

  const confirmarCanje = async () => {
    if (!cuponActivo) return;
    const respuesta = await canjearCupon(cuponActivo.cupon_id);

    if (respuesta.ok) {
      setResultado({
        ok: true,
        codigo: respuesta.codigo ?? cuponActivo.codigo,
        mensaje: `Canjeado con ${respuesta.conductor ?? "tu conductor"}.`,
      });
      return;
    }

    setResultado({
      ok: false,
      mensaje:
        ERRORES_CANJE[respuesta.error ?? ""] ??
        respuesta.error ??
        "No se pudo canjear el cupón.",
    });
  };

  const copiarCodigo = async () => {
    if (!resultado?.codigo) return;
    try {
      await navigator.clipboard.writeText(resultado.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <section data-purpose="coupons-section">
      <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-500">
            Beneficios de tu red
          </p>
          <h2
            className="mt-0.5 text-lg font-black tracking-tight text-slate-900"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Mis cupones
          </h2>
        </div>
        <span className="shrink-0 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-700">
          {disponibles.length === 1 ? "1 disponible" : `${disponibles.length} disponibles`}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-[24px] border border-white/80 bg-white px-5 py-7 text-[11px] font-bold text-slate-400">
          <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
          Cargando cupones...
        </div>
      ) : disponibles.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-5 py-7 text-center">
          <span className="material-symbols-outlined text-[30px] text-slate-300">
            confirmation_number
          </span>
          <p className="mt-2 text-xs font-bold text-slate-600">
            {error ? "No pudimos cargar tus cupones" : "Aún no tienes cupones"}
          </p>
          <p className="mt-1 text-[10px] font-medium text-slate-400">
            {error
              ? "Revisa tu conexión e intenta de nuevo."
              : "Cuando tu conductor te envíe una promoción aparecerá aquí."}
          </p>
        </div>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:scroll-pl-0 sm:px-0">
          {disponibles.map((cupon, index) => {
            const driver = driversPorTenant.get(cupon.conductor_tenant_id);
            const palette = PALETTES[index % PALETTES.length];
            const seleccionado = selectedDriverId === cupon.conductor_tenant_id;

            return (
              <div
                key={cupon.envio_id}
                className={`relative w-[272px] max-w-[82vw] shrink-0 snap-start overflow-hidden rounded-[24px] border p-4 text-left transition duration-200 ${
                  seleccionado
                    ? "border-purple-300 bg-purple-50/80 shadow-[0_18px_34px_-18px_rgba(126,34,206,0.55)] ring-2 ring-purple-500/30"
                    : "border-white/80 bg-white shadow-[0_16px_34px_-22px_rgba(30,41,59,0.45)]"
                }`}
              >
                <span className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${palette}`} />
                <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#f1f4f8]" />
                <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#f1f4f8]" />

                <div className="flex items-start justify-between gap-3 pl-2">
                  <div className="min-w-0">
                    <span className="block truncate text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Cupón de {cupon.conductor_nombre.split(" ")[0]}
                    </span>
                    <p
                      className={`mt-1 bg-gradient-to-r ${palette} bg-clip-text text-[27px] font-black leading-none text-transparent`}
                    >
                      {beneficio(cupon)}
                    </p>
                    <p className="mt-1 text-[11px] font-bold leading-tight text-slate-700">
                      {descripcionBeneficio(cupon)}
                    </p>
                  </div>
                  {driver?.image ? (
                    <img
                      alt={driver.name}
                      src={driver.image}
                      className="h-10 w-10 rounded-xl border-2 border-white object-cover shadow-sm"
                    />
                  ) : (
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-sm ${
                        driver?.color ?? "bg-gradient-to-br from-purple-500 to-indigo-600"
                      }`}
                    >
                      {driver?.initials ??
                        cupon.conductor_nombre.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-1.5 pl-2">
                  {driver ? (
                    <DriverRating rating={driver.rating} reviews={driver.reviews} size="xs" />
                  ) : (
                    <span className="truncate text-[10px] font-semibold text-slate-500">
                      {cupon.conductor_nombre}
                    </span>
                  )}
                  <span className="text-slate-300">·</span>
                  <span className="truncate text-[10px] font-semibold text-slate-500">
                    {venceEl(cupon)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-slate-200 pt-2.5 pl-2">
                  <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10px] font-black tracking-wider text-slate-600">
                    {cupon.codigo}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (driver) onSelect(driver);
                    }}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black active:scale-95 ${
                      seleccionado
                        ? "bg-purple-100 text-purple-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {seleccionado ? "Elegido" : "Elegir"}
                    <span className="material-symbols-outlined text-[13px]">
                      {seleccionado ? "check_circle" : "arrow_forward"}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => abrirCanje(cupon)}
                  className={`mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r ${palette} py-2.5 text-[11px] font-black text-white shadow-md active:scale-[0.98]`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    confirmation_number
                  </span>
                  Canjear cupón
                </button>
              </div>
            );
          })}
        </div>
      )}

      {usados.length > 0 && (
        <div className="mt-3 rounded-[20px] border border-slate-200 bg-white/70 p-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Canjes anteriores
          </p>
          <div className="space-y-1.5">
            {usados.slice(0, 4).map((cupon) => (
              <div
                key={cupon.envio_id}
                className="flex items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-2"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
                  <span className="material-symbols-outlined text-[15px]">
                    check
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-bold text-slate-700">
                    {cupon.codigo} · {descripcionBeneficio(cupon)}
                  </p>
                  <p className="truncate text-[9px] font-semibold text-slate-400">
                    {cupon.conductor_nombre}
                    {cupon.usado_at
                      ? ` · ${new Date(cupon.usado_at).toLocaleDateString("es-VE")}`
                      : ""}
                  </p>
                </div>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[8px] font-black uppercase text-slate-500">
                  {cupon.estado === "vencido" ? "Vencido" : "Usado"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cuponActivo && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={cerrarCanje}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <span className="material-symbols-outlined text-[20px]">
                    confirmation_number
                  </span>
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Canjear cupón</h3>
                  <p className="text-[10px] font-semibold text-slate-500">
                    {cuponActivo.conductor_nombre}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={cerrarCanje}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-95"
                aria-label="Cerrar canje"
              >
                <span className="material-symbols-outlined text-[19px]">close</span>
              </button>
            </div>

            <div className="p-4">
              {resultado?.ok ? (
                <div className="text-center">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <span className="material-symbols-outlined text-[34px]">
                      check_circle
                    </span>
                  </span>
                  <h4 className="mt-3 text-base font-black text-slate-900">
                    ¡Cupón canjeado!
                  </h4>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    {resultado.mensaje}
                  </p>

                  <button
                    type="button"
                    onClick={() => void copiarCodigo()}
                    className="mx-auto mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-purple-300 bg-purple-50 px-5 py-3 active:scale-[0.98]"
                  >
                    <span className="font-mono text-lg font-black tracking-widest text-purple-700">
                      {resultado.codigo}
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-purple-600">
                      {copiado ? "check" : "content_copy"}
                    </span>
                  </button>
                  <p className="mt-2 text-[10px] font-medium text-slate-400">
                    {copiado
                      ? "Código copiado"
                      : "Muéstrale este código a tu conductor al pagar."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-700 p-4 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-200">
                      {cuponActivo.conductor_nombre}
                    </p>
                    <p className="mt-1 text-3xl font-black leading-none">
                      {beneficio(cuponActivo)}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-purple-100">
                      {descripcionBeneficio(cuponActivo)}
                    </p>
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-white/10 px-3 py-2">
                      <span className="font-mono text-[12px] font-black tracking-widest">
                        {cuponActivo.codigo}
                      </span>
                      <span className="text-[9px] font-bold text-purple-100">
                        {venceEl(cuponActivo)}
                      </span>
                    </div>
                  </div>

                  {resultado && !resultado.ok && (
                    <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-600">
                      {resultado.mensaje}
                    </p>
                  )}

                  <p className="mt-3 text-center text-[10px] leading-snug text-slate-400">
                    Al canjearlo, el cupón quedará marcado como usado y podrás
                    mostrarle el código a tu conductor.
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2 border-t border-slate-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              {resultado?.ok ? (
                <button
                  type="button"
                  onClick={cerrarCanje}
                  className="w-full rounded-2xl bg-slate-900 py-3 text-xs font-black text-white active:scale-[0.98]"
                >
                  Listo
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => void confirmarCanje()}
                    disabled={canjeando === cuponActivo.cupon_id}
                    className="w-full rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-600 py-3 text-xs font-black text-white shadow-lg shadow-purple-600/25 active:scale-[0.98] disabled:opacity-50"
                  >
                    {canjeando === cuponActivo.cupon_id
                      ? "Canjeando..."
                      : "Confirmar canje"}
                  </button>
                  <button
                    type="button"
                    onClick={cerrarCanje}
                    className="w-full rounded-xl py-2 text-[11px] font-bold text-slate-500"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
