interface HeroWelcomeCardProps {
  onDriversClick: () => void;
  driverCount: number;
}

export default function HeroWelcomeCard({ onDriversClick, driverCount }: HeroWelcomeCardProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70 border border-slate-100" data-purpose="hero-welcome-card">
      {/* Imagen de Fondo Ejecutiva */}
      <div className="relative h-36 lg:h-44 w-full overflow-hidden">
        <img
          alt="Sleek luxury modern black sedan executive car parked in an upscale city street at dusk"
          className="w-full h-full object-cover object-center transform hover:scale-105 transition duration-700"
          src="https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        <div className="absolute top-3 lg:top-4 left-3 lg:left-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] lg:text-xs font-bold bg-white/90 backdrop-blur-md text-purple-900 shadow">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
            Multi-Conductor Activo
          </span>
        </div>
        <div className="absolute bottom-3 lg:bottom-4 left-4 lg:left-6 right-4 text-white">
          <h2 className="text-xl lg:text-2xl xl:text-3xl font-black leading-tight drop-shadow-md">
            Tu Conductor VIP <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Sin intermediarios</span>
          </h2>
        </div>
      </div>

      <div className="p-4 lg:p-5 space-y-3">
        <p className="text-xs lg:text-sm text-slate-600 font-medium leading-relaxed text-center">
          Movilidad directa en Venezuela, 0% comisiones y pago acordado con tu chofer.
        </p>
        <div className="flex justify-center">
          <button
            className="px-3.5 lg:px-4 py-2 lg:py-2.5 rounded-xl bg-slate-100 border border-slate-200/80 text-[11px] lg:text-xs font-bold text-purple-700 flex items-center gap-1 active:scale-95 shadow-sm transition"
            onClick={onDriversClick}
          >
            <span>{driverCount} Choferes</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
