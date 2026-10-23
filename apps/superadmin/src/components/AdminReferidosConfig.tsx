import { useEffect, useState } from "react";
import type { ConfigReferidosInput } from "@drivip/supabase";
import { useConfigReferidos } from "@drivip/supabase";

const DEFAULTS: ConfigReferidosInput = {
  descuento_por_referido_pct: 10,
  meta_referidos_gratis: 10,
  comision_socio_pct: 5,
  precio_plan_estandar: 25,
  precio_plan_profesional: 25,
  precio_plan_premium: 25,
};

function usd(value: number | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function fecha(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminReferidosConfig() {
  const { config, loading, saving, error, available, guardar } = useConfigReferidos();
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState<ConfigReferidosInput>(DEFAULTS);
  const [localError, setLocalError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (!config) return;
    setForm({
      descuento_por_referido_pct: Number(config.descuento_por_referido_pct),
      meta_referidos_gratis: Number(config.meta_referidos_gratis),
      comision_socio_pct: Number(config.comision_socio_pct),
      precio_plan_estandar: Number(config.precio_plan_estandar),
      precio_plan_profesional: Number(config.precio_plan_profesional),
      precio_plan_premium: Number(config.precio_plan_premium),
    });
  }, [config]);

  const setNumero = (key: keyof ConfigReferidosInput, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value === "" ? 0 : Number(value) }));
    setGuardado(false);
  };

  const setPrecioUnico = (value: string) => {
    const precio = value === "" ? 0 : Number(value);
    setForm((prev) => ({
      ...prev,
      precio_plan_estandar: precio,
      precio_plan_profesional: precio,
      precio_plan_premium: precio,
    }));
    setGuardado(false);
  };

  const onSubmit = async () => {
    setLocalError(null);
    setGuardado(false);

    if (!Object.values(form).every((value) => Number.isFinite(value))) {
      setLocalError("Todos los campos deben tener un numero valido.");
      return;
    }
    if (form.descuento_por_referido_pct < 0 || form.descuento_por_referido_pct > 100) {
      setLocalError("El descuento por referido debe estar entre 0 y 100.");
      return;
    }
    if (form.comision_socio_pct < 0 || form.comision_socio_pct > 100) {
      setLocalError("La comision de socio debe estar entre 0 y 100.");
      return;
    }
    if (form.meta_referidos_gratis < 1 || !Number.isFinite(form.meta_referidos_gratis)) {
      setLocalError("La meta debe ser un numero entero mayor a cero.");
      return;
    }
    if (
      form.precio_plan_estandar < 0 ||
      form.precio_plan_profesional < 0 ||
      form.precio_plan_premium < 0
    ) {
      setLocalError("El precio no puede ser negativo.");
      return;
    }

    const { error: saveError } = await guardar({
      ...form,
      meta_referidos_gratis: Math.trunc(form.meta_referidos_gratis),
    });
    if (saveError) return;
    setGuardado(true);
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white px-4 py-4">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  if (!available) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] font-semibold text-amber-700">
        La configuracion del programa no esta disponible. Aplica la migracion
        2026-11-14_config_referidos_admin.sql.
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-3xl border border-slate-100 bg-white"
      style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
    >
      <div className="flex items-center gap-3 px-4 py-3.5 lg:px-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-black text-slate-900">Configuracion del programa</p>
          <p className="text-[10px] text-slate-500">
            {config
              ? `${config.descuento_por_referido_pct}% por referido - meta ${config.meta_referidos_gratis} - comision ${config.comision_socio_pct}%`
              : "Sin configuracion cargada"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAbierto((prev) => !prev)}
          className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-700 active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">
            {abierto ? "expand_less" : "edit"}
          </span>
          {abierto ? "Cerrar" : "Editar"}
        </button>
      </div>

      {!abierto && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-center lg:px-5">
          <p className="text-[9px] font-bold uppercase text-slate-400">Mensualidad unica</p>
          <p className="text-[15px] font-black text-slate-900">{usd(config?.precio_plan_estandar)}</p>
        </div>
      )}

      {abierto && (
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4 lg:px-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <label className="block">
              <span className="text-[9px] font-bold uppercase text-slate-500">Descuento por referido (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={form.descuento_por_referido_pct}
                onChange={(event) => setNumero("descuento_por_referido_pct", event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-900 outline-none focus:border-purple-400"
              />
            </label>
            <label className="block">
              <span className="text-[9px] font-bold uppercase text-slate-500">Meta para mensualidad gratis</span>
              <input
                type="number"
                min={1}
                max={1000}
                step={1}
                value={form.meta_referidos_gratis}
                onChange={(event) => setNumero("meta_referidos_gratis", event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-900 outline-none focus:border-purple-400"
              />
            </label>
            <label className="block">
              <span className="text-[9px] font-bold uppercase text-slate-500">Comision de socio (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={form.comision_socio_pct}
                onChange={(event) => setNumero("comision_socio_pct", event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-900 outline-none focus:border-purple-400"
              />
            </label>
            <label className="block">
              <span className="text-[9px] font-bold uppercase text-slate-500">Mensualidad unica (USD)</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.precio_plan_estandar}
                onChange={(event) => setPrecioUnico(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-900 outline-none focus:border-purple-400"
              />
            </label>
          </div>

          <p className="mt-3 text-[10px] text-slate-500">
            Los cambios aplican a los proximos calculos. Las comisiones ya generadas no se recalculan.
          </p>

          {(localError || error) && (
            <p className="mt-2 text-[11px] font-semibold text-rose-600">{localError ?? error}</p>
          )}
          {guardado && (
            <p className="mt-2 text-[11px] font-semibold text-emerald-600">
              Configuracion guardada correctamente.
            </p>
          )}

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[9px] text-slate-400">
              Actualizado: {fecha(config?.actualizado_at)}
            </p>
            <button
              type="button"
              onClick={() => void onSubmit()}
              disabled={saving}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-[11px] font-black text-white active:scale-95 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar configuracion"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
