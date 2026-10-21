import { useEffect, useMemo, useRef, useState } from "react";
import type { TenantBanner } from "@drivip/types";
import { useTenantBanners } from "@drivip/supabase";

interface DriverAdCarouselProps {
  tenantId?: string | null;
  onNavigate: (module: string) => void;
}

interface Slide {
  id: string;
  titulo: string;
  descripcion: string;
  cta: string;
  icon: string;
  gradient: string;
  imagen?: string | null;
  enlace?: string | null;
  action?: string;
}

const FALLBACK_SLIDES: Slide[] = [
  {
    id: "red",
    titulo: "Tus clientes te encuentran",
    descripcion: "Comparte tu QR y suma pasajeros a tu red.",
    cta: "Mi QR",
    icon: "qr_code_2",
    gradient: "from-purple-700 via-indigo-700 to-violet-800",
    action: "qr",
  },
  {
    id: "resenas",
    titulo: "Reseñas que abren puertas",
    descripcion: "Tu reputación viaja contigo. Revisa lo que dicen tus clientes.",
    cta: "Ver reseñas",
    icon: "reviews",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    action: "resenas",
  },
  {
    id: "pagos",
    titulo: "Cobra rápido y seguro",
    descripcion: "Controla tus ingresos y métodos de pago en un solo lugar.",
    cta: "Mi billetera",
    icon: "account_balance_wallet",
    gradient: "from-emerald-600 via-teal-600 to-cyan-700",
    action: "pagos",
  },
  {
    id: "servicios",
    titulo: "Delivery y compras",
    descripcion: "Acepta más servicios y multiplica tus ganancias.",
    cta: "Ver servicios",
    icon: "delivery_dining",
    gradient: "from-slate-900 via-slate-800 to-indigo-900",
    action: "carreras",
  },
];

const PRIORIDAD: Record<string, number> = { alta: 0, normal: 1, baja: 2 };

export default function DriverAdCarousel({ tenantId, onNavigate }: DriverAdCarouselProps) {
  const { banners } = useTenantBanners(tenantId ?? null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  const slides = useMemo<Slide[]>(() => {
    const activos = banners
      .filter((banner) => banner.activo)
      .sort((a, b) => {
        const orden = (a.orden ?? 0) - (b.orden ?? 0);
        if (orden !== 0) return orden;
        return (PRIORIDAD[a.prioridad] ?? 1) - (PRIORIDAD[b.prioridad] ?? 1);
      })
      .slice(0, 4)
      .map((banner: TenantBanner) => ({
        id: banner.id,
        titulo: banner.titulo,
        descripcion: banner.descripcion ?? "",
        cta: banner.cta_texto?.trim() || "Ver más",
        icon: "campaign",
        gradient: "from-slate-900 via-purple-900 to-indigo-900",
        imagen: banner.imagen_url,
        enlace: banner.enlace_url,
      }));

    return activos.length > 0 ? activos : FALLBACK_SLIDES;
  }, [banners]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [index, slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5200);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  const handleSlideAction = (slide: Slide) => {
    if (slide.enlace) {
      window.open(slide.enlace, "_blank", "noopener,noreferrer");
      return;
    }
    if (slide.action) onNavigate(slide.action);
  };

  return (
    <section
      className="relative overflow-hidden rounded-3xl shadow-xl shadow-slate-300/40"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
        setPaused(true);
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        const end = event.changedTouches[0]?.clientX ?? null;
        touchStart.current = null;
        setPaused(false);
        if (start === null || end === null || Math.abs(start - end) < 40) return;
        setIndex((prev) =>
          start > end
            ? (prev + 1) % slides.length
            : (prev - 1 + slides.length) % slides.length
        );
      }}
    >
      <div className="relative h-44 sm:h-48">
        {slides.map((slide, slideIndex) => (
          <article
            key={slide.id}
            className={`absolute inset-0 transition-all duration-500 ${
              slideIndex === index ? "opacity-100 translate-x-0" : "pointer-events-none opacity-0 translate-x-3"
            }`}
          >
            {slide.imagen ? (
              <img
                src={slide.imagen}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`} />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/65 to-slate-900/10" />
            <div className="absolute -right-6 -top-8 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 right-8 h-28 w-28 rounded-full bg-white/10 blur-xl" />

            <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white/90 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Drivip Conductor
                </span>
                <span className="material-symbols-outlined text-[30px] text-white/80">
                  {slide.icon}
                </span>
              </div>

              <div className="max-w-[82%]">
                <h2 className="text-lg font-black leading-tight text-white sm:text-xl">{slide.titulo}</h2>
                <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-white/75 sm:text-xs">
                  {slide.descripcion}
                </p>
                <button
                  type="button"
                  onClick={() => handleSlideAction(slide)}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[10px] font-black text-slate-900 shadow-lg active:scale-95 transition"
                >
                  {slide.cta}
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Ir al anuncio ${slideIndex + 1}`}
              onClick={() => setIndex(slideIndex)}
              className={`h-1.5 rounded-full transition-all ${
                slideIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/45"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
