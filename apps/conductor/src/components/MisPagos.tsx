import { useState } from "react";

export default function MisPagos() {
  const [pendingVerified, setPendingVerified] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const transactions = [
    { id: "t1", cliente: "Mariana Silva", method: "Pago Móvil BDV", ref: "#441920", monto: 6.00, montoBs: 348, icon: "qr_code_2", gradient: "from-blue-500 to-cyan-500" },
    { id: "t2", cliente: "Alejandro Ruiz", method: "Efectivo Divisas", ref: "Billete $10", monto: 10.00, montoBs: 0, icon: "attach_money", gradient: "from-amber-500 to-orange-500" },
    { id: "t3", cliente: "Yulimar Pacheco", method: "Pago Móvil Mercantil", ref: "#112093", monto: 5.50, montoBs: 319, icon: "qr_code_2", gradient: "from-blue-500 to-cyan-500" },
    { id: "t4", cliente: "Pedro Medina", method: "Efectivo Bolívares", ref: "Exacto", monto: 8.00, montoBs: 464, icon: "local_atm", gradient: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="px-4 py-4 space-y-4 lg:px-8 lg:py-6 max-w-2xl mx-auto w-full">
      <h1 className="text-xl lg:text-2xl font-black text-slate-900">Billetera</h1>

      <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </div>
          <div>
            <p className="text-sm lg:text-base font-bold text-slate-900">Plan Mototaxi PRO</p>
            <p className="text-[10px] lg:text-[11px] text-slate-500">Vence en 18 días • $10/mes</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] lg:text-xs font-bold border border-emerald-200">Al día</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-3xl p-4 shadow-xl shadow-slate-200/60 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] lg:text-xs font-bold text-blue-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
              Pago Móvil
            </span>
          </div>
          <p className="text-xl lg:text-2xl font-black text-slate-900">$32.00</p>
          <p className="text-[11px] lg:text-xs text-slate-500">Bs. 1.850,00</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] lg:text-[11px] text-slate-500">6 carreras</span>
            <span className="text-[10px] lg:text-[11px] font-bold text-emerald-600">+18%</span>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-xl shadow-slate-200/60 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] lg:text-xs font-bold text-amber-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">payments</span>
              Efectivo
            </span>
          </div>
          <p className="text-xl lg:text-2xl font-black text-slate-900">$18.00</p>
          <p className="text-[11px] lg:text-xs text-slate-500">Caja física</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] lg:text-[11px] text-slate-500">4 carreras</span>
            <span className="text-[10px] lg:text-[11px] font-bold text-slate-900">$50 Total</span>
          </div>
        </div>
      </div>

      {!pendingVerified && (
        <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[20px]">notification_important</span>
              <h3 className="text-sm lg:text-base font-black text-slate-900">Validar Pago Móvil</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] lg:text-[11px] font-bold border border-amber-200">1 pendiente</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <span className="text-xs font-bold">CG</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Carlos Gómez</p>
                  <p className="text-[10px] text-slate-500">Chacaíto → Las Mercedes</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-black text-slate-900">$4.00</p>
                <p className="text-[10px] font-bold text-blue-600">Bs. 232,00</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-700">BDV • Ref:</span>
                <span className="text-[11px] font-bold text-amber-600">#893412</span>
              </div>
              <button onClick={() => setShowReceiptModal(true)} className="text-[11px] font-bold text-purple-600 active:scale-95">Ver Recibo</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPendingVerified(true)} className="py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs lg:text-sm font-bold active:scale-95">
                No Recibido
              </button>
              <button onClick={() => setPendingVerified(true)} className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs lg:text-sm font-bold active:scale-95 shadow-md shadow-emerald-500/25">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingVerified && (
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px] text-emerald-600">check</span>
          </div>
          <p className="text-base lg:text-lg font-black text-slate-900">¡Pago Verificado!</p>
          <p className="text-[11px] lg:text-xs text-slate-500">Bs. 232 acreditados a tu caja diaria</p>
        </div>
      )}

      <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm lg:text-base font-black text-slate-900">Tus Datos para Pago Móvil</h3>
          <button className="text-purple-600 text-[11px] lg:text-xs font-bold active:scale-95 flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[14px]">edit</span>
            Editar
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
          <div>
            <p className="text-[10px] lg:text-[11px] text-slate-400 uppercase font-bold">Banco</p>
            <p className="text-xs lg:text-sm font-bold text-slate-900">0102 - BDV</p>
          </div>
          <div>
            <p className="text-[10px] lg:text-[11px] text-slate-400 uppercase font-bold">Cédula</p>
            <p className="text-xs lg:text-sm font-bold text-slate-900 font-mono">V-19.450.882</p>
          </div>
          <div>
            <p className="text-[10px] lg:text-[11px] text-slate-400 uppercase font-bold">Teléfono</p>
            <p className="text-xs lg:text-sm font-bold text-slate-900 font-mono">0412-5558910</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] lg:text-xs text-slate-500">Tasa del día (BCV):</span>
          <span className="text-[11px] lg:text-xs font-bold text-blue-600">Bs. 58,00 / USD</span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm lg:text-base font-black text-slate-900">Carreras de Hoy</h3>
        {transactions.map((tx) => (
          <div key={tx.id} className="bg-white rounded-3xl p-3 lg:p-4 shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${tx.gradient} text-white flex items-center justify-center flex-shrink-0 shadow-md`}>
              <span className="material-symbols-outlined text-[18px]">{tx.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-slate-900 truncate">{tx.cliente}</p>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              </div>
              <p className="text-[10px] lg:text-[11px] text-slate-500 truncate">{tx.method} • {tx.ref}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-black text-emerald-600">+${tx.monto.toFixed(2)}</p>
              {tx.montoBs > 0 && <p className="text-[10px] lg:text-[11px] text-slate-500">Bs. {tx.montoBs}</p>}
            </div>
          </div>
        ))}
      </div>

      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 shadow-2xl max-w-sm w-full mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-base lg:text-lg font-black text-slate-900">Captura Enviada</span>
              <button onClick={() => setShowReceiptModal(false)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 active:scale-95">✕</button>
            </div>
            <div className="h-48 rounded-2xl bg-slate-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-[48px] text-slate-300">receipt</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] lg:text-xs">
                <span className="text-slate-500">Referencia:</span>
                <span className="font-bold text-slate-900">#893412</span>
              </div>
              <div className="flex justify-between text-[11px] lg:text-xs">
                <span className="text-slate-500">Monto:</span>
                <span className="font-bold text-emerald-600">Bs. 232,00 ($4.00)</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setShowReceiptModal(false); setPendingVerified(true); }} className="py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs lg:text-sm font-bold active:scale-95">
                Rechazar
              </button>
              <button onClick={() => { setShowReceiptModal(false); setPendingVerified(true); }} className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs lg:text-sm font-bold active:scale-95 shadow-md">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
