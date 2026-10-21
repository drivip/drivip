interface ServiceHubProps {
  onStartRide: () => void;
  onDelivery: () => void;
  onPurchase: () => void;
  onSchedule: () => void;
}

const SERVICES = [
  {
    id: "ride",
    title: "Empezar un viaje",
    subtitle: "Pide tu taxi o mototaxi",
    icon: "local_taxi",
    gradient: "from-purple-600 to-indigo-700",
    tint: "bg-purple-50 text-purple-700 border-purple-100",
  },
  {
    id: "delivery",
    title: "Enviar paquetes",
    subtitle: "Delivery a donde necesites",
    icon: "package_2",
    gradient: "from-orange-400 to-rose-500",
    tint: "bg-orange-50 text-orange-700 border-orange-100",
  },
  {
    id: "purchase",
    title: "Servicio de compra",
    subtitle: "Compramos y te lo llevamos",
    icon: "shopping_bag",
    gradient: "from-emerald-500 to-teal-600",
    tint: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    id: "schedule",
    title: "Programar viaje",
    subtitle: "Agenda para otra fecha",
    icon: "event_available",
    gradient: "from-blue-500 to-indigo-600",
    tint: "bg-blue-50 text-blue-700 border-blue-100",
  },
] as const;

export default function ServiceHub({
  onStartRide,
  onDelivery,
  onPurchase,
  onSchedule,
}: ServiceHubProps) {
  const handlers: Record<(typeof SERVICES)[number]["id"], () => void> = {
    ride: onStartRide,
    delivery: onDelivery,
    purchase: onPurchase,
    schedule: onSchedule,
  };

  return (
    <section data-purpose="service-hub">
      <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-purple-600">
            Servicios Drivip
          </p>
          <h2 className="mt-0.5 text-lg font-black tracking-tight text-slate-900" style={{ fontFamily: "Poppins, sans-serif" }}>
            ¿Qué quieres hacer?
          </h2>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 shadow-sm">
          4 opciones
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {SERVICES.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={handlers[service.id]}
            className="group relative flex h-full min-h-[144px] flex-col overflow-hidden rounded-[22px] border border-white/80 bg-white p-3.5 text-left shadow-[0_14px_34px_-20px_rgba(30,41,59,0.35)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-22px_rgba(30,41,59,0.4)] active:scale-[0.98]"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${service.gradient} text-white shadow-md`}>
              <span className="material-symbols-outlined text-[22px]">{service.icon}</span>
            </div>
            <h3 className="mt-3 text-[13px] font-black leading-tight text-slate-900 sm:text-sm">
              {service.title}
            </h3>
            <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">
              {service.subtitle}
            </p>
            <div className="mt-auto flex items-center justify-between pt-3">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${service.tint}`}>
                Abrir
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-slate-900 group-hover:text-white">
                <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
