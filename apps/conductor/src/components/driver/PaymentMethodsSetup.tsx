import { useEffect, useState } from "react";
import type { Tenant } from "@drivip/types";
import { supabase } from "@drivip/supabase";
import { useScrollLock } from "../../hooks/useScrollLock";

interface PaymentMethodsSetupProps {
  isOpen?: boolean;
  onClose?: () => void;
  inline?: boolean;
  tenant?: Tenant | null;
  tenantId?: string | null;
  demo?: boolean;
  onSaved?: () => void;
}

interface PaymentState {
  pagoMovil: { activo: boolean; banco: string; cedula: string; telefono: string };
  zelle: { email: string; nombre: string; activo: boolean };
  efectivo: { activo: boolean };
}

const STORAGE_KEY = "drivip:metodos-pago";

const DEFAULT_STATE: PaymentState = {
  pagoMovil: { activo: true, banco: "0102", cedula: "", telefono: "" },
  zelle: { email: "", nombre: "", activo: false },
  efectivo: { activo: true },
};

function leerLocal(): PaymentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      pagoMovil: { ...DEFAULT_STATE.pagoMovil, ...(parsed.pagoMovil ?? {}) },
      zelle: { ...DEFAULT_STATE.zelle, ...(parsed.zelle ?? {}) },
      efectivo: { ...DEFAULT_STATE.efectivo, ...(parsed.efectivo ?? {}) },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function leerTenant(tenant: Tenant): PaymentState {
  return {
    pagoMovil: {
      activo: tenant.pago_movil_activo ?? true,
      banco: tenant.pago_movil_banco ?? DEFAULT_STATE.pagoMovil.banco,
      cedula: tenant.pago_movil_cedula ?? "",
      telefono: tenant.pago_movil_telefono ?? "",
    },
    zelle: {
      activo: tenant.zelle_activo ?? false,
      email: tenant.zelle_email ?? "",
      nombre: tenant.zelle_nombre ?? "",
    },
    efectivo: {
      activo: tenant.efectivo_activo ?? true,
    },
  };
}

function guardarLocal(state: PaymentState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sin almacenamiento local: los datos igual se guardan en Supabase.
  }
}

