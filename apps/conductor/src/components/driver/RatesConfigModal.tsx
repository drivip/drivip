import { useState } from "react";

interface RatesConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rates: RateConfig[]) => void;
}

interface RateConfig {
  id: string;
  zona: string;
  base: number;
  porKm: number;
}

const DEFAULT_RATES: RateConfig[] = [
  { id: "1", zona: "Centro", base: 5.0, porKm: 1.5 },
  { id: "2", zona: "Este", base: 8.0, porKm: 2.0 },
  { id: "3", zona: "Oeste", base: 6.0, porKm: 1.8 },
  { id: "4", zona: "Sur", base: 7.0, porKm: 1.7 },
];

const ZONE_GRADIENTS = [
  "from-purple-500 to-indigo-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-500",
];

export default function RatesConfigModal({ isOpen, onClose, onSave }: RatesConfigModalProps) {
  const [rates, setRates] = useState<RateConfig[]>(DEFAULT_RATES);
  const [mode, setMode] = useState<"km" | "zona">("km");

  if (!isOpen) return null;

  const updateRate = (id: string, field: "base" | "porKm", value: number) => {
    setRates(rates.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base lg:text-lg font-black text-slate-900">Configurar Tarifas</h3>
          <button onClick={onClose} className="w-8 h-8 sm:w-9 lg:w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 active:scale-95">✕</button>
        </div>

        <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60">
          <button
            onClick={() => setMode("km")}
            className={`py-2.5 rounded-xl font-bold text-xs lg:text-sm transition ${mode === "km" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
          >
            Por Kilómetro
          </button>
          <button
            onClick={() => setMode("zona")}
            className={`py-2.5 rounded-xl font-bold text-xs lg:text-sm transition ${mode === "zona" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
          >
            Por Zona Fija
          </button>
        </div>

        <div className="space-y-3">
          {rates.map((rate, idx) => (
            <div key={rate.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ZONE_GRADIENTS[idx]} text-white flex items-center justify-center text-xs font-bold shadow-md`}>
                  {idx + 1}
                </div>
                <span className="text-sm lg:text-base font-bold text-slate-900">{rate.zona}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase">Base ($)</label>
                  <input
                    type="number"
                    value={rate.base}
                    onChange={(e) => updateRate(rate.id, "base", parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 bg-white rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase">{mode === "km" ? "$/KM" : "Fijo ($)"}</label>
                  <input
                    type="number"
                    value={rate.porKm}
                    onChange={(e) => updateRate(rate.id, "porKm", parseFloat(e.target.value) || 0)}
                    className="w-full mt-1 bg-white rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500 border border-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onSave(rates)}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white font-black text-sm lg:text-base shadow-lg shadow-purple-600/30 active:scale-[0.98] transition"
        >
          Guardar Tarifas
        </button>
      </div>
    </div>
  );
}
