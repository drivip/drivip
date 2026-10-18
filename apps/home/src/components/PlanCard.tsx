interface PlanCardProps {
  name: string;
  price: string;
  period?: string;
  features: string[];
  unavailable?: string[];
  gradient: string;
  popular?: boolean;
  onCta?: () => void;
  ctaLabel?: string;
}

export default function PlanCard({ name, price, period = "/mes", features, unavailable = [], gradient, popular = false, onCta, ctaLabel }: PlanCardProps) {
  return (
    <div className={`relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border ${popular ? "border-purple-400/50 ring-2 ring-purple-500/30" : "border-white/10"} hover:bg-white/15 transition-all`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
          Más Popular
        </div>
      )}

      <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${gradient} text-white flex items-center justify-center shadow-md mb-4`}>
        <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
      </div>

      <h3 className="text-lg font-black text-white">{name}</h3>
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-3xl font-black text-white">{price}</span>
        <span className="text-[12px] text-white/50 font-medium">{period}</span>
      </div>

      <ul className="space-y-2 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[14px] text-emerald-400 mt-0.5">check_circle</span>
            <span className="text-[12px] text-white/80">{f}</span>
          </li>
        ))}
        {unavailable.map((f) => (
          <li key={f} className="flex items-start gap-2 opacity-40">
            <span className="material-symbols-outlined text-[14px] text-white/30 mt-0.5">cancel</span>
            <span className="text-[12px] text-white/50 line-through">{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onCta}
        className={`w-full py-3 rounded-xl text-[13px] font-bold active:scale-[0.98] transition ${
          popular
            ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30"
            : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
        }`}
      >
        {ctaLabel || `Comenzar con ${name}`}
      </button>
    </div>
  );
}
