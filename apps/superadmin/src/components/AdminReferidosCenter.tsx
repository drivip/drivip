import { useMemo, useState } from "react";
import type { AdminReferidoRow } from "@drivip/types";
import { useAdminReferidos } from "@drivip/supabase";
import AdminReferidosConfig from "./AdminReferidosConfig";

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

interface PagoForm {
  metodo: string;
  referencia: string;
  notas: string;
}

export default function AdminReferidosCenter() {
  const {
    rows,
    detalles,
    loading,
    error,
    available,
    totalPendiente,
    alertasPago,
    refetch,
    pagarComisiones,
  } = useAdminReferidos();

  const [search, setSearch] = useState("");
  const [expandido, setExpandido] = useState<string | null>(null);
  const [pagoRow, setPagoRow] = useState<AdminReferidoRow | null>(null);
  const [pagoForm, setPagoForm] = useState<PagoForm>({
    metodo: "pago_movil",
    referencia: "",
    notas: "",
  });
  const [procesando, setProcesando] = useState(false);
  const [pagoError, setPagoError] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2800);
  };

  const filtradas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (row) =>
        row.nombre.toLowerCase().includes(term) ||
        (row.codigo_referido ?? "").toLowerCase().includes(term)
    );
  }, [rows, search]);

  const totalActivos = rows.reduce((sum, row) => sum + row.referidos_activos, 0);
  const totalReferidos = rows.reduce((sum, row) => sum + row.referidos_total, 0);
  const socios = rows.filter((row) => row.socio_drivip).length;
  const pagados = rows.reduce((sum, row) => sum + row.comisiones_pagadas, 0);

  const abrirPago = (row: AdminReferidoRow) => {
    setPagoRow(row);
    setPagoForm({ metodo: "pago_movil", referencia: "", notas: "" });
    setPagoError(null);
  };

  const confirmarPago = async () => {
    if (!pagoRow) return;
    setProcesando(true);
    setPagoError(null);
    const { error: payError } = await pagarComisiones(pagoRow.id, {
      metodo: pagoForm.metodo,
      referencia: pagoForm.referencia || undefined,
      notas: pagoForm.notas || undefined,
    });
    setProcesando(false);
    if (payError) {
      setPagoError(payError);
      return;
    }
    showToast(`Pago de ${usd(pagoRow.comisiones_pendientes)} registrado`);
    setPagoRow(null);
  };

  const detalleDe = (tenantId: string) =>
    detalles.filter((item) => item.referidor_tenant_id === tenantId);

  return (
    <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4 pb-24 lg:pb-6">
      {toast && (
        <div className="fixed left-1/2 top-4 z-[100] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-5 lg:p-6 lg:flex-row lg:items-center lg:justify-between" style={{ boxShadow: "6px 6px 14px #d9dde2, -6px -6px 14px #ffffff" }}>
        <div>
          <h2 className="text-base lg:text-lg font-black text-slate-900">Referidos y Socios</h2>
          <p className="mt-0.5 text-[11px] lg:text-xs text-slate-500">
            Descuentos, comisiones del 5% y pagos por Pago Movil.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-[11px] font-bold text-slate-700 active:scale-95"
        >
          <span className="material-symbols-outlined text-[17px]">refresh</span>
          Actualizar
        </button>
      </div>

      <AdminReferidosConfig />

      {!available && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] font-semibold text-amber-700">
          El programa de referidos esta pendiente de activacion. Aplica la migracion
          2026-11-13_programa_referidos_socios.sql para habilitar descuentos y pagos.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[11px] font-semibold text-rose-700">
          {error}
        </div>
      )}

      {alertasPago.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/20">
          <div className="flex items-center gap-3 px-4 py-3.5 lg:px-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20">
              <span className="material-symbols-outlined text-[22px]">notification_important</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-black">
                Hay que pagar comisiones a {alertasPago.length} conductor{alertasPago.length === 1 ? "" : "es"}
              </p>
              <p className="text-[10px] text-white/80">
                Total pendiente: {usd(totalPendiente)}. Revisa el Pago Movil registrado antes de abonar.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Referidos", value: String(totalReferidos), icon: "group", color: "text-purple-600", bg: "bg-purple-100" },
          { label: "Activos", value: String(totalActivos), icon: "verified", color: "text-emerald-600", bg: "bg-emerald-100" },
          { label: "Socios", value: String(socios), icon: "handshake", color: "text-amber-600", bg: "bg-amber-100" },
          { label: "Pagado", value: usd(pagados), icon: "payments", color: "text-blue-600", bg: "bg-blue-100" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-100 bg-white p-4"
            style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}>
              <span className={`material-symbols-outlined text-[16px] ${card.color}`}>{card.icon}</span>
            </div>
            <p className="mt-2 text-lg font-black text-slate-900">{loading ? "-" : card.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
          search
        </span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar conductor o codigo de referido..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-[12px] font-semibold text-slate-900 outline-none focus:border-purple-400"
        />
      </div>

      {loading && (
        <div className="flex justify-center rounded-3xl border border-slate-100 bg-white py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      )}

      {!loading && filtradas.length === 0 && (
        <div className="rounded-3xl border border-slate-100 bg-white py-12 text-center">
          <span className="material-symbols-outlined text-[38px] text-slate-300">group_add</span>
          <p className="mt-2 text-[12px] font-semibold text-slate-500">
            No hay conductores con referidos registrados.
          </p>
        </div>
      )}

      {!loading &&
        filtradas.map((row) => {
          const abierto = expandido === row.id;
          const detalle = detalleDe(row.id);
          return (
            <div
              key={row.id}
              className="overflow-hidden rounded-3xl border border-slate-100 bg-white"
              style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
            >
              <div className="p-4 lg:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-[14px] font-black text-white">
                    {row.nombre.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[13px] font-black text-slate-900">{row.nombre}</p>
                      {row.socio_drivip && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-black uppercase text-amber-700">
                          Socio
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Codigo <span className="font-mono font-bold text-purple-700">{row.codigo_referido || "-"}</span>
                      {" - "}Plan {row.plan}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Por pagar</p>
                    <p className={`text-base font-black ${row.comisiones_pendientes > 0 ? "text-orange-600" : "text-slate-400"}`}>
                      {usd(row.comisiones_pendientes)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase text-slate-400">Referidos</p>
                    <p className="text-[13px] font-black text-slate-900">
                      {row.referidos_activos} activos / {row.referidos_total}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase text-emerald-600">Descuento</p>
                    <p className="text-[13px] font-black text-emerald-700">
                      {row.descuento_pct}% ({usd(row.monto_descuento)})
                    </p>
                  </div>
                  <div className="rounded-xl bg-purple-50 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase text-purple-600">Cuenta del mes</p>
                    <p className="text-[13px] font-black text-purple-700">
                      {row.total_mensual === 0 ? "GRATIS" : usd(row.total_mensual)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-blue-50 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase text-blue-600">Pagado</p>
                    <p className="text-[13px] font-black text-blue-700">{usd(row.comisiones_pagadas)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandido(abierto ? null : row.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-700 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {abierto ? "expand_less" : "expand_more"}
                    </span>
                    {abierto ? "Ocultar referidos" : "Ver referidos"}
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirPago(row)}
                    disabled={row.comisiones_pendientes <= 0 || !available}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-black text-white shadow-md shadow-emerald-600/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                    Pagar comisiones
                  </button>
                  {row.comisiones_pendientes > 0 && (
                    <span className="text-[10px] font-semibold text-orange-600">
                      Pago Movil: {row.pago_movil_banco || "sin banco"} - {row.pago_movil_telefono || "sin telefono"}
                    </span>
                  )}
                  {row.ultimo_pago_at && (
                    <span className="text-[10px] text-slate-400">
                      Ultimo pago: {fecha(row.ultimo_pago_at)}
                    </span>
                  )}
                </div>
              </div>

              {abierto && (
                <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 lg:px-5">
                  {detalle.length === 0 ? (
                    <p className="py-3 text-center text-[11px] text-slate-400">Sin referidos registrados.</p>
                  ) : (
                    <div className="space-y-2">
                      {detalle.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              item.estado === "activo"
                                ? "bg-emerald-500"
                                : item.estado === "inactivo"
                                  ? "bg-rose-500"
                                  : "bg-amber-500"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-bold text-slate-900">{item.referido_nombre}</p>
                            <p className="text-[10px] text-slate-500">
                              Plan {item.plan} - {usd(item.monto_mensual)}/mes
                              {item.activado_at ? ` - Activo desde ${fecha(item.activado_at)}` : ""}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase ${
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
                  )}
                </div>
              )}
            </div>
          );
        })}

      {pagoRow && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPagoRow(null)} />
          <div className="relative w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Pagar comisiones</h3>
                <p className="text-[11px] text-slate-500">{pagoRow.nombre}</p>
              </div>
              <button
                type="button"
                onClick={() => setPagoRow(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-orange-50 p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">Total a pagar</p>
              <p className="text-2xl font-black text-orange-700">{usd(pagoRow.comisiones_pendientes)}</p>
              <p className="mt-1 text-[10px] text-orange-600">
                {pagoRow.comisiones_pendientes > 0
                  ? "Se marcaran todas las comisiones pendientes como pagadas."
                  : "Sin comisiones pendientes."}
              </p>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">Datos de Pago Movil del socio</p>
              <p className="text-[11px] font-bold text-slate-900">
                {pagoRow.pago_movil_banco || "Banco no registrado"}
              </p>
              <p className="text-[10px] text-slate-500">
                {pagoRow.pago_movil_cedula || "Sin cedula"} - {pagoRow.pago_movil_telefono || "Sin telefono"}
              </p>
            </div>

            <div className="mt-3 space-y-2">
              <select
                value={pagoForm.metodo}
                onChange={(event) => setPagoForm((prev) => ({ ...prev, metodo: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] font-semibold text-slate-900 outline-none"
              >
                <option value="pago_movil">Pago Movil</option>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="otro">Otro</option>
              </select>
              <input
                value={pagoForm.referencia}
                onChange={(event) => setPagoForm((prev) => ({ ...prev, referencia: event.target.value }))}
                placeholder="Referencia del pago"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] font-semibold text-slate-900 outline-none"
              />
              <input
                value={pagoForm.notas}
                onChange={(event) => setPagoForm((prev) => ({ ...prev, notas: event.target.value }))}
                placeholder="Notas (opcional)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] font-semibold text-slate-900 outline-none"
              />
            </div>

            {pagoError && <p className="mt-2 text-[11px] font-semibold text-rose-600">{pagoError}</p>}

            <button
              type="button"
              onClick={() => void confirmarPago()}
              disabled={procesando || pagoRow.comisiones_pendientes <= 0}
              className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-[12px] font-black text-white shadow-lg shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50"
            >
              {procesando ? "Registrando pago..." : `Confirmar pago de ${usd(pagoRow.comisiones_pendientes)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
