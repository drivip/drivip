import { cn } from "./utils";

interface DrivipHeaderProps {
  domain?: string;
  isOnline?: boolean;
  profileImage?: string;
  profileInitial?: string;
  onMenuClick?: () => void;
  onProfileClick?: () => void;
  className?: string;
}

export default function DrivipHeader({
  domain = "josetaxi.drivip.app",
  isOnline = true,
  profileImage,
  profileInitial = "J",
  onMenuClick,
  onProfileClick,
  className,
}: DrivipHeaderProps) {
  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.25)]",
        className
      )}
    >
      <div className="h-16 px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={onMenuClick}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors lg:hidden flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[24px] text-on-surface">menu</span>
          </button>
          <DrivipLogo className="h-8 w-auto object-contain flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[18px] font-semibold text-text-primary truncate tracking-tight">Drivip</span>
              <span className="text-[12px] font-medium text-tertiary bg-surface-container px-1.5 py-0.5 rounded">PRO</span>
            </div>
            <span className="text-[12px] text-text-secondary truncate">{domain}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-full">
            <span
              className={cn(
                "w-2.5 h-2.5 rounded-full",
                isOnline ? "bg-success animate-pulse" : "bg-error"
              )}
            />
            <span
              className={cn(
                "text-[12px] font-medium hidden xs:inline",
                isOnline ? "text-success" : "text-error"
              )}
            >
              ONLINE
            </span>
          </div>
          <button
            onClick={onProfileClick}
            className="relative flex-shrink-0"
          >
            {profileImage ? (
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
                src={profileImage}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center">
                <span className="text-[11px] font-bold text-primary">{profileInitial}</span>
              </div>
            )}
            <span
              className={cn(
                "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-surface",
                isOnline ? "bg-success" : "bg-error"
              )}
            />
          </button>
        </div>
      </div>
    </header>
  );
}

function DrivipLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="4" width="24" height="24" rx="6" fill="#6b21a8" />
      <path
        d="M9 12h6c3.3 0 6 2.7 6 6s-2.7 6-6 6h-6V12zm3 3v6h3c1.7 0 3-1.3 3-3s-1.3-3-3-3h-3z"
        fill="#dfb7ff"
      />
      <path
        d="M28 12h3l5 9 5-9h3l-6.5 11H34.5L28 12zm17 0h8v2.5h-5.5V17h5v2.5h-5V23h-2.5V12z"
        fill="#e2e2e6"
      />
    </svg>
  );
}
