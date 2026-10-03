import { useEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  leading?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  side?: "left" | "right";
}

export default function SideDrawer({
  open,
  onClose,
  title,
  leading,
  footer,
  children,
  side = "right",
}: SideDrawerProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return createPortal(
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-[55] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel lateral */}
      <div
        className={`fixed top-0 ${side === "left" ? "left-0" : "right-0"} h-full w-80 max-w-[85vw] bg-white text-on-surface z-[60] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open
            ? "translate-x-0"
            : side === "left"
              ? "-translate-x-full"
              : "translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 p-4 border-b border-outline-variant/30 flex-shrink-0">
          {leading}
          <span className="font-headline-md text-headline-md font-bold flex-1 truncate">{title}</span>
          <button
            aria-label="Cerrar"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && <div className="flex-shrink-0">{footer}</div>}
      </div>
    </>,
    document.body,
  );
}
