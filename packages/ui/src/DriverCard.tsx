import { cn } from "./utils";

export type DriverStatus = "available" | "busy" | "offline";

type DriverCardProps = {
  name: string;
  vehicleType: string;
  rating: number;
  status: DriverStatus;
  onClick?: () => void;
  className?: string;
};

const statusConfig: Record<DriverStatus, { dot: string; label: string }> = {
  available: { dot: "bg-success", label: "Disponible" },
  busy: { dot: "bg-warning", label: "Ocupado" },
  offline: { dot: "bg-outline", label: "Offline" },
};

export default function DriverCard({
  name,
  vehicleType,
  rating,
  status,
  onClick,
  className,
}: DriverCardProps) {
  const config = statusConfig[status];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-[160px] h-[180px]",
        "bg-surface-container rounded-2xl p-4",
        "border-2 border-transparent",
        "transition-all duration-200",
        "hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5",
        "active:scale-95",
        className
      )}
    >
      <div className="relative mb-2">
        <div className={cn("w-3 h-3 rounded-full absolute -top-0.5 -right-0.5 z-10", config.dot)} />
        <div className="w-14 h-14 rounded-full bg-primary-container/20 flex items-center justify-center">
          <span className="text-[18px] font-bold text-primary">
            {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </span>
        </div>
      </div>
      <span className="text-[14px] font-semibold text-on-surface mt-1 text-center leading-tight">
        {name}
      </span>
      <span className="text-[11px] text-on-surface-variant mt-0.5">
        {vehicleType}
      </span>
      <span className="text-[11px] text-on-surface-variant mt-0.5">
        {config.label}
      </span>
      <div className="flex items-center gap-1 mt-1.5">
        <span className="material-symbols-outlined text-[14px] text-secondary">star</span>
        <span className="font-mono text-[12px] text-on-surface">{rating.toFixed(1)}</span>
      </div>
    </button>
  );
}
