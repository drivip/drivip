import { useEffect, useMemo, useState } from "react";
import type { Tenant } from "@drivip/types";
import { APP_URLS, guardarPagoMovilSocio, useProgramaReferidos } from "@drivip/supabase";

function usd(value: number | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function fecha(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Referidos({ tenant }: { tenant?: Tenant | null }) {
  const { programa, loading, error, available, refetch } = useProgramaReferidos(tenant?.id);
  const [copied, setCopied] = useState(false);
  const [savingPago, setSavingPago] = useState(false);
  const [pagoError, setPagoError] = useState<string | null>(null);
  const [pagoOk, setPagoOk] = useState(false);
  const [pago, setPago] = useState({ banco: "", cedula: "", telefono: "" });

  const cuenta = programa?.cuenta ?? null;
  const config = programa?.config ?? null;
  const codigo = tenant?.codigo_referido ?? "";
  const link = codigo ? `${APP_URLS.conductor}/?ref=${encodeURIComponent(codigo)}` : "";
  const meta = cuenta?.meta_referidos_gratis ?? config?.meta_referidos_gratis ?? 10;
  const activos = cuenta?.referidos_activos ?? 0;
  const progreso = Math.min(100, Math.round((activos / meta) * 100));
  const faltan = Math.max(0, meta - activos);
  const esSocio = Boolean(cuenta?.es_socio || tenant?.socio_drivip);
  const tienePagoMovil = Boolean(
    cuenta?.pago_movil_banco || tenant?.pago_movil_socio_banco
  );

  useEffect(() => {
    setPago({
      banco: cuenta?.pago_movil_banco ?? tenant?.pago_movil_socio_banco ?? "",
      cedula: cuenta?.pago_movil_cedula ?? tenant?.pago_movil_socio_cedula ?? "",
      telefono: cuenta?.pago_movil_telefono ?? tenant?.pago_movil_socio_telefono ?? "",
    });
  }, [
    cuenta?.pago_movil_banco,
    cuenta?.pago_movil_cedula,
    cuenta?.pago_movil_telefono,
    tenant?.pago_movil_socio_banco,
    tenant?.pago_movil_socio_cedula,
    tenant?.pago_movil_socio_telefono,
  ]);

  const referidosOrdenados = useMemo(() => {
    const prioridad: Record<string, number> = { activo: 0, pendiente: 1, inactivo: 2 };
    return [...(programa?.referidos ?? [])].sort(
      (a, b) => (prioridad[a.estado] ?? 9) - (prioridad[b.estado] ?? 9)
    );
  }, [programa?.referidos]);

  const copiarCodigo = async () => {
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const copiarLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const compartir = async () => {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Unete a Drivip",
          text: `Registrate como conductor con mi codigo ${codigo} y empieza a ganar con Drivip.`,
          url: link,
        });
      } catch {
        /* usuario cancelo */
      }
    } else {
      await copiarLink();
    }
  };

  const guardarPago = async () => {
    setPagoError(null);
    setPagoOk(false);
    if (!pago.banco.trim() || !pago.cedula.trim() || !pago.telefono.trim()) {
      setPagoError("Completa banco, cedula y telefono.");
      return;
    }
    setSavingPago(true);
    const { error: saveError } = await guardarPagoMovilSocio(pago);
    setSavingPago(false);
    if (saveError) {
      setPagoError(saveError);
      return;
    }
    setPagoOk(true);
    await refetch();
  };

  return (
    <div className="px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900">Programa de Referidos</h1>
          <p className="text-[11px] lg:text-xs text-slate-500 mt-1">
            Invita conductores, reduce tu mensualidad y gana como socio Drivip.
          </p>
        </div>
        {esSocio && (
          <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700 border border-amber-200">
            Socio Drivip
          </span>
        )}
      </div>

      {!available && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] font-semibold text-amber-700">
          El programa de socios esta pendiente de activacion en el servidor. Tu codigo y referidos
          actuales siguen funcionando.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[11px] font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-3xl overflow-hidden border border-slate-100 bg-gradient-to-br from-purple-700 via-indigo-700 to-purple-900 text-white shadow-xl shadow-purple-900/20">
        <div className="p-5 lg:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <span className="material-symbols-outlined text-[26px]">redeem</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                Tu ID de referido
              </p>
              <p className="font-mono text-2xl font-black tracking-[0.16em]">{codigo || "-"}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Link para compartir
            </p>
            <p className="mt-1 truncate font-mono text-[11px] text-white/90">{link || "Sin codigo"}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={copiarCodigo}
              disabled={!codigo}
              className="flex items-center justify-center gap-1 rounded-xl bg-white/15 px-2 py-2.5 text-[11px] font-bold backdrop-blur active:scale-95 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px]">{copied ? "check" : "content_copy"}</span>
              Codigo
            </button>
            <button
              type="button"
              onClick={copiarLink}
              disabled={!link}
              className="flex items-center justify-center gap-1 rounded-xl bg-white/15 px-2 py-2.5 text-[11px] font-bold backdrop-blur active:scale-95 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px]">link</span>
              Link
            </button>
            <button
              type="button"
              onClick={compartir}
              disabled={!link}
              className="flex items-center justify-center gap-1 rounded-xl bg-white px-2 py-2.5 text-[11px] font-black text-purple-800 active:scale-95 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
              Compartir
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-lg shadow-slate-200/50">
          <p className="text-[10px] font-bold uppercase text-slate-400">Activos</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{loading ? "-" : activos}</p>
          <p className="text-[10px] text-slate-500">{programa?.referidos.length ?? 0} referidos</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-lg shadow-slate-200/50">
          <p className="text-[10px] font-bold uppercase text-slate-400">Descuento</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">
            {loading ? "-" : `${cuenta?.descuento_pct ?? 0}%`}
          </p>
          <p className="text-[10px] text-slate-500">
            {cuenta?.es_gratis ? "Mensualidad gratis" : `Ahorras ${usd(cuenta?.monto_descuento)}`}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-lg shadow-slate-200/50">
          <p className="text-[10px] font-bold uppercase text-slate-400">Por cobrar</p>
          <p className="mt-1 text-2xl font-black text-amber-600">
            {loading ? "-" : usd(cuenta?.comisiones_pendientes)}
          </p>
          <p className="text-[10px] text-slate-500">Pagado {usd(cuenta?.comisiones_pagadas)}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-4 lg:p-5 shadow-xl shadow-slate-200/60 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm lg:text-base font-black text-slate-900">
              {esSocio ? "Mensualidad gratis" : "Camino a tu mensualidad gratis"}
            </h2>
            <p className="text-[11px] text-slate-500">
              {esSocio
                ? "Eres socio: ganas 5% de cada referido activo, todos los meses."
                : `Te faltan ${faltan} referido${faltan === 1 ? "" : "s"} activo${faltan === 1 ? "" : "s"} para ser socio.`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-purple-700">{activos}/{meta}</p>
            <p className="text-[10px] font-bold uppercase text-slate-400">activos</p>
          </div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${esSocio ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-purple-500 to-indigo-600"}`}
            style={{ width: `${progreso}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-xl bg-emerald-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-emerald-600">Tu cuenta del mes</p>
            <p className="text-sm font-black text-emerald-700">
              {cuenta?.es_gratis ? "GRATIS" : usd(cuenta?.total_mensual)}
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-amber-600">Comision socio</p>
            <p className="text-sm font-black text-amber-700">
              {cuenta?.comision_socio_pct ?? 5}% por referido
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-4 lg:p-5 shadow-xl shadow-slate-200/60 space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-purple-600">info</span>
          <h2 className="text-sm lg:text-base font-black text-slate-900">Como funciona</h2>
        </div>
        {[
          {
            icon: "percent",
            title: `${config?.descuento_por_referido_pct ?? 10}% de descuento por referido activo`,
            desc: "El descuento se aplica a tu mensualidad mientras tu referido mantenga su suscripcion activa.",
          },
          {
            icon: "card_giftcard",
            title: `Al llegar a ${meta} referidos activos, tu mensualidad es gratis`,
            desc: "En ese momento te conviertes en socio Drivip y te pediremos tu Pago Movil.",
          },
          {
            icon: "handshake",
            title: `${config?.comision_socio_pct ?? 5}% de cada referido activo para socios`,
            desc: "Mientras tus referidos sigan activos, generas esa comision cada mes. Drivip te la paga por Pago Movil.",
          },
        ].map((item) => (
          <div key={item.title} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
            <span className="material-symbols-outlined text-[20px] text-indigo-600">{item.icon}</span>
            <div>
              <p className="text-[12px] font-bold text-slate-900">{item.title}</p>
              <p className="text-[11px] leading-relaxed text-slate-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {esSocio && (
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 lg:p-5 shadow-xl shadow-amber-200/40 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
              <span className="material-symbols-outlined text-[24px]">celebration</span>
            </div>
            <div>
              <h2 className="text-sm lg:text-base font-black text-amber-900">
                Felicitaciones, socio Drivip
              </h2>
              <p className="text-[11px] leading-relaxed text-amber-700">
                {tienePagoMovil
                  ? "Tus datos de Pago Movil estan registrados. Drivip te abonara las comisiones acumuladas."
                  : "Registra tu numero de Pago Movil para que Drivip pueda abonarte lo que has generado."}
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <input
              value={pago.banco}
              onChange={(event) => setPago((prev) => ({ ...prev, banco: event.target.value }))}
              placeholder="Banco (ej. Banesco)"
              className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-900 outline-none focus:border-amber-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={pago.cedula}
                onChange={(event) => setPago((prev) => ({ ...prev, cedula: event.target.value }))}
                placeholder="Cedula"
                className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-900 outline-none focus:border-amber-400"
              />
              <input
                value={pago.telefono}
                onChange={(event) => setPago((prev) => ({ ...prev, telefono: event.target.value }))}
                placeholder="Telefono Pago Movil"
                className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-900 outline-none focus:border-amber-400"
              />
            </div>
            {pagoError && <p className="text-[11px] font-semibold text-rose-600">{pagoError}</p>}
            {pagoOk && (
              <p className="text-[11px] font-semibold text-emerald-700">
                Pago Movil guardado correctamente.
              </p>
            )}
            <button
              type="button"
              onClick={guardarPago}
              disabled={savingPago || !available}
              className="rounded-xl bg-amber-500 py-2.5 text-[12px] font-black text-white shadow-lg shadow-amber-500/30 active:scale-[0.98] disabled:opacity-50"
            >
              {savingPago ? "Guardando..." : tienePagoMovil ? "Actualizar Pago Movil" : "Guardar Pago Movil"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-100 bg-white p-4 lg:p-5 shadow-xl shadow-slate-200/60 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm lg:text-base font-black text-slate-900">Tus conductores referidos</h2>
          <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">
            {activos} activos
          </span>
        </div>

        {loading && (
          <div className="flex justify-center py-6">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        )}

        {!loading && referidosOrdenados.length === 0 && (
          <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center">
            <span className="material-symbols-outlined text-[36px] text-slate-300">group_add</span>
            <p className="mt-2 text-[12px] font-semibold text-slate-500">
              Aun no tienes referidos. Comparte tu link para empezar.
            </p>
          </div>
        )}

        {referidosOrdenados.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[13px] font-black ${
                item.estado === "activo"
                  ? "bg-emerald-100 text-emerald-700"
                  : item.estado === "inactivo"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {item.referido_nombre?.slice(0, 1).toUpperCase() || "C"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold text-slate-900">{item.referido_nombre}</p>
              <p className="text-[10px] text-slate-500">
                {item.plan ? `Plan ${item.plan} - ` : ""}
                {item.estado === "activo"
                  ? `Activo desde ${fecha(item.activado_at)}`
                  : item.estado === "inactivo"
                    ? "Suscripcion inactiva"
                    : "Pendiente de suscripcion"}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                item.estado === "activo"
                  ? "bg-emerald-100 text-emerald-700"
                  : item.estado === "inactivo"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {item.estado}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-4 lg:p-5 shadow-xl shadow-slate-200/60 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm lg:text-base font-black text-slate-900">Billetera de referidos</h2>
          <span className="text-[10px] font-bold uppercase text-slate-400">USD</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-amber-50 p-3 text-center">
            <p className="text-[9px] font-bold uppercase text-amber-600">Por cobrar</p>
            <p className="text-sm font-black text-amber-700">{usd(cuenta?.comisiones_pendientes)}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-center">
            <p className="text-[9px] font-bold uppercase text-emerald-600">Pagado</p>
            <p className="text-sm font-black text-emerald-700">{usd(cuenta?.comisiones_pagadas)}</p>
          </div>
          <div className="rounded-xl bg-purple-50 p-3 text-center">
            <p className="text-[9px] font-bold uppercase text-purple-600">Acumulado</p>
            <p className="text-sm font-black text-purple-700">{usd(cuenta?.comisiones_totales)}</p>
          </div>
        </div>

        {!esSocio && (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-[10px] text-slate-500">
            Las comisiones del 5% se activan cuando llegas a {meta} referidos activos y te conviertes
            en socio Drivip.
          </p>
        )}

        {(programa?.comisiones?.length ?? 0) === 0 && esSocio && (
          <p className="py-3 text-center text-[11px] text-slate-400">
            Aun no hay comisiones generadas.
          </p>
        )}

        {programa?.comisiones.map((comision) => (
          <div key={comision.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <span className="material-symbols-outlined text-[18px]">percent</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-bold text-slate-900">{comision.referido_nombre}</p>
              <p className="text-[10px] text-slate-500">
                {comision.periodo} - {comision.porcentaje}% de {usd(comision.base_monto)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-black text-slate-900">{usd(comision.monto)}</p>
              <span
                className={`text-[9px] font-bold uppercase ${
                  comision.estado === "pagado" ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {comision.estado}
              </span>
            </div>
          </div>
        ))}

        {(programa?.pagos?.length ?? 0) > 0 && (
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pagos recibidos
            </p>
            {programa?.pagos.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-[11px]">
                <div>
                  <p className="font-bold text-slate-900">{fecha(item.created_at)}</p>
                  <p className="text-[10px] text-slate-400">
                    {item.metodo.replace("_", " ")}
                    {item.referencia ? ` - ${item.referencia}` : ""}
                  </p>
                </div>
                <span className="font-black text-emerald-600">{usd(item.monto)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
