interface StepCardProps {
  step: number;
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

export default function StepCard({ step, icon, title, description, gradient }: StepCardProps) {
  return (
    <div className="text-center">
      <div className="relative inline-block mb-4">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${gradient} text-white flex items-center justify-center shadow-lg mx-auto`}>
          <span className="material-symbols-outlined text-[28px]">{icon}</span>
        </div>
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-slate-900 text-[11px] font-black flex items-center justify-center shadow-md">
          {step}
        </div>
      </div>
      <h3 className="text-sm font-extrabold text-white mb-1">{title}</h3>
      <p className="text-[12px] text-white/60 leading-relaxed max-w-xs mx-auto">{description}</p>
    </div>
  );
}
