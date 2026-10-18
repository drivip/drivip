import { cn } from "@drivip/ui";
import type { AdminModule } from "./layout/AdminSidebar";

interface AdminGridMenuProps {
  onNavigate: (module: AdminModule) => void;
}

const MODULES = [
  {
    id: "tenants" as AdminModule,
    label: "Tenants",
    desc: "Conductores",
    gradient: "from-blue-500 to-indigo-600",
    svgPath: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    id: "clientes" as AdminModule,
    label: "Clientes",
    desc: "Registrados y redes",
    gradient: "from-emerald-500 to-teal-600",
    svgPath: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    id: "planes" as AdminModule,
    label: "Planes",
    desc: "Estándar, Profesional, Premium",
    gradient: "from-purple-500 to-indigo-600",
    svgPath: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    id: "suscripciones" as AdminModule,
    label: "Suscripciones",
    desc: "Pagos y verificaciones",
    gradient: "from-emerald-400 to-teal-600",
    svgPath: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  },
  {
    id: "plugins" as AdminModule,
    label: "Plugins",
    desc: "Catalogo de extensiones",
    gradient: "from-violet-500 to-purple-700",
    svgPath: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    id: "promociones" as AdminModule,
    label: "Promociones",
    desc: "Banners y descuentos",
    gradient: "from-amber-500 to-orange-500",
    svgPath: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
  },
  {
    id: "b2b" as AdminModule,
    label: "B2B Delivery",
    desc: "Logistica empresas",
    gradient: "from-rose-500 to-pink-600",
    svgPath: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    id: "security" as AdminModule,
    label: "Seguridad",
    desc: "Credenciales y panico",
    gradient: "from-red-500 to-rose-600",
    svgPath: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    id: "reportes" as AdminModule,
    label: "Reportes",
    desc: "Analytics e ingresos",
    gradient: "from-cyan-500 to-blue-600",
    svgPath: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    id: "mantenimiento" as AdminModule,
    label: "Mantenimiento",
    desc: "Reparacion de datos",
    gradient: "from-slate-500 to-gray-600",
    svgPath: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    id: "devops" as AdminModule,
    label: "DevOps",
    desc: "Deploy y monitoreo",
    gradient: "from-teal-500 to-emerald-600",
    svgPath: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z",
  },
  {
    id: "respaldos" as AdminModule,
    label: "Respaldos",
    desc: "Backup y restauracion",
    gradient: "from-indigo-500 to-blue-600",
    svgPath: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
  },
  {
    id: "soporte" as AdminModule,
    label: "Soporte",
    desc: "Tickets de tenants",
    gradient: "from-orange-400 to-red-500",
    svgPath: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z",
  },
];

export default function AdminGridMenu({ onNavigate }: AdminGridMenuProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {MODULES.map((item) => (
        <button
          key={item.id}
          className="p-3.5 lg:p-4 rounded-2xl bg-white border border-slate-100 flex flex-col items-start gap-2 text-left active:scale-95 transition"
          style={{ boxShadow: "4px 4px 10px #d9dde2, -4px -4px 10px #ffffff" }}
          onClick={() => onNavigate(item.id)}
        >
          <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-tr ${item.gradient} text-white flex items-center justify-center shadow-md`}>
            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.svgPath} />
            </svg>
          </div>
          <div>
            <strong className="text-xs lg:text-sm font-extrabold text-slate-900 block">{item.label}</strong>
            <span className="text-[10px] lg:text-[11px] text-slate-500">{item.desc}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
