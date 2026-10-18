import Button from "./Button";
import { cn } from "./utils";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "destructive";
  onConfirm?: () => void;
  onCancel?: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "destructive",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-sm" />
      <div
        className={cn(
          "relative w-full max-w-sm bg-surface-container-low rounded-2xl p-5 shadow-2xl",
          "flex flex-col gap-3"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[18px] font-semibold text-on-surface">
          {title}
        </h3>
        <p className="text-[13px] text-on-surface-variant leading-relaxed">
          {message}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            className="flex-1"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
