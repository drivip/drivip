import { useState } from "react";

interface Expense {
  id: string;
  tipo: string;
  monto: number;
  moneda: string;
  fecha: string;
  notas: string;
}

interface ExpensesTrackerProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, "id">) => void;
  dailyIncome: number;
}

const EXPENSE_CATEGORIES = [
  { tipo: "Combustible", icon: "local_gas_station", gradient: "from-orange-500 to-red-500" },
  { tipo: "Mantenimiento", icon: "build", gradient: "from-blue-500 to-indigo-600" },
  { tipo: "Lavado", icon: "cleaning_services", gradient: "from-cyan-500 to-teal-500" },
  { tipo: "Otro", icon: "more_horiz", gradient: "from-slate-500 to-slate-600" },
];

export default function ExpensesTracker({ expenses, onAddExpense, dailyIncome }: ExpensesTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ tipo: "Combustible", monto: 0, notas: "" });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.monto, 0);
  const netProfit = dailyIncome - totalExpenses;

  const handleAdd = () => {
    if (newExpense.monto > 0) {
      onAddExpense({
        tipo: newExpense.tipo,
        monto: newExpense.monto,
        moneda: "USD",
        fecha: new Date().toISOString().split("T")[0],
        notas: newExpense.notas,
      });
      setNewExpense({ tipo: "Combustible", monto: 0, notas: "" });
      setShowForm(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm lg:text-base font-black text-slate-900">Bitácora de Gastos</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] lg:text-xs font-bold text-purple-700 active:scale-95"
        >
          + Agregar
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
          <p className="text-lg lg:text-xl font-black text-emerald-700">${dailyIncome.toFixed(0)}</p>
          <p className="text-[10px] lg:text-[11px] font-bold text-emerald-600">Ingresos</p>
        </div>
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-center">
          <p className="text-lg lg:text-xl font-black text-red-600">${totalExpenses.toFixed(0)}</p>
          <p className="text-[10px] lg:text-[11px] font-bold text-red-500">Gastos</p>
        </div>
        <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-center">
          <p className="text-lg lg:text-xl font-black text-purple-700">${netProfit.toFixed(0)}</p>
          <p className="text-[10px] lg:text-[11px] font-bold text-purple-600">Ganancia Neta</p>
        </div>
      </div>

      {showForm && (
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="grid grid-cols-4 gap-1.5">
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat.tipo}
                onClick={() => setNewExpense({ ...newExpense, tipo: cat.tipo })}
                className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all active:scale-95 ${
                  newExpense.tipo === cat.tipo ? 'bg-purple-100 border-2 border-purple-400' : 'bg-white border border-slate-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.gradient} text-white flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
                </div>
                <span className="text-[9px] lg:text-[10px] font-bold text-slate-600">{cat.tipo}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase">Monto ($)</label>
              <input
                type="number"
                value={newExpense.monto || ""}
                onChange={(e) => setNewExpense({ ...newExpense, monto: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 bg-white rounded-xl px-3 py-2 text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase">Notas</label>
              <input
                type="text"
                value={newExpense.notas}
                onChange={(e) => setNewExpense({ ...newExpense, notas: e.target.value })}
                className="w-full mt-1 bg-white rounded-xl px-3 py-2 text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Gasolina Full"
              />
            </div>
          </div>
          <button onClick={handleAdd} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-600 text-white font-bold text-xs lg:text-sm active:scale-[0.98]">
            Guardar Gasto
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        {expenses.slice(0, 3).map((exp) => (
          <div key={exp.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-400 to-slate-500 text-white flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[14px]">receipt</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs lg:text-sm font-bold text-slate-900 truncate">{exp.tipo}</p>
                <p className="text-[10px] lg:text-[11px] text-slate-500 truncate">{exp.notas}</p>
              </div>
            </div>
            <span className="text-xs lg:text-sm font-black text-red-500 flex-shrink-0">-${exp.monto.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
