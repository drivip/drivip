import { useState } from "react";

interface VehicleOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VehicleData) => void;
}

interface VehicleData {
  cedula: string;
  nombre: string;
  telefono: string;
  placa: string;
  modelo: string;
  color: string;
  tipo: "MOTO" | "CARRO" | "CAMIONETA";
}

const VEHICLE_TYPES = [
  { id: "MOTO" as const, label: "Moto", icon: "🏍️", gradient: "from-emerald-400 to-teal-600" },
  { id: "CARRO" as const, label: "Carro", icon: "🚗", gradient: "from-blue-500 to-indigo-600" },
  { id: "CAMIONETA" as const, label: "Camioneta", icon: "🛻", gradient: "from-orange-500 to-red-600" },
];

export default function VehicleOnboardingModal({ isOpen, onClose, onSave }: VehicleOnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<VehicleData>({
    cedula: "",
    nombre: "",
    telefono: "",
    placa: "",
    modelo: "",
    color: "",
    tipo: "CARRO",
  });

  if (!isOpen) return null;

  const handleSave = () => onSave(data);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base lg:text-lg font-black text-slate-900">
              {step === 1 ? "Datos Personales" : "Registro de Vehículo"}
            </h3>
            <p className="text-[11px] lg:text-xs text-slate-500">Paso {step} de 2</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 sm:w-9 lg:w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 active:scale-95">✕</button>
        </div>

        <div className="flex gap-2">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-slate-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-slate-200'}`} />
        </div>

        {step === 1 ? (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase">Cédula / RIF</label>
              <input
                type="text"
                value={data.cedula}
                onChange={(e) => setData({ ...data, cedula: e.target.value })}
                className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-sm lg:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
                placeholder="V-19.450.882"
              />
            </div>
            <div>
              <label className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase">Nombre Completo</label>
              <input
                type="text"
                value={data.nombre}
                onChange={(e) => setData({ ...data, nombre: e.target.value })}
                className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-sm lg:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
                placeholder="José Rivera"
              />
            </div>
            <div>
              <label className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase">Teléfono</label>
              <input
                type="tel"
                value={data.telefono}
                onChange={(e) => setData({ ...data, telefono: e.target.value })}
                className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-sm lg:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
                placeholder="+58 412-555-8910"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white font-black text-sm lg:text-base shadow-lg shadow-purple-600/30 active:scale-[0.98] transition"
            >
              Continuar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {VEHICLE_TYPES.map((vt) => (
                <button
                  key={vt.id}
                  onClick={() => setData({ ...data, tipo: vt.id })}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all active:scale-95 ${
                    data.tipo === vt.id
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  style={data.tipo !== vt.id ? { boxShadow: "3px 3px 8px #d9dde2, -3px -3px 8px #ffffff" } : undefined}
                >
                  <span className="text-2xl">{vt.icon}</span>
                  <span className="text-[11px] lg:text-xs font-bold text-slate-700">{vt.label}</span>
                </button>
              ))}
            </div>
            <div>
              <label className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase">Placa</label>
              <input
                type="text"
                value={data.placa}
                onChange={(e) => setData({ ...data, placa: e.target.value })}
                className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-sm lg:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200 font-mono tracking-wider"
                placeholder="ABC-123"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase">Modelo</label>
                <input
                  type="text"
                  value={data.modelo}
                  onChange={(e) => setData({ ...data, modelo: e.target.value })}
                  className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-sm lg:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
                  placeholder="Toyota Corolla"
                />
              </div>
              <div>
                <label className="text-[11px] lg:text-xs font-bold text-slate-500 uppercase">Color</label>
                <input
                  type="text"
                  value={data.color}
                  onChange={(e) => setData({ ...data, color: e.target.value })}
                  className="w-full mt-1 bg-slate-50 rounded-xl px-4 py-3 text-sm lg:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200"
                  placeholder="Blanco"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 font-bold text-sm active:scale-[0.98] transition">
                Atrás
              </button>
              <button onClick={handleSave} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white font-black text-sm shadow-lg shadow-purple-600/30 active:scale-[0.98] transition">
                Registrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
