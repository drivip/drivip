import { useState } from "react";

interface EndTripConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: string, verified: boolean) => void;
  rideDetails: {
    cliente: string;
    origen: string;
    destino: string;
    precioUsd: number;
    precioBs: number;
  };
}

export default function EndTripConfirmation({ isOpen, onClose, onConfirm, rideDetails }: EndTripConfirmationProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("efectivo");
  const [verified, setVerified] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedMethod("efectivo");
    setVerified(false);
    onClose();
  };

  const PAYMENT_OPTIONS = [
    { id: "efectivo", label: "Efectivo Recibido", icon: "payments", gradient: "from-amber-500 to-orange-500" },
    { id: "pago_movil", label: "Pago Móvil Verificado", icon: "qr_code_scanner", gradient: "from-blue-500 to-cyan-500" },
    { id: "transferencia", label: "Transferencia", icon: "account_balance", gradient: "from-violet-500 to-purple-600" },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl border border-slate-100 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base lg:text-lg font-black text-slate-900">Confirmar Fin de Viaje</h3>
          <button onClick={handleClose} className="w-8 h-8 sm:w-9 lg:w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 active:scale-95">✕</button>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
          <p className="text-xs lg:text-sm font-bold text-slate-900">{rideDetails.cliente}</p>
          <p className="text-[10px] lg:text-[11px] text-slate-500">{rideDetails.origen} → {rideDetails.destino}</p>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-xl lg:text-2xl font-black text-slate-900">${rideDetails.precioUsd.toFixed(2)}</span>
            <span className="text-xs lg:text-sm font-bold text-purple-600">Bs. {rideDetails.precioBs.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase">Método de Pago Recibido</p>
          <div className="grid grid-cols-1 gap-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedMethod(opt.id)}
                className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition-all active:scale-[0.98] ${
                  selectedMethod === opt.id
                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${opt.gradient} text-white flex items-center justify-center shadow-md`}>
                  <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
                </div>
                <span className="text-sm lg:text-base font-bold text-slate-900">{opt.label}</span>
                {selectedMethod === opt.id && (
                  <span className="ml-auto material-symbols-outlined text-purple-600 text-[20px]">check_circle</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedMethod === "pago_movil" && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="w-5 h-5 rounded accent-purple-600"
            />
            <div>
              <p className="text-xs lg:text-sm font-bold text-slate-900">Pago Móvil Verificado</p>
              <p className="text-[10px] lg:text-[11px] text-slate-500">Confirmo que recibí el comprobante y el monto es correcto</p>
            </div>
          </div>
        )}

        <button
          onClick={() => onConfirm(selectedMethod, selectedMethod === "pago_movil" ? verified : true)}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm lg:text-base shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          Finalizar Viaje
        </button>
      </div>
    </div>
  );
}
