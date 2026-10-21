import {
  MapLibreView,
  VENEZUELA_CENTER,
  VENEZUELA_MAP_BOUNDS,
} from "@drivip/maps";

interface HeroWelcomeCardProps {
  onDriversClick: () => void;
  onMapClick?: () => void;
  onOriginClick?: () => void;
  driverCount: number;
  origin?: { lat: number; lng: number; address: string } | null;
  destination?: { lat: number; lng: number; label?: string } | null;
}

const LIGHT_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

export default function HeroWelcomeCard({
  onDriversClick,
  onMapClick,
  onOriginClick,
  driverCount,
  origin,
  destination,
}: HeroWelcomeCardProps) {
  const center: [number, number] = origin
    ? [origin.lat, origin.lng]
    : VENEZUELA_CENTER;

  return (
    <section
      className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/70"
      data-purpose="hero-welcome-card"
    >
      <div className="relative h-48 w-full overflow-hidden sm:h-52">
        <MapLibreView
          center={center}
          zoom={origin ? 14 : 5.5}
          mapStyle={LIGHT_STYLE}
          className="absolute inset-0"
          interactive={false}
          maxBounds={VENEZUELA_MAP_BOUNDS}
          origin={origin}
          destination={destination}
          showPulse={Boolean(origin)}
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/20 to-white/10" />

        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/60 bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-purple-800 shadow-sm backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Venezuela
        </div>

        <button
          type="button"
          onClick={onOriginClick}
          className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/70 bg-white/95 px-3 py-2 text-[11px] font-black text-slate-800 shadow-lg shadow-slate-950/15 backdrop-blur-md transition active:scale-95"
        >
          <span className="material-symbols-outlined text-[17px] text-emerald-600">my_location</span>
          Estoy aquí
        </button>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
            Tu ubicación
          </p>
          <h2 className="mt-0.5 truncate text-xl font-black leading-tight text-white sm:text-2xl">
            {origin?.address || "Detectando tu ubicación..."}
          </h2>
          <p className="mt-1 text-xs font-medium text-white/75">
            {driverCount > 0
              ? `${driverCount} conductor${driverCount === 1 ? "" : "es"} en tu círculo`
              : "Agrega un conductor para empezar"}
          </p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <button
          type="button"
          onClick={onMapClick}
          className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 px-4 py-3.5 text-left text-white shadow-lg shadow-purple-600/25 active:scale-[0.98] transition"
        >
          <span className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[21px]">near_me</span>
            <span>
              <span className="block text-sm font-black">¿A dónde vamos?</span>
              <span className="block text-[11px] font-medium text-white/70">
                Busca calles, barrios o puntos de referencia
              </span>
            </span>
          </span>
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onDriversClick}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left active:scale-[0.98] transition"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <span className="material-symbols-outlined text-[19px]">group</span>
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-black text-slate-900">
                {driverCount} chofer{driverCount === 1 ? "" : "es"}
              </span>
              <span className="block truncate text-[10px] font-medium text-slate-500">
                Tu círculo de confianza
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <span className="material-symbols-outlined text-[19px]">verified_user</span>
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-black text-emerald-900">Sin comisiones</span>
              <span className="block truncate text-[10px] font-medium text-emerald-700">
                Pago directo al chofer
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
