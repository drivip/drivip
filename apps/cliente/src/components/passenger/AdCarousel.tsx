import { useCallback, useEffect, useRef, useState } from "react";

export type CarouselAction = "ride" | "delivery" | "purchase" | "schedule";

interface AdSlide {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  action: CarouselAction;
  icon: string;
  gradient: string;
  glow: string;
}

const SLIDES: AdSlide[] = [
  {
    id: "viaje",
    eyebrow: "Tu ciudad, a tu ritmo",
    title: "Viaja con quien ya conoces",
    subtitle: "Tus conductores de confianza, sin comisiones y con pago directo.",
    cta: "Pedir un viaje",
    action: "ride",
    icon: "local_taxi",
    gradient: "from-purple-700 via-indigo-700 to-violet-900",
    glow: "bg-fuchsia-400/25",
  },
  {
    id: "delivery",
    eyebrow: "Delivery Drivip",
    title: "Envía lo que necesites",
    subtitle: "Paquetes, documentos o comida. Tu conductor lo lleva por ti.",
    cta: "Enviar paquete",
    action: "delivery",
    icon: "package_2",
    gradient: "from-orange-500 via-amber-500 to-rose-600",
    glow: "bg-yellow-200/30",
  },
  {
    id: "compra",
    eyebrow: "Compra asistida",
    title: "Compramos y te lo llevamos",
    subtitle: "Comida, farmacia o cualquier servicio. El conductor te envía el precio.",
    cta: "Pedir una compra",
    action: "purchase",
    icon: "shopping_bag",
    gradient: "from-emerald-600 via-teal-600 to-cyan-800",
    glow: "bg-lime-200/25",
  },
  {
    id: "programa",
    eyebrow: "Sin prisas",
    title: "Programa tu próximo viaje",
    subtitle: "Agenda con anticipación y asegura tu conductor para la hora exacta.",
    cta: "Programar viaje",
    action: "schedule",
    icon: "event_available",
    gradient: "from-blue-700 via-indigo-600 to-slate-900",
    glow: "bg-sky-300/25",
  },
];

interface AdCarouselProps {
  onAction: (action: CarouselAction) => void;
}

export default function AdCarousel({ onAction }: AdCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const goTo = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const slide = SLIDES[index];

  return (
    <section
      className="w-full min-w-0 overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_24px_60px_-28px_rgba(76,29,149,0.55)]"
      data-purpose="ad-carousel"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
        setPaused(true);
      }}
      onTouchEnd={(event) => {
        const start = touchStartRef.current;
        const touch = event.changedTouches[0];
        touchStartRef.current = null;
        setPaused(false);
        if (!start || !touch) return;
        const deltaX = start.x - touch.clientX;
        const deltaY = start.y - touch.clientY;
        if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
        goTo(deltaX > 0 ? index + 1 : index - 1);
      }}
    >
      <div className="relative w-full min-w-0 overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((item) => (
            <article
              key={item.id}
              className={`relative flex min-h-[214px] w-full shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br ${item.gradient} px-5 py-5 text-white sm:min-h-[226px] sm:px-7 sm:py-6`}
            >
              <span className={`pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full blur-2xl ${item.glow}`} />
              <span className="pointer-events-none absolute -bottom-20 right-10 h-40 w-40 rounded-full border border-white/10" />
              <span className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 text-[150px] leading-none text-white/[0.08] material-symbols-outlined">
                {item.icon}
              </span>

              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    {item.eyebrow}
                  </span>
                  <h2 className="mt-3 max-w-[290px] text-[26px] font-black leading-[1.05] tracking-tight sm:text-[30px]" style={{ fontFamily: "Poppins, sans-serif" }}>
                    {item.title}
                  </h2>
                  <p className="mt-2 max-w-[300px] text-xs font-medium leading-relaxed text-white/80 sm:text-sm">
                    {item.subtitle}
                  </p>
                </div>

                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-inner backdrop-blur-md sm:h-14 sm:w-14">
                  <span className="material-symbols-outlined text-[26px] sm:text-[30px]">{item.icon}</span>
                </span>
              </div>

              <div className="relative mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onAction(item.action)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-[13px] font-black text-slate-900 shadow-lg shadow-slate-950/15 transition active:scale-95 sm:text-sm"
                >
                  {item.cta}
                  <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                </button>
                <span className="text-[11px] font-bold tracking-[0.2em] text-white/60">
                  0{SLIDES.indexOf(item) + 1}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 bg-white px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-1.5">
          {SLIDES.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Ir al anuncio ${itemIndex + 1}`}
              onClick={() => goTo(itemIndex)}
              className={`h-1.5 rounded-full transition-all ${
                itemIndex === index ? "w-6 bg-purple-700" : "w-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
          <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Publicidad
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Anuncio anterior"
            onClick={() => goTo(index - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition active:scale-90"
          >
            <span className="material-symbols-outlined text-[17px]">chevron_left</span>
          </button>
          <button
            type="button"
            aria-label="Siguiente anuncio"
            onClick={() => goTo(index + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition active:scale-90"
          >
            <span className="material-symbols-outlined text-[17px]">chevron_right</span>
          </button>
        </div>
      </div>
      <span className="sr-only">{slide.title}</span>
    </section>
  );
}