export default function PaymentMethodsSetup({
  isOpen = true,
  onClose,
  inline = false,
  tenant,
  tenantId,
  demo = false,
  onSaved,
}: PaymentMethodsSetupProps) {
  const [pagoMovil, setPagoMovil] = useState(DEFAULT_STATE.pagoMovil);
  const [zelle, setZelle] = useState(DEFAULT_STATE.zelle);
  const [efectivo, setEfectivo] = useState(DEFAULT_STATE.efectivo);
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useScrollLock(!inline && isOpen);

  useEffect(() => {
    if (!inline && !isOpen) return;
    const estado = tenant ? leerTenant(tenant) : leerLocal();
    setPagoMovil(estado.pagoMovil);
    setZelle(estado.zelle);
    setEfectivo(estado.efectivo);
    setGuardado(false);
    setError(null);
    setGuardando(false);
  }, [inline, isOpen, tenant]);

  if (!inline && !isOpen) return null;

  const guardar = async () => {
    const estado: PaymentState = { pagoMovil, zelle, efectivo };

    if (pagoMovil.activo && (!pagoMovil.banco.trim() || !pagoMovil.cedula.trim() || !pagoMovil.telefono.trim())) {
      setError("Completa banco, cédula y teléfono para activar Pago Móvil.");
      return;
    }

    if (zelle.activo && (!zelle.email.trim() || !zelle.nombre.trim())) {
      setError("Completa el correo y el nombre para activar Zelle.");
      return;
    }

    setError(null);

    if (demo || !tenantId) {
      guardarLocal(estado);
      setGuardado(true);
      onSaved?.();
      if (!inline) onClose?.();
      return;
    }

    setGuardando(true);
    const { error: rpcError } = await supabase.rpc("actualizar_metodos_pago_conductor", {
      p_pago_movil_activo: pagoMovil.activo,
      p_pago_movil_banco: pagoMovil.banco.trim() || null,
      p_pago_movil_cedula: pagoMovil.cedula.trim() || null,
      p_pago_movil_telefono: pagoMovil.telefono.trim() || null,
      p_zelle_activo: zelle.activo,
      p_zelle_email: zelle.email.trim() || null,
      p_zelle_nombre: zelle.nombre.trim() || null,
      p_efectivo_activo: efectivo.activo,
    });
    setGuardando(false);

    if (rpcError) {
      const mensaje =
        rpcError.message === "pago_movil_incompleto"
          ? "Completa banco, cédula y teléfono para activar Pago Móvil."
          : rpcError.message === "zelle_incompleto"
            ? "Completa el correo y el nombre para activar Zelle."
            : rpcError.message === "no_autorizado"
              ? "Inicia sesión como conductor para guardar tus datos."
              : "No se pudieron guardar los datos. Intenta de nuevo.";
      setError(mensaje);
      return;
    }

    guardarLocal(estado);
    setGuardado(true);
    onSaved?.();
    if (!inline) onClose?.();
  };

  const content = (
    <div className={inline ? "px-4 py-4 lg:px-6 space-y-4" : "space-y-4"}>
      <div className="flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-3">
        <span className="material-symbols-outlined mt-0.5 text-[17px] text-blue-600">info</span>
        <p className="text-[10px] leading-snug text-blue-700">
          Estos datos se muestran a tus clientes en el seguimiento del viaje. Activa solo los
          métodos que realmente aceptas.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md">
              <span className="material-symbols-outlined text-[18px]">contactless</span>
            </div>
            <span className="text-sm font-bold text-slate-900">Pago Móvil</span>
          </div>
          <button
            type="button"
            onClick={() => setPagoMovil({ ...pagoMovil, activo: !pagoMovil.activo })}
            aria-label={pagoMovil.activo ? "Desactivar Pago Móvil" : "Activar Pago Móvil"}
            className={`relative h-6 w-12 rounded-full transition-colors ${pagoMovil.activo ? "bg-emerald-500" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${pagoMovil.activo ? "left-[26px]" : "left-0.5"}`} />
          </button>
        </div>
        {pagoMovil.activo && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400">Banco</label>
              <select
                value={pagoMovil.banco}
                onChange={(e) => setPagoMovil({ ...pagoMovil, banco: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="0102">0102 - BDV</option>
                <option value="0104">0104 - VZLA</option>
                <option value="0105">0105 - Mercantil</option>
                <option value="0108">0108 - Provincial</option>
                <option value="0134">0134 - Banesco</option>
                <option value="0138">0138 - Banco Plaza</option>
                <option value="0146">0146 - Bangente</option>
                <option value="0151">0151 - BFC</option>
                <option value="0163">0163 - Banco del Tesoro</option>
                <option value="0166">0166 - Banco Agrícola</option>
                <option value="0168">0168 - Bancrecer</option>
                <option value="0169">0169 - Mi Banco</option>
                <option value="0171">0171 - Banco Activo</option>
                <option value="0172">0172 - Bancamiga</option>
                <option value="0174">0174 - Banplus</option>
                <option value="0175">0175 - Banco Bicentenario</option>
                <option value="0177">0177 - Banfanb</option>
                <option value="0191">0191 - Banco Nacional de Crédito</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400">Cédula</label>
              <input
                type="text"
                value={pagoMovil.cedula}
                onChange={(e) => setPagoMovil({ ...pagoMovil, cedula: e.target.value })}
                placeholder="V-12345678"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400">Teléfono</label>
              <input
                type="tel"
                value={pagoMovil.telefono}
                onChange={(e) => setPagoMovil({ ...pagoMovil, telefono: e.target.value })}
                placeholder="0412-1234567"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
              <span className="material-symbols-outlined text-[18px]">mail</span>
            </div>
            <span className="text-sm font-bold text-slate-900">Zelle</span>
          </div>
          <button
            type="button"
            onClick={() => setZelle({ ...zelle, activo: !zelle.activo })}
            aria-label={zelle.activo ? "Desactivar Zelle" : "Activar Zelle"}
            className={`relative h-6 w-12 rounded-full transition-colors ${zelle.activo ? "bg-emerald-500" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${zelle.activo ? "left-[26px]" : "left-0.5"}`} />
          </button>
        </div>
        {zelle.activo && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400">Email</label>
              <input
                type="email"
                value={zelle.email}
                onChange={(e) => setZelle({ ...zelle, email: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="email@zelle.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400">Nombre</label>
              <input
                type="text"
                value={zelle.nombre}
                onChange={(e) => setZelle({ ...zelle, nombre: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="José Rivera"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
            <span className="material-symbols-outlined text-[18px]">payments</span>
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900">Efectivo</span>
            <p className="text-[10px] text-slate-500">USD + BS</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEfectivo({ activo: !efectivo.activo })}
          aria-label={efectivo.activo ? "Desactivar efectivo" : "Activar efectivo"}
          className={`relative h-6 w-12 rounded-full transition-colors ${efectivo.activo ? "bg-emerald-500" : "bg-slate-300"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${efectivo.activo ? "left-[26px]" : "left-0.5"}`} />
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void guardar()}
        disabled={guardando}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 py-3.5 text-sm font-black text-white shadow-lg shadow-purple-600/30 active:scale-[0.98] disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-[18px]">
          {guardado ? "check_circle" : "save"}
        </span>
        {guardando ? "Guardando..." : guardado ? "Guardado" : "Guardar métodos de pago"}
      </button>

      {!inline && (
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-[11px] font-bold text-slate-400"
        >
          Cancelar
        </button>
      )}
    </div>
  );

  if (inline) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-sm space-y-4 overflow-y-auto rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl sm:max-w-md sm:p-6 lg:max-w-lg lg:p-8">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 lg:text-lg">Métodos de Pago</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 active:scale-95 sm:h-9 sm:w-9 lg:h-10 lg:w-10"
            aria-label="Cerrar métodos de pago"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        {content}
      </div>
    </div>
  );
}
