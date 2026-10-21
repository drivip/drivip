import type { Driver } from "../../types/passenger";
import DriverRating from "./DriverRating";

interface CouponsSectionProps {
  drivers: Driver[];
  selectedDriverId: string | null;
  onSelect: (driver: Driver) => void;
}

const OFFERS = [
  { value: "10%", title: "en tu próximo viaje", code: "VIAJE10", palette: "from-purple-600 to-indigo-700" },
  { value: "$1", title: "de descuento en delivery", code: "DELIVERY1", palette: "from-orange-500 to-rose-600" },
  { value: "15%", title: "en servicio de compra", code: "COMPRA15", palette: "from-emerald-500 to-teal-700" },
  { value: "VIP", title: "prioridad de recogida", code: "PRIORIDAD", palette: "from-blue-600 to-slate-900" },
];

export default function CouponsSection({ drivers, selectedDriverId, onSelect }: CouponsSectionProps) {
  return (
    <section data-purpose="coupons-section">
      <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-500">
            Beneficios de tu red
          </p>
          <h2 className="mt-0.5 text-lg font-black tracking-tight text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>
            Mis cupones
          </h2>
        </div>
        <span className="shrink-0 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-700">
          {drivers.length === 1 ? "1 cupón" : `${drivers.length} cupones`}
        </span>
      </div>

      {drivers.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-5 py-7 text-center">
          <span className="material-symbols-outlined text-[30px] text-slate-300">confirmation_number</span>
          <p className="mt-2 text-xs font-bold text-slate-600">Aún no tienes cupones</p>
          <p className="mt-1 text-[10px] font-medium text-slate-400">
            Agrega conductores para recibir sus promociones.
          </p>
        </div>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:scroll-pl-0 sm:px-0">
          {drivers.map((driver, index) => {
            const offer = OFFERS[index % OFFERS.length];
            const selected = selectedDriverId === driver.id;
            return (
              <button
                key={`coupon-${driver.id}`}
                type="button"
                onClick={() => onSelect(driver)}
                className={`relative w-[268px] max-w-[80vw] shrink-0 snap-start overflow-hidden rounded-[24px] border p-4 text-left transition duration-200 hover:-translate-y-1 active:scale-[0.98] ${
                  selected
                    ? "border-purple-300 bg-purple-50/80 shadow-[0_18px_34px_-18px_rgba(126,34,206,0.55)] ring-2 ring-purple-500/30"
                    : "border-white/80 bg-white shadow-[0_16px_34px_-22px_rgba(30,41,59,0.45)]"
                }`}
              >
                <span className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${offer.palette}`} />
                <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#f1f4f8]" />
                <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#f1f4f8]" />

                <div className="flex items-start justify-between gap-3 pl-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                      Cupón de {driver.name.split(" ")[0]}
                    </span>
                    <p className={`mt-1 bg-gradient-to-r ${offer.palette} bg-clip-text text-[27px] font-black leading-none text-transparent`}>
                      {offer.value}
                    </p>
                    <p className="mt-1 text-[11px] font-bold leading-tight text-slate-700">{offer.title}</p>
                  </div>
                  {driver.image ? (
                    <img
                      alt={driver.name}
                      src={driver.image}
                      className="h-10 w-10 rounded-xl border-2 border-white object-cover shadow-sm"
                    />
                  ) : (
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white shadow-sm ${driver.color}`}>
                      {driver.initials}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-1.5 pl-2">
                  <DriverRating rating={driver.rating} reviews={driver.reviews} size="xs" />
                  <span className="text-slate-300">·</span>
                  <span className="max-w-[136px] truncate text-[11px] font-semibold text-slate-500">{driver.vehicle}</span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-slate-200 pt-2.5 pl-2">
                  <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10px] font-black tracking-wider text-slate-600">
                    {offer.code}
                  </span>
                  <span className={`flex items-center gap-1 text-[10px] font-black ${selected ? "text-purple-700" : "text-slate-500"}`}>
                    {selected ? "Seleccionado" : "Elegir"}
                    <span className="material-symbols-outlined text-[14px]">
                      {selected ? "check_circle" : "arrow_forward"}
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
