import { useState } from "react";

interface PaymentMethodsSetupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentMethodsSetup({ isOpen, onClose }: PaymentMethodsSetupProps) {
  const [pagoMovil, setPagoMovil] = useState({ banco: "0102", cedula: "V-19.450.882", telefono: "0412-5558910" });
  const [zelle, setZelle] = useState({ email: "", nombre: "", activo: false });
  const [efectivo, setEfectivo] = useState({ activo: true });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base lg:text-lg font-black text-slate-900">Métodos de Pago</h3>
          <button onClick={onClose} className="w-8 h-8 sm:w-9 lg:w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 active:scale-95">✕</button>
        </div>
        <p className="text-[11px] lg:text-xs text-slate-500">Estos datos se muestran automáticamente a tus clientes al terminar el viaje.</p>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[18px]">contactless</span>
                </div>
                <span className="text-sm lg:text-base font-bold text-slate-900">Pago Móvil</span>
              </div>
              <span className="text-[11px] lg:text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Activo</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase">Banco</label>
                <select
                  value={pagoMovil.banco}
                  onChange={(e) => setPagoMovil({ ...pagoMovil, banco: e.target.value })}
                  className="w-full mt-1 bg-white rounded-xl px-3 py-2 text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="0102">0102 - BDV</option>
                  <option value="0104">0104 - VZLA</option>
                  <option value="0105">0105 - Mercantil</option>
                  <option value="0108">0108 - Provincial</option>
                  <option value="0134">0134 - Banesco</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase">Cédula</label>
                <input
                  type="text"
                  value={pagoMovil.cedula}
                  onChange={(e) => setPagoMovil({ ...pagoMovil, cedula: e.target.value })}
                  className="w-full mt-1 bg-white rounded-xl px-3 py-2 text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase">Teléfono</label>
                <input
                  type="tel"
                  value={pagoMovil.telefono}
                  onChange={(e) => setPagoMovil({ ...pagoMovil, telefono: e.target.value })}
                  className="w-full mt-1 bg-white rounded-xl px-3 py-2 text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <span className="text-sm lg:text-base font-bold text-slate-900">Zelle</span>
              </div>
              <button
                onClick={() => setZelle({ ...zelle, activo: !zelle.activo })}
                className={`w-12 h-6 rounded-full transition-colors relative ${zelle.activo ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${zelle.activo ? 'left-[26px]' : 'left-0.5'}`} />
              </button>
            </div>
            {zelle.activo && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase">Email</label>
                  <input
                    type="email"
                    value={zelle.email}
                    onChange={(e) => setZelle({ ...zelle, email: e.target.value })}
                    className="w-full mt-1 bg-white rounded-xl px-3 py-2 text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="email@zelle.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase">Nombre</label>
                  <input
                    type="text"
                    value={zelle.nombre}
                    onChange={(e) => setZelle({ ...zelle, nombre: e.target.value })}
                    className="w-full mt-1 bg-white rounded-xl px-3 py-2 text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="José Rivera"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </div>
              <div>
                <span className="text-sm lg:text-base font-bold text-slate-900">Efectivo</span>
                <p className="text-[10px] lg:text-[11px] text-slate-500">USD + BS</p>
              </div>
            </div>
            <button
              onClick={() => setEfectivo({ activo: !efectivo.activo })}
              className={`w-12 h-6 rounded-full transition-colors relative ${efectivo.activo ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${efectivo.activo ? 'left-[26px]' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white font-black text-sm lg:text-base shadow-lg shadow-purple-600/30 active:scale-[0.98] transition"
        >
          Guardar Métodos de Pago
        </button>
      </div>
    </div>
  );
}
