import SlideOver from "./SlideOver";
import { cn } from "./utils";

export type MenuItem = {
  icon: string;
  label: string;
  onClick: () => void;
  color?: string;
};

type HamburgerMenuProps = {
  open: boolean;
  onClose: () => void;
  items: MenuItem[];
  plugins?: MenuItem[];
  header?: React.ReactNode;
};

export default function HamburgerMenu({
  open,
  onClose,
  items,
  plugins,
  header,
}: HamburgerMenuProps) {
  const gridCols = items.length <= 6 ? "grid-cols-3" : "grid-cols-3";

  return (
    <SlideOver open={open} onClose={onClose}>
      <div className="flex flex-col h-full">
        {header && (
          <div className="px-5 pt-5 pb-3">{header}</div>
        )}

        <div className="px-5 py-4">
          <div className={cn("grid", gridCols, "gap-2")}>
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => { item.onClick(); onClose(); }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-surface-container-high transition-colors"
              >
                <span
                  className={cn(
                    "material-symbols-outlined text-[28px]",
                    item.color || "text-on-surface"
                  )}
                  style={item.color ? { color: item.color } : undefined}
                >
                  {item.icon}
                </span>
                <span className="text-[11px] text-on-surface text-center leading-tight">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {plugins && plugins.length > 0 && (
          <div className="px-5 py-4 border-t border-outline-variant/30">
            <span className="text-[11px] font-mono text-secondary uppercase tracking-wider">
              Plugins Premium
            </span>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {plugins.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { item.onClick(); onClose(); }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[28px] text-secondary">
                    {item.icon}
                  </span>
                  <span className="text-[11px] text-on-surface text-center leading-tight">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto px-5 py-4 border-t border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-primary">person</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] text-on-surface font-medium truncate">Mi Cuenta</span>
              <span className="text-[11px] text-on-surface-variant truncate">Configuración</span>
            </div>
          </div>
        </div>
      </div>
    </SlideOver>
  );
}
