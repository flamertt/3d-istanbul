import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

interface SidePanelProps {
  title: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  accentColor?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function SidePanel({ title, subtitle, icon, accentColor, onClose, children, footer, className }: SidePanelProps) {
  return (
    <div className={cn(
      // Mobile: bottom sheet — haritanın üst kısmı görünür kalır
      // Desktop: sağ kenar panel
      "absolute z-40 flex flex-col select-none",
      "bottom-0 left-0 right-0 max-h-[72vh] rounded-t-2xl panel-slide-in",
      "md:top-0 md:right-0 md:bottom-0 md:left-auto md:w-80 md:max-h-none md:rounded-none",
      "bg-gray-950 border-t md:border-t-0 md:border-l border-border/40 shadow-2xl",
      className
    )}>
      {/* Mobile pill handle */}
      <div className="flex md:hidden justify-center pt-2.5 pb-1 shrink-0">
        <div className="w-10 h-1 rounded-full bg-gray-600" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 md:pt-5 pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={accentColor ? { backgroundColor: accentColor } : undefined}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-foreground truncate">{title}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
        >
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="shrink-0 border-t border-border px-5 py-4">
          {footer}
        </div>
      )}
    </div>
  );
}

/** Delivery Tracker stilinde 2-sütun stat grid */
export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

/** Tek stat kartı */
export function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

/** Bölüm başlığı */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>
  );
}
